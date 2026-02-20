import Link from "next/link";

import { getRoleForUserEmail } from "@/lib/auth/roles";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function TopNav() {
  const user = await getAuthenticatedUser();
  const role = await getRoleForUserEmail(user?.email);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Directory" },
    { href: "/org-chart", label: "Org Chart" },
    { href: "/import", label: "Import" }
  ];

  if (role === "admin") {
    navItems.push({ href: "/admin/roles", label: "Admin" });
  }

  return (
    <header className="top-nav-wrap">
      <nav className="top-nav" aria-label="Primary">
        <div className="top-nav__left">
          <Link href="/" className="top-nav__brand">
            Meander
          </Link>
          <span className="top-nav__tagline">People Ops Workspace</span>
        </div>

        <div className="top-nav__right">
          <ul className="top-nav__links">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            {user ? (
              <li>
                <form action="/auth/logout" method="post">
                  <button type="submit">Logout</button>
                </form>
              </li>
            ) : (
              <li>
                <Link href="/login">Login</Link>
              </li>
            )}
          </ul>

          <div className="top-nav__identity" aria-label="Signed-in context">
            <span className="top-nav__identity-email">{user?.email ?? "Guest"}</span>
            <span className="top-nav__identity-role">{user ? role : "anonymous"}</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
