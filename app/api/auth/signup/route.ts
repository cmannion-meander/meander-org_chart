import { NextResponse } from "next/server";
import { z } from "zod";

import { PENDING_ROLE } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();

    const { data: existingRole, error: existingRoleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_email", payload.email)
      .maybeSingle();

    if (existingRoleError) {
      throw new Error(`Failed to inspect existing role: ${existingRoleError.message}`);
    }

    if (existingRole && existingRole.role !== PENDING_ROLE) {
      return NextResponse.json(
        {
          error: "An account already exists for this email. Ask an admin if access changes are needed."
        },
        { status: 409 }
      );
    }

    const { error: createUserError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true
    });

    if (createUserError && !createUserError.message.toLowerCase().includes("already")) {
      throw new Error(`Failed to create user: ${createUserError.message}`);
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_email: payload.email,
          role: PENDING_ROLE
        },
        {
          onConflict: "user_email",
          ignoreDuplicates: false
        }
      );

    if (roleError) {
      throw new Error(`Failed to set pending role: ${roleError.message}`);
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          "Signup request created. An admin must approve your account before you can access the app."
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join("; ")
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected signup error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
