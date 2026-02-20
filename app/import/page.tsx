import { ImportForm } from "@/app/import/import-form";
import { requireAnyRole } from "@/lib/auth/server";
import { EDITOR_ROLES } from "@/lib/auth/roles";

export default async function ImportPage() {
  await requireAnyRole(EDITOR_ROLES, "/import");

  return (
    <main>
      <h1>Import Employees CSV</h1>
      <p>
        Upload a roster CSV to validate, upsert by <code>employee_id</code>, and capture rejected
        rows.
      </p>
      <ImportForm />
    </main>
  );
}
