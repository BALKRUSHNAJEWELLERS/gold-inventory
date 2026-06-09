import { Role } from "@prisma/client";

type PermissionNode = {
  [key in Role]: boolean;
};

// Define access control matrix based on DB roles
export const MODULE_PERMISSIONS: Record<string, PermissionNode> = {
  dashboard: { OWNER: true, MANAGER: true, SALES: true, ACCOUNTANT: true },
  inventory: { OWNER: true, MANAGER: true, SALES: false, ACCOUNTANT: false },
  purchases: { OWNER: true, MANAGER: true, SALES: false, ACCOUNTANT: true },
  sales:     { OWNER: true, MANAGER: true, SALES: true, ACCOUNTANT: true },
  customers: { OWNER: true, MANAGER: true, SALES: true, ACCOUNTANT: false },
  karigar:   { OWNER: true, MANAGER: true, SALES: false, ACCOUNTANT: false },
  repairs:   { OWNER: true, MANAGER: true, SALES: true, ACCOUNTANT: false },
  reports:   { OWNER: true, MANAGER: true, SALES: false, ACCOUNTANT: true },
  settings:  { OWNER: true, MANAGER: false, SALES: false, ACCOUNTANT: false },
};

export function hasAccess(role: Role | string, module: string): boolean {
  if (!role || !module) return false;
  const permissions = MODULE_PERMISSIONS[module.toLowerCase()];
  if (!permissions) return false;
  return permissions[role as Role] === true;
}

export function getAuthorizedModules(role: Role | string): string[] {
  if (!role) return [];
  return Object.keys(MODULE_PERMISSIONS).filter(
    (module) => MODULE_PERMISSIONS[module][role as Role] === true
  );
}
