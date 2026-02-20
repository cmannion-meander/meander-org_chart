import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

const passwordLoginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128)
});

export async function POST(request: NextRequest) {
  try {
    const payload = passwordLoginSchema.parse(await request.json());

    const response = NextResponse.json({ ok: true }, { status: 200 });

    const env = getPublicEnv();

    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const cookie of cookiesToSet) {
              response.cookies.set(cookie.name, cookie.value, cookie.options);
            }
          }
        }
      }
    );

    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join("; ")
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected password login error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
