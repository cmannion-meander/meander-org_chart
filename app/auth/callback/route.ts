import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { sanitizeAuthRedirectPath } from "@/lib/auth/redirect";
import { getRequestOrigin } from "@/lib/http/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request);
  const nextPath = sanitizeAuthRedirectPath(requestUrl.searchParams.get("next"));

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestOrigin));
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestOrigin)
    );
  }

  if (tokenHash && isEmailOtpType(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestOrigin));
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestOrigin)
    );
  }

  return NextResponse.redirect(
    new URL("/login?error=Missing+auth+callback+parameters", requestOrigin)
  );
}
