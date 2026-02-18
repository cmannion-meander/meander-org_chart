import Link from "next/link";

import { requireSignedIn } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type DirectorySeedRow = Pick<EmployeeRow, "employee_id" | "name" | "department" | "location" | "status">;

type DirectorySearchParams = {
  q?: string;
  department?: string;
  location?: string;
  status?: string;
};

const normalizeParam = (value: string | string[] | undefined): string => {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] ?? "" : value;
};

const sortUnique = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));

export default async function DirectoryPage(props: {
  searchParams?: Promise<DirectorySearchParams>;
}) {
  await requireSignedIn("/directory");
  const searchParams = (await props.searchParams) ?? {};
  const query = normalizeParam(searchParams.q).trim();
  const department = normalizeParam(searchParams.department).trim();
  const location = normalizeParam(searchParams.location).trim();
  const status = normalizeParam(searchParams.status).trim();

  const supabase = await createClient();

  let filteredQuery = supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true });

  if (query) {
    filteredQuery = filteredQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,title.ilike.%${query}%`);
  }
  if (department) {
    filteredQuery = filteredQuery.eq("department", department);
  }
  if (location) {
    filteredQuery = filteredQuery.eq("location", location);
  }
  if (status) {
    filteredQuery = filteredQuery.eq("status", status as EmployeeRow["status"]);
  }

  const [{ data: filteredEmployeesRaw, error: filteredError }, { data: allEmployeesRaw, error: allEmployeesError }] =
    await Promise.all([
      filteredQuery,
      supabase.from("employees").select("employee_id,name,department,location,status").order("name"),
    ]);

  if (filteredError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700">
          Failed to load directory: {filteredError.message}
        </div>
      </main>
    );
  }

  if (allEmployeesError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700">
          Failed to load directory filters: {allEmployeesError.message}
        </div>
      </main>
    );
  }

  const filteredEmployees = (filteredEmployeesRaw ?? []) as EmployeeRow[];
  const allEmployees = (allEmployeesRaw ?? []) as DirectorySeedRow[];

  const managerByEmployeeId = new Map(allEmployees.map((employee) => [employee.employee_id, employee.name] as const));

  const departments = sortUnique((allEmployees ?? []).map((employee) => employee.department));
  const locations = sortUnique((allEmployees ?? []).map((employee) => employee.location));
  const statuses = sortUnique((allEmployees ?? []).map((employee) => employee.status));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Directory</h1>
        <p className="mt-2 text-sm text-zinc-600">Search and filter employees by core profile fields.</p>

        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search name, email, title"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 lg:col-span-2"
          />

          <select
            name="department"
            defaultValue={department}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">All departments</option>
            {departments.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            name="location"
            defaultValue={location}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">All locations</option>
            {locations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <div className="flex gap-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Apply
            </button>
            <Link
              href="/directory"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Results</h2>
          <p className="text-sm text-zinc-600">{filteredEmployees.length} employees</p>
        </div>

        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Manager</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id} className="border-b border-zinc-100">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/employees/${employee.employee_id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {employee.name}
                      </Link>
                      <p className="text-xs text-zinc-500">{employee.email}</p>
                    </td>
                    <td className="py-2 pr-4 text-zinc-700">{employee.title}</td>
                    <td className="py-2 pr-4 text-zinc-700">{employee.department}</td>
                    <td className="py-2 pr-4 text-zinc-700">
                      {employee.manager_employee_id
                        ? (managerByEmployeeId.get(employee.manager_employee_id) ?? employee.manager_employee_id)
                        : "-"}
                    </td>
                    <td className="py-2 pr-4 text-zinc-700">{employee.location}</td>
                    <td className="py-2 text-zinc-700">{employee.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No employees matched your filters.</p>
        )}
      </section>
    </main>
  );
}
