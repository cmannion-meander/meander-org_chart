import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSignedIn } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const buildManagerChain = (
  employee: EmployeeRow,
  byEmployeeId: Map<string, EmployeeRow>
): EmployeeRow[] => {
  const chain: EmployeeRow[] = [];
  let cursor: EmployeeRow | undefined = employee;
  const visited = new Set<string>();

  while (cursor?.manager_employee_id) {
    if (visited.has(cursor.manager_employee_id)) {
      break;
    }

    const manager = byEmployeeId.get(cursor.manager_employee_id);
    if (!manager) {
      break;
    }

    visited.add(manager.employee_id);
    chain.push(manager);
    cursor = manager;
  }

  return chain;
};

export default async function EmployeeProfilePage(props: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await props.params;
  await requireSignedIn(`/employees/${employeeId}`);
  const supabase = await createClient();

  const { data: employeesRaw, error } = await supabase
    .from("employees")
    .select("*")
    .returns<EmployeeRow[]>();

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700">
          Failed to load employee: {error.message}
        </div>
      </main>
    );
  }

  const employees = employeesRaw ?? [];
  const byEmployeeId = new Map(employees.map((employee) => [employee.employee_id, employee] as const));
  const employee = byEmployeeId.get(employeeId);
  if (!employee) {
    notFound();
  }

  const managerChain = buildManagerChain(employee, byEmployeeId);
  const directReports = employees
    .filter((candidate) => candidate.manager_employee_id === employee.employee_id)
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Employee Profile</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">{employee.name}</h1>
        <p className="mt-2 text-sm text-zinc-700">
          {employee.title} · {employee.department} · {employee.location}
        </p>
        <p className="text-sm text-zinc-600">{employee.email}</p>
        <div className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-3">
          <p>
            <span className="text-zinc-500">Employee ID:</span> {employee.employee_id}
          </p>
          <p>
            <span className="text-zinc-500">Status:</span> {employee.status}
          </p>
          <p>
            <span className="text-zinc-500">Start Date:</span> {employee.start_date ?? "-"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Reporting Line</h2>
        {managerChain.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No manager found.</p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm text-zinc-700">
            {managerChain.map((manager) => (
              <li key={manager.employee_id}>
                <Link href={`/employees/${manager.employee_id}`} className="font-medium hover:underline">
                  {manager.name}
                </Link>{" "}
                <span className="text-zinc-500">({manager.title})</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Direct Reports</h2>
        {directReports.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No direct reports.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {directReports.map((report) => (
              <li key={report.employee_id}>
                <Link href={`/employees/${report.employee_id}`} className="text-sm font-medium hover:underline">
                  {report.name}
                </Link>
                <span className="ml-2 text-xs text-zinc-500">{report.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
