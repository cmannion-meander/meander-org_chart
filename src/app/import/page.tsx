import { requireRole } from "@/lib/auth/authorization";
import { ImportPageClient } from "@/components/import/import-page-client";

export default async function ImportPage() {
  await requireRole(["admin", "hr_editor"], "/import");
  return <ImportPageClient />;
}
