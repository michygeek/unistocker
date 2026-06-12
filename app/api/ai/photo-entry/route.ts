import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callClaudeJSON } from "@/lib/ai/claude";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface PhotoEntryResult {
  name?: string;
  description?: string;
  category?: string;
  suggestedSellingPrice?: number;
  suggestedCostPrice?: number;
  barcode?: string | null;
  unit?: string;
  confidence?: number;
  notes?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    let cloudinaryUrl: string;

    if (imageFile && imageFile.size > 0) {
      // Upload to Cloudinary first
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "unistocker/photo-entry", resource_type: "image" }, (err, res) => {
            if (err || !res) reject(err);
            else resolve(res as { secure_url: string; public_id: string });
          })
          .end(buffer);
      });
      cloudinaryUrl = uploaded.secure_url;
    } else if (imageUrl) {
      cloudinaryUrl = imageUrl;
    } else {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const systemPrompt = `You are a product recognition AI for African inventory management.
Analyse this product image and return ONLY valid JSON — no markdown:
{
  "name": "specific product name including brand if visible",
  "description": "1-2 sentence product description",
  "category": "one of [Food & Beverages, Electronics, Clothing, Household, Cosmetics & Beauty, Stationery, Pharmaceuticals, Automotive, Agriculture, Other]",
  "suggestedSellingPrice": "retail price in Naira as integer (typical Nigerian market price)",
  "suggestedCostPrice": "estimated wholesale price in Naira (typically 40-70% of selling price)",
  "barcode": "barcode number if clearly visible or null",
  "unit": "piece | kg | litre | pack | carton | dozen | other",
  "confidence": "0 to 1",
  "notes": "any helpful notes for the business owner"
}
If the image is unclear or not a product:
{ "error": "Could not identify a product in this image", "confidence": 0 }`;

    let result: PhotoEntryResult;
    try {
      // Use Claude Vision with the Cloudinary URL
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "url", url: cloudinaryUrl },
              },
              {
                type: "text",
                text: "Analyse this product image and return the JSON as instructed.",
              },
            ],
          },
        ],
      });

      const text = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      result = JSON.parse(clean) as PhotoEntryResult;
    } catch {
      return NextResponse.json({ error: "AI temporarily unavailable. Please fill in manually." }, { status: 503 });
    }

    return NextResponse.json({ result, imageUrl: cloudinaryUrl });
  } catch (err) {
    console.error("[AI:photo-entry]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
