import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { sanitizeAuthRedirectPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/server";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

function normalizeNextParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeOptionalParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeAuthRedirectPath(normalizeNextParam(params.next));
  const callbackError = normalizeOptionalParam(params.error);

  const user = await getAuthenticatedUser();
  if (user) {
    redirect(nextPath);
  }

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in with Microsoft OAuth or password. New users can request access via sign up.</p>
      {callbackError ? <p className="error">{callbackError}</p> : null}
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
