import { NextRequest, NextResponse } from "next/server";

import { getServerAuthContext } from "@/lib/auth/authorization";
import { importEmployeesFromCsv } from "@/lib/import/csv-import";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MIGRATION_FILE = "supabase/migrations/20260218160628_init_people_directory_schema.sql";

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (auth.role !== "admin" && auth.role !== "hr_editor") {
      return NextResponse.json({ error: "Insufficient role for CSV imports." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const uploadedByRaw = String(formData.get("uploadedBy") ?? "")
      .trim()
      .toLowerCase();
    const uploadedBy = uploadedByRaw || auth.email;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are supported." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "CSV file is empty." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "CSV file exceeds 5MB limit for MVP imports." },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const result = await importEmployeesFromCsv({ csvText, uploadedBy });

    const status = result.report.fatalErrors.length > 0 ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected import failure.";

    if (
      message.includes("Could not find the table 'public.employees'") ||
      message.includes(`Could not find the table 'public.import_jobs'`)
    ) {
      return NextResponse.json(
        {
          error: `Database schema is incomplete. Apply migration ${MIGRATION_FILE} to your Supabase project, then retry.`,
          details: message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
