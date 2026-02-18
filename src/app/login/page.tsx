import { LoginPageClient } from "@/components/auth/login-page-client";

const sanitizeNextPath = (value: string | string[] | undefined): string => {
  if (!value) {
    return "/";
  }

  const candidate = Array.isArray(value) ? value[0] ?? "/" : value;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  return candidate;
};

export default async function LoginPage(props: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const nextPath = sanitizeNextPath(searchParams.next);

  return <LoginPageClient nextPath={nextPath} />;
}
