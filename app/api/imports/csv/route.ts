import { NextResponse } from "next/server";

import { getRoleForUserEmail } from "@/lib/auth/roles";
import {
  CsvImportRequestError,
  importEmployeesFromCsv
} from "@/lib/imports/csv-import-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const role = await getRoleForUserEmail(user.email);
    if (role !== "admin" && role !== "hr_editor") {
      return NextResponse.json({ error: "Insufficient role for CSV import." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A CSV file is required." }, { status: 400 });
    }

    const csvText = await file.text();
    if (!csvText.trim()) {
      return NextResponse.json({ error: "CSV file is empty." }, { status: 400 });
    }

    const result = await importEmployeesFromCsv({
      csvText,
      sourceFileName: file.name,
      uploadedByEmail: user.email ?? "system@local.internal"
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CsvImportRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unexpected import error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
