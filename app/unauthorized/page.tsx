import Link from "next/link";

type UnauthorizedPageProps = {
  searchParams: Promise<{
    reason?: string | string[];
  }>;
};

function normalizeReason(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const params = await searchParams;
  const reason = normalizeReason(params.reason);

  return (
    <main>
      <h1>Unauthorized</h1>
      {reason === "pending_approval" ? (
        <p>Your account is pending admin approval. Ask an admin to promote you to viewer.</p>
      ) : (
        <p>You do not have permission to access that page.</p>
      )}
      <p>
        <Link href="/login">Go to Login</Link>
      </p>
    </main>
  );
}
