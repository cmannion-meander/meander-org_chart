import { NextRequest, NextResponse } from "next/server";

import { getServerAuthContext, type AppRole } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const isValidRole = (value: string): value is AppRole => {
  return value === "admin" || value === "hr_editor" || value === "viewer";
};

const normalizeEmail = (value: unknown): string => String(value ?? "").trim().toLowerCase();

const isLikelyEmail = (value: string): boolean => {
  return value.includes("@") && value.includes(".");
};

const adminCount = async (): Promise<number> => {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.from("user_roles").select("user_email").eq("role", "admin");
  if (error) {
    throw new Error(error.message);
  }
  return data?.length ?? 0;
};

const requireAdmin = async () => {
  const auth = await getServerAuthContext();
  if (!auth) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  if (auth.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin role required." }, { status: 403 }) };
  }

  return { auth };
};

export async function GET() {
  const { auth, error } = await requireAdmin();
  if (error) {
    return error;
  }

  const adminClient = createAdminClient();
  const { data, error: fetchError } = await adminClient
    .from("user_roles")
    .select("user_email,role,created_at,updated_at")
    .order("user_email", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({
    currentUserEmail: auth.email,
    roles: data ?? [],
  });
}

export async function PUT(request: NextRequest) {
  const { auth, error } = await requireAdmin();
  if (error) {
    return error;
  }

  const body = (await request.json().catch(() => null)) as { userEmail?: unknown; role?: unknown } | null;
  const userEmail = normalizeEmail(body?.userEmail);
  const role = String(body?.role ?? "").trim();

  if (!isLikelyEmail(userEmail)) {
    return NextResponse.json({ error: "Valid userEmail is required." }, { status: 400 });
  }

  if (!isValidRole(role)) {
    return NextResponse.json({ error: "Valid role is required." }, { status: 400 });
  }

  if (userEmail === auth.email && role !== "admin") {
    return NextResponse.json({ error: "You cannot demote your own admin role." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: existingRole, error: existingRoleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (existingRoleError) {
    return NextResponse.json({ error: existingRoleError.message }, { status: 500 });
  }

  if (existingRole?.role === "admin" && role !== "admin") {
    const currentAdminCount = await adminCount();
    if (currentAdminCount <= 1) {
      return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
    }
  }

  const { error: upsertError } = await adminClient.from("user_roles").upsert(
    {
      user_email: userEmail,
      role,
    },
    { onConflict: "user_email" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { auth, error } = await requireAdmin();
  if (error) {
    return error;
  }

  const body = (await request.json().catch(() => null)) as { userEmail?: unknown } | null;
  const userEmail = normalizeEmail(body?.userEmail);

  if (!isLikelyEmail(userEmail)) {
    return NextResponse.json({ error: "Valid userEmail is required." }, { status: 400 });
  }

  if (userEmail === auth.email) {
    return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: targetRole, error: roleFetchError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (roleFetchError) {
    return NextResponse.json({ error: roleFetchError.message }, { status: 500 });
  }

  if (targetRole?.role === "admin") {
    const currentAdminCount = await adminCount();
    if (currentAdminCount <= 1) {
      return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
    }
  }

  const { error: deleteError } = await adminClient.from("user_roles").delete().eq("user_email", userEmail);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
