import Link from "next/link";

import { getServerAuthContext } from "@/lib/auth/authorization";

export async function AppNav() {
  const auth = await getServerAuthContext();
  const canImport = auth?.role === "admin" || auth?.role === "hr_editor";
  const canAdmin = auth?.role === "admin";

  const navItems = auth
    ? [
        { href: "/", label: "Home" },
        { href: "/directory", label: "Directory" },
        { href: "/org-chart", label: "Org Chart" },
        ...(canImport ? [{ href: "/import", label: "Import" }] : []),
        ...(canAdmin ? [{ href: "/admin/roles", label: "Admin" }] : []),
      ]
    : [{ href: "/login", label: "Login" }];

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {auth ? (
          <div className="flex items-center gap-2">
            <p className="hidden text-xs text-zinc-500 sm:block">
              {auth.email} · <span className="font-semibold">{auth.role}</span>
            </p>
            <Link
              href="/auth/logout"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
            >
              Sign out
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
