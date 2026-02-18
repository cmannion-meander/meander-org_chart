import Link from "next/link";

import { requireSignedIn } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

const getEmployeesCount = async () => {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true });

    if (error) {
      return { ok: false as const, message: error.message };
    }

    return { ok: true as const, count: count ?? 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false as const, message };
  }
};

export default async function Home() {
  const auth = await requireSignedIn("/");
  const dbStatus = await getEmployeesCount();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-6 py-20 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Meander Org Chart
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Foundation Setup Complete
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-600">
          Next.js and Supabase project scaffolding is in place. MVP feature development starts next
          with authentication, role gates, and the CSV import flow.
        </p>
        {dbStatus.ok ? (
          <p className="mt-4 text-sm text-emerald-700">
            Supabase connection OK. Current employees row count: {dbStatus.count}
          </p>
        ) : (
          <p className="mt-4 text-sm text-rose-700">Supabase connection failed: {dbStatus.message}</p>
        )}
        {auth.role === "admin" || auth.role === "hr_editor" ? (
          <div className="mt-6">
            <Link
              href="/import"
              className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Open CSV Import
            </Link>
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            You are signed in as a viewer. Import access requires <code>hr_editor</code> or{" "}
            <code>admin</code>.
          </p>
        )}
      </section>
    </main>
  );
}
