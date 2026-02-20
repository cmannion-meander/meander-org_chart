import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EmployeeProfilePageProps = {
  params: Promise<{ employeeId: string }>;
};

export default async function EmployeeProfilePage({ params }: EmployeeProfilePageProps) {
  const { employeeId } = await params;
  await requireAuthenticatedUser(`/employees/${employeeId}`);

  const supabase = await createSupabaseServerClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "employee_id,name,email,title,department,location,status,start_date,photo_url,manager_employee_id"
    )
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load employee profile: ${error.message}`);
  }

  if (!employee) {
    notFound();
  }

  const [managerResult, reportsResult] = await Promise.all([
    employee.manager_employee_id
      ? supabase
          .from("employees")
          .select("employee_id,name,title,email")
          .eq("employee_id", employee.manager_employee_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("employees")
      .select("employee_id,name,title,email")
      .eq("manager_employee_id", employee.employee_id)
      .order("name", { ascending: true })
  ]);

  if (managerResult.error) {
    throw new Error(`Failed to load manager details: ${managerResult.error.message}`);
  }

  if (reportsResult.error) {
    throw new Error(`Failed to load direct reports: ${reportsResult.error.message}`);
  }

  const manager = managerResult.data;
  const directReports = reportsResult.data ?? [];

  return (
    <main>
      <h1>{employee.name}</h1>
      <p>
        {employee.title} · {employee.department}
      </p>

      <section className="profile-grid">
        <div className="status">
          <h2>Core Fields</h2>
          <p>
            <strong>Employee ID:</strong> {employee.employee_id}
          </p>
          <p>
            <strong>Email:</strong> <a href={`mailto:${employee.email}`}>{employee.email}</a>
          </p>
          <p>
            <strong>Location:</strong> {employee.location}
          </p>
          <p>
            <strong>Status:</strong> {employee.status}
          </p>
          <p>
            <strong>Start Date:</strong> {employee.start_date ?? "Not set"}
          </p>
        </div>

        <div className="status">
          <h2>Direct Manager</h2>
          {manager ? (
            <p>
              <Link href={`/employees/${manager.employee_id}`}>{manager.name}</Link>
              <br />
              <span className="meta">{manager.title}</span>
            </p>
          ) : (
            <p className="meta">No manager assigned.</p>
          )}
        </div>
      </section>

      <section className="status">
        <h2>Direct Reports</h2>
        {directReports.length === 0 ? (
          <p className="meta">No direct reports.</p>
        ) : (
          <ul>
            {directReports.map((report) => (
              <li key={report.employee_id}>
                <Link href={`/employees/${report.employee_id}`}>{report.name}</Link>
                <span className="meta"> · {report.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
