import { RolesAdminClient } from "@/app/admin/roles/roles-admin-client";
import { requireAnyRole } from "@/lib/auth/server";

export default async function AdminRolesPage() {
  const { user, role } = await requireAnyRole(["admin"], "/admin/roles");

  return (
    <main>
      <h1>Admin Role Management</h1>
      <p>Manage role assignments for application access control.</p>

      <RolesAdminClient
        currentUserEmail={user.email ?? ""}
        currentUserRole={role}
      />
    </main>
  );
}
