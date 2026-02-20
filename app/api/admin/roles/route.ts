import { NextResponse } from "next/server";
import { z } from "zod";

import { getRoleForUserEmail, type AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

type RoleCounts = Record<AppRole, number>;

const roleSchema = z.enum(["admin", "hr_editor", "viewer", "pending_approval"]);

const putSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  role: roleSchema
});

const deleteSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase())
});

function countRoles(rows: UserRoleRow[]): RoleCounts {
  const counts: RoleCounts = {
    admin: 0,
    hr_editor: 0,
    viewer: 0,
    pending_approval: 0
  };

  for (const row of rows) {
    counts[row.role] += 1;
  }

  return counts;
}

async function listUserRoles(): Promise<UserRoleRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("id,user_email,role,created_at,updated_at")
    .order("user_email", { ascending: true });

  if (error) {
    throw new Error(`Failed to load user roles: ${error.message}`);
  }

  return data ?? [];
}

async function getAdminCount(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    throw new Error(`Failed to count admin roles: ${error.message}`);
  }

  return count ?? 0;
}

async function getUserRoleRowByEmail(email: string): Promise<UserRoleRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("id,user_email,role,created_at,updated_at")
    .eq("user_email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user role for ${email}: ${error.message}`);
  }

  return data;
}

async function requireAdminApiUser(): Promise<{ email: string; role: AppRole }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const userEmail = user.email.toLowerCase();
  const role = await getRoleForUserEmail(userEmail);

  if (role !== "admin") {
    throw new Response(JSON.stringify({ error: "Admin role required." }), {
      status: 403,
      headers: { "content-type": "application/json" }
    });
  }

  return { email: userEmail, role };
}

function asJsonResponse(error: unknown): NextResponse {
  if (error instanceof Response) {
    return new NextResponse(error.body, {
      status: error.status,
      headers: error.headers
    });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected admin API error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const currentUser = await requireAdminApiUser();
    const rows = await listUserRoles();

    return NextResponse.json(
      {
        currentUser,
        counts: countRoles(rows),
        rows
      },
      { status: 200 }
    );
  } catch (error) {
    return asJsonResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await requireAdminApiUser();
    const payload = putSchema.parse(await request.json());

    const existingRow = await getUserRoleRowByEmail(payload.email);
    const adminCount = await getAdminCount();
    const isTargetAdmin = existingRow?.role === "admin";
    const isDemotingAdmin = isTargetAdmin && payload.role !== "admin";
    const isSelfAdminRoleChange =
      payload.email === currentUser.email &&
      currentUser.role === "admin" &&
      payload.role !== "admin";

    if (isSelfAdminRoleChange) {
      return NextResponse.json(
        { error: "Cannot demote your own admin role from this screen." },
        { status: 400 }
      );
    }

    if (isDemotingAdmin && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last remaining admin." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_email: payload.email,
          role: payload.role
        },
        {
          onConflict: "user_email",
          ignoreDuplicates: false
        }
      );

    if (error) {
      throw new Error(`Failed to upsert user role: ${error.message}`);
    }

    const rows = await listUserRoles();

    return NextResponse.json(
      {
        currentUser,
        counts: countRoles(rows),
        rows
      },
      { status: 200 }
    );
  } catch (error) {
    return asJsonResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await requireAdminApiUser();
    const payload = deleteSchema.parse(await request.json());

    const existingRow = await getUserRoleRowByEmail(payload.email);
    if (!existingRow) {
      return NextResponse.json({ error: "Role row not found for that email." }, { status: 404 });
    }

    const adminCount = await getAdminCount();
    const deletingAdmin = existingRow.role === "admin";
    const deletingSelfAdmin =
      payload.email === currentUser.email && currentUser.role === "admin" && deletingAdmin;

    if (deletingSelfAdmin) {
      return NextResponse.json(
        { error: "Cannot delete your own admin role from this screen." },
        { status: 400 }
      );
    }

    if (deletingAdmin && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last remaining admin." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("user_roles").delete().eq("user_email", payload.email);

    if (error) {
      throw new Error(`Failed to delete user role: ${error.message}`);
    }

    const rows = await listUserRoles();

    return NextResponse.json(
      {
        currentUser,
        counts: countRoles(rows),
        rows
      },
      { status: 200 }
    );
  } catch (error) {
    return asJsonResponse(error);
  }
}
