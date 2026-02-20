import Link from "next/link";

import {
  EMPLOYEE_STATUSES,
  isEmployeeStatus,
  normalizeQueryValue
} from "@/lib/employees";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DirectoryPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    department?: string | string[];
    location?: string | string[];
    status?: string | string[];
  }>;
};

function escapeOrSearch(value: string): string {
  return value
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("*", " ")
    .trim();
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  await requireAuthenticatedUser("/directory");

  const params = await searchParams;
  const search = normalizeQueryValue(params.q);
  const department = normalizeQueryValue(params.department);
  const location = normalizeQueryValue(params.location);
  const statusParam = normalizeQueryValue(params.status);
  const status = isEmployeeStatus(statusParam) ? statusParam : "";

  const supabase = await createSupabaseServerClient();

  let directoryQuery = supabase
    .from("employees")
    .select(
      "employee_id,name,email,title,department,location,status,manager_employee_id"
    )
    .order("name", { ascending: true });

  if (search) {
    const safeSearch = escapeOrSearch(search);
    directoryQuery = directoryQuery.or(
      `name.ilike.*${safeSearch}*,email.ilike.*${safeSearch}*,title.ilike.*${safeSearch}*`
    );
  }

  if (department) {
    directoryQuery = directoryQuery.eq("department", department);
  }

  if (location) {
    directoryQuery = directoryQuery.eq("location", location);
  }

  if (status) {
    directoryQuery = directoryQuery.eq("status", status);
  }

  const [{ data: employees, error: employeesError }, { data: allFilterValues, error: filtersError }] =
    await Promise.all([
      directoryQuery,
      supabase.from("employees").select("department,location")
    ]);

  if (employeesError) {
    throw new Error(`Failed to load directory data: ${employeesError.message}`);
  }

  if (filtersError) {
    throw new Error(`Failed to load directory filters: ${filtersError.message}`);
  }

  const departments = Array.from(new Set((allFilterValues ?? []).map((row) => row.department))).sort();
  const locations = Array.from(new Set((allFilterValues ?? []).map((row) => row.location))).sort();

  return (
    <main>
      <h1>Directory</h1>
      <p>Search by name, email, or title and filter by department, location, and status.</p>

      <form className="filter-form" method="get" action="/directory">
        <label>
          Search
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Name, email, or title"
          />
        </label>

        <label>
          Department
          <select name="department" defaultValue={department}>
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Location
          <select name="location" defaultValue={location}>
            <option value="">All locations</option>
            {locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {EMPLOYEE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="filter-actions">
          <button type="submit">Apply</button>
          <Link href="/directory">Reset</Link>
        </div>
      </form>

      <section className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Status</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {(employees ?? []).map((employee) => (
              <tr key={employee.employee_id}>
                <td>
                  <Link href={`/employees/${employee.employee_id}`}>{employee.name}</Link>
                </td>
                <td>{employee.title}</td>
                <td>{employee.department}</td>
                <td>{employee.location}</td>
                <td>{employee.status}</td>
                <td>
                  <a href={`mailto:${employee.email}`}>{employee.email}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {employees && employees.length === 0 ? (
        <p className="meta">No employees matched this filter set.</p>
      ) : null}
    </main>
  );
}
