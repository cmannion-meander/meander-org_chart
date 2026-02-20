import Link from "next/link";
import type { ReactNode } from "react";

import { requireAuthenticatedUser } from "@/lib/auth/server";
import { normalizeQueryValue, type Employee } from "@/lib/employees";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrgChartPageProps = {
  searchParams: Promise<{
    root?: string | string[];
  }>;
};

function buildReportsMap(employees: Employee[]): Map<string, Employee[]> {
  const map = new Map<string, Employee[]>();

  for (const employee of employees) {
    if (!employee.manager_employee_id) {
      continue;
    }

    const existing = map.get(employee.manager_employee_id) ?? [];
    existing.push(employee);
    map.set(employee.manager_employee_id, existing);
  }

  for (const directReports of map.values()) {
    directReports.sort((a, b) => a.name.localeCompare(b.name));
  }

  return map;
}

function renderTree(
  employee: Employee,
  reportsMap: Map<string, Employee[]>,
  path: Set<string>
): ReactNode {
  if (path.has(employee.employee_id)) {
    return (
      <li key={employee.employee_id}>
        <span className="error">Cycle detected at {employee.employee_id}</span>
      </li>
    );
  }

  const nextPath = new Set(path);
  nextPath.add(employee.employee_id);

  const reports = reportsMap.get(employee.employee_id) ?? [];

  return (
    <li key={employee.employee_id}>
      <div className="org-node">
        <Link href={`/employees/${employee.employee_id}`}>{employee.name}</Link>
        <span>
          {employee.title} · {employee.department} · {employee.location}
        </span>
      </div>
      {reports.length > 0 ? (
        <ul>
          {reports.map((report) => renderTree(report, reportsMap, nextPath))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function OrgChartPage({ searchParams }: OrgChartPageProps) {
  await requireAuthenticatedUser("/org-chart");

  const params = await searchParams;
  const selectedRoot = normalizeQueryValue(params.root);

  const supabase = await createSupabaseServerClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select(
      "employee_id,name,title,department,location,status,manager_employee_id,start_date,email,photo_url,id,created_at,updated_at"
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load org chart data: ${error.message}`);
  }

  const allEmployees = employees ?? [];

  if (allEmployees.length === 0) {
    return (
      <main>
        <h1>Org Chart</h1>
        <p className="meta">No employee records are available yet.</p>
      </main>
    );
  }

  const byEmployeeId = new Map(allEmployees.map((employee) => [employee.employee_id, employee]));
  const reportsMap = buildReportsMap(allEmployees);

  const topLevel = allEmployees.filter(
    (employee) =>
      employee.manager_employee_id === null || !byEmployeeId.has(employee.manager_employee_id)
  );

  const rootEmployee = selectedRoot
    ? byEmployeeId.get(selectedRoot) ?? null
    : topLevel.length === 1
      ? topLevel[0]
      : null;

  return (
    <main>
      <h1>Org Chart</h1>
      <p>Hierarchy is derived from each employee&apos;s manager assignment.</p>

      <form method="get" action="/org-chart" className="filter-form">
        <label>
          Root employee
          <select name="root" defaultValue={rootEmployee?.employee_id ?? ""}>
            <option value="">Select a root</option>
            {allEmployees.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.name} ({employee.employee_id})
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <button type="submit">Show Tree</button>
        </div>
      </form>

      {!rootEmployee ? (
        <p className="meta">
          {topLevel.length === 1
            ? "No valid root selected."
            : "Select a root employee to render this org chart."}
        </p>
      ) : (
        <section className="tree-wrap" aria-label="Organization hierarchy">
          <ul>{renderTree(rootEmployee, reportsMap, new Set())}</ul>
        </section>
      )}
    </main>
  );
}
