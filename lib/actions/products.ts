"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/auth/permissions";
import { addNotificationJob, addActivityLogJob, addStockCheckJob } from "@/lib/queue";
import { notifyAllBossUsers } from "@/lib/notifications";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ProductSchema = z.object({
  name: z.string().min(2).max(100),
  sku: z.string().min(2).max(50),
  description: z.string().optional(),
  costPrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0),
  lowStockAlert: z.coerce.number().int().min(0).default(10),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

export async function createProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "products:write")) throw new Error("Forbidden");

  const raw = Object.fromEntries(formData.entries());
  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const data = parsed.data;

  const existing = await db.product.findUnique({ where: { sku: data.sku } });
  if (existing) return { error: { sku: ["SKU already exists"] } };

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "unistocker/products" }, (err, res) => {
          if (err || !res) reject(err);
          else resolve(res as { secure_url: string; public_id: string });
        })
        .end(buffer);
    });
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const product = await db.product.create({
    data: {
      ...data,
      imageUrl,
      imagePublicId,
      createdById: session.user.id,
      branchId: session.user.branchId ?? undefined,
    },
  });

  if (product.quantity > 0) {
    await db.inventoryTransaction.create({
      data: {
        type: "STOCK_IN",
        quantity: product.quantity,
        notes: "Initial stock",
        productId: product.id,
        userId: session.user.id,
      },
    });
  }

  await addActivityLogJob({
    userId: session.user.id,
    action: "CREATE",
    entity: "Product",
    entityId: product.id,
    description: `Created product "${product.name}" (SKU: ${product.sku}) with ${product.quantity} units`,
  });

  await notifyAllBossUsers(
    "New Product Added",
    `${session.user.name ?? session.user.email} added "${product.name}" to inventory`,
    "PRODUCT_CREATED",
    { productId: product.id }
  );

  revalidatePath("/inventory");
  return { success: true, product };
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "products:write")) throw new Error("Forbidden");

  const raw = Object.fromEntries(formData.entries());
  const parsed = ProductSchema.partial().safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing) return { error: "Product not found" };

  const priceChanged =
    parsed.data.sellingPrice !== undefined &&
    Number(existing.sellingPrice) !== parsed.data.sellingPrice;

  let imageUrl = existing.imageUrl ?? undefined;
  let imagePublicId = existing.imagePublicId ?? undefined;

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imagePublicId) await cloudinary.uploader.destroy(imagePublicId);
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "unistocker/products" }, (err, res) => {
          if (err || !res) reject(err);
          else resolve(res as { secure_url: string; public_id: string });
        })
        .end(buffer);
    });
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const product = await db.product.update({
    where: { id: productId },
    data: { ...parsed.data, imageUrl, imagePublicId },
  });

  await addActivityLogJob({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Product",
    entityId: product.id,
    description: `Updated product "${product.name}"`,
    metadata: { changes: parsed.data },
  });

  if (priceChanged) {
    await notifyAllBossUsers(
      "Product Price Changed",
      `"${product.name}" price changed from ₦${existing.sellingPrice} to ₦${product.sellingPrice} by ${session.user.name ?? session.user.email}`,
      "PRICE_CHANGE",
      { productId: product.id }
    );
  }

  revalidatePath("/inventory");
  return { success: true, product };
}

export async function adjustStock(
  productId: string,
  quantity: number,
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "RETURN",
  notes?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "products:write")) throw new Error("Forbidden");

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const delta = type === "STOCK_OUT" ? -Math.abs(quantity) : Math.abs(quantity);
  const newQty = product.quantity + delta;
  if (newQty < 0) return { error: "Insufficient stock" };

  const [updatedProduct, transaction] = await db.$transaction([
    db.product.update({
      where: { id: productId },
      data: { quantity: newQty },
    }),
    db.inventoryTransaction.create({
      data: { type, quantity: Math.abs(quantity), notes, productId, userId: session.user.id },
    }),
  ]);

  const actionLabel = type === "STOCK_IN" ? "added" : type === "STOCK_OUT" ? "removed" : "adjusted";
  await addActivityLogJob({
    userId: session.user.id,
    action: type,
    entity: "InventoryTransaction",
    entityId: transaction.id,
    description: `${actionLabel} ${Math.abs(quantity)} units of "${product.name}". New total: ${newQty}`,
  });

  await notifyAllBossUsers(
    `Stock ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`,
    `${session.user.name ?? session.user.email} ${actionLabel} ${Math.abs(quantity)} units of "${product.name}". Stock: ${newQty}`,
    `STOCK_${type}`,
    { productId, quantity: delta, newQty }
  );

  await addStockCheckJob(productId);

  revalidatePath("/inventory");
  return { success: true, product: updatedProduct, transaction };
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "products:delete")) throw new Error("Forbidden");

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found" };

  if (product.imagePublicId) {
    await cloudinary.uploader.destroy(product.imagePublicId).catch(console.error);
  }

  await db.product.update({ where: { id: productId }, data: { isActive: false } });

  await addActivityLogJob({
    userId: session.user.id,
    action: "DELETE",
    entity: "Product",
    entityId: productId,
    description: `Deleted product "${product.name}"`,
  });

  await notifyAllBossUsers(
    "Product Removed",
    `${session.user.name ?? session.user.email} removed "${product.name}" from inventory`,
    "PRODUCT_DELETED",
    { productId }
  );

  revalidatePath("/inventory");
  return { success: true };
}
