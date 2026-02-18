import { RolesAdminClient } from "@/components/admin/roles-admin-client";
import { requireRole } from "@/lib/auth/authorization";

export default async function AdminRolesPage() {
  const auth = await requireRole(["admin"], "/admin/roles");

  return <RolesAdminClient initialEmail={auth.email} />;
}
