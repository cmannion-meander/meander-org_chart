import { checkSupabaseConnection } from "@/lib/supabase/health";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await checkSupabaseConnection();

  return (
    <main>
      <h1>Meander Workspace</h1>
      <p>
        Internal SaaS portal for directory visibility, org structure insight, and controlled HR
        administration.
      </p>

      <section className="status" aria-live="polite">
        <h2>System Health</h2>
        <strong className={result.ok ? "ok" : "error"}>{result.message}</strong>
        <p className="meta">Supabase HTTP status: {result.status ?? "unavailable"}</p>
      </section>

      <section className="status">
        <h2>Quick Actions</h2>
        <div className="summary-grid">
          <p>
            <Link href="/directory">Browse Directory</Link>
          </p>
          <p>
            <Link href="/org-chart">Explore Org Chart</Link>
          </p>
          <p>
            <Link href="/import">Import Employee CSV</Link>
          </p>
          <p>
            <Link href="/admin/roles">Manage Roles</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
