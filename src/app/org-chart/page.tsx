import Link from "next/link";

import { requireSignedIn } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const renderTree = (
  employeeId: string,
  byEmployeeId: Map<string, EmployeeRow>,
  childrenByManagerId: Map<string, EmployeeRow[]>,
  visited: Set<string>
): React.ReactNode => {
  if (visited.has(employeeId)) {
    return (
      <li className="ml-6 list-disc py-1 text-sm text-rose-700">
        Cycle detected at {employeeId}. This branch is truncated.
      </li>
    );
  }

  const employee = byEmployeeId.get(employeeId);
  if (!employee) {
    return null;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(employeeId);
  const children = childrenByManagerId.get(employeeId) ?? [];

  return (
    <li key={employee.employee_id} className="py-2">
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
        <Link href={`/employees/${employee.employee_id}`} className="font-medium text-zinc-900 hover:underline">
          {employee.name}
        </Link>
        <p className="text-xs text-zinc-600">
          {employee.title} · {employee.department} · {employee.location}
        </p>
      </div>

      {children.length > 0 ? (
        <ul className="ml-6 mt-2 border-l border-zinc-200 pl-4">
          {children.map((child) =>
            renderTree(child.employee_id, byEmployeeId, childrenByManagerId, nextVisited)
          )}
        </ul>
      ) : null}
    </li>
  );
};

const normalizeParam = (value: string | string[] | undefined): string => {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] ?? "" : value;
};

export default async function OrgChartPage(props: {
  searchParams?: Promise<{ root?: string }>;
}) {
  await requireSignedIn("/org-chart");
  const searchParams = (await props.searchParams) ?? {};
  const requestedRoot = normalizeParam(searchParams.root).trim();
  const supabase = await createClient();

  const { data: employeesRaw, error } = await supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true })
    .returns<EmployeeRow[]>();

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700">
          Failed to load org chart: {error.message}
        </div>
      </main>
    );
  }

  const employees = employeesRaw ?? [];

  if (employees.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-700">
          No employees found. Import a CSV from <Link href="/import" className="underline">Import</Link> first.
        </div>
      </main>
    );
  }

  const byEmployeeId = new Map(employees.map((employee) => [employee.employee_id, employee] as const));
  const childrenByManagerId = new Map<string, EmployeeRow[]>();

  for (const employee of employees) {
    const managerId = employee.manager_employee_id;
    if (!managerId) {
      continue;
    }

    const children = childrenByManagerId.get(managerId) ?? [];
    children.push(employee);
    childrenByManagerId.set(managerId, children);
  }

  const roots = employees.filter(
    (employee) => !employee.manager_employee_id || !byEmployeeId.has(employee.manager_employee_id)
  );

  const selectedRoot =
    (requestedRoot ? byEmployeeId.get(requestedRoot) : undefined) ??
    (roots.length === 1 ? roots[0] : roots[0] ?? employees[0]);

  if (!selectedRoot) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-700">
          No root employee could be determined for the org chart.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Org Chart</h1>
        <p className="mt-2 text-sm text-zinc-600">Hierarchical view based on manager relationships.</p>

        <form method="get" className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-700">
            Root:
            <select
              name="root"
              defaultValue={selectedRoot.employee_id}
              className="ml-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            >
              {employees.map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.name} ({employee.employee_id})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Apply Root
          </button>
        </form>

        {roots.length > 1 ? (
          <p className="mt-3 text-xs text-amber-700">
            Multiple top-level roots detected ({roots.length}). Root selector is required.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
        <ul>{renderTree(selectedRoot.employee_id, byEmployeeId, childrenByManagerId, new Set())}</ul>
      </section>
    </main>
  );
}
