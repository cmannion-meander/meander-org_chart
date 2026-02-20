import { NextResponse } from "next/server";

import { getRequestOrigin } from "@/lib/http/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: Request) {
  const requestOrigin = getRequestOrigin(request);
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", requestOrigin));
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}

export async function GET(request: Request) {
  const requestOrigin = getRequestOrigin(request);
  return NextResponse.redirect(new URL("/login", requestOrigin));
}
