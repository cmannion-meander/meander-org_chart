import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10 sm:px-10">
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-amber-900">Access denied</h1>
        <p className="mt-2 text-sm text-amber-800">
          Your account is signed in but does not have permission for this page.
        </p>
        <div className="mt-5 flex gap-2">
          <Link href="/" className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white">
            Go Home
          </Link>
          <Link href="/auth/logout" className="rounded-lg border border-amber-700 px-4 py-2 text-sm font-medium text-amber-900">
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}
