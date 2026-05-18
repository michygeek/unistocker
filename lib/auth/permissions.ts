import { UserRole } from "@prisma/client";
import type { Permission } from "@/types";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  BOSS: [
    "products:read", "products:write", "products:delete",
    "sales:read", "sales:write",
    "staff:read", "staff:write", "staff:delete",
    "reports:read", "settings:write", "logs:read",
  ],
  MANAGER: [
    "products:read", "products:write",
    "sales:read", "sales:write",
    "staff:read",
    "reports:read", "logs:read",
  ],
  STAFF: [
    "products:read", "products:write",
    "sales:read", "sales:write",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
