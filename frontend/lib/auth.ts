// Step 8: Mock Authentication
export interface User {
  id: string
  username: string
  role: "contributor" | "admin"
  permissions: string[]
}

const MOCK_USERS: Record<string, User> = {
  netrunnerX: {
    id: "netrunnerX",
    username: "netrunnerX",
    role: "contributor",
    permissions: ["create_disaster", "create_report", "view_disasters"],
  },
  reliefAdmin: {
    id: "reliefAdmin",
    username: "reliefAdmin",
    role: "admin",
    permissions: [
      "create_disaster",
      "create_report",
      "view_disasters",
      "update_disaster",
      "delete_disaster",
      "manage_resources",
    ],
  },
}

export function getCurrentUser(): User {
  // In a real app, this would check session/token
  // For demo purposes, we will consistently use the admin user
  // to ensure all functionality is available.
  return MOCK_USERS.reliefAdmin;
}

export function hasPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission)
}

export async function logAuditTrail(
  entityType: string,
  entityId: number,
  action: string,
  userId: string,
  details?: any,
): Promise<void> {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details: details || {},
  }

  // In a real implementation, this would insert into the audit_trail table
  console.log(`Audit: ${entityType}:${entityId}`, auditEntry)
}
