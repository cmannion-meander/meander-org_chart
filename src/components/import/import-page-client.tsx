"use client";

import { type FormEvent, useMemo, useState } from "react";

type ImportRejectedRow = {
  rowNumber: number;
  employeeId: string;
  errors: string[];
};

type CsvImportReport = {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  rejectedCount: number;
  rejectedRows: ImportRejectedRow[];
  fatalErrors: string[];
  errorCsv: string | null;
};

type CsvImportResponse = {
  jobId: string | null;
  report: CsvImportReport;
};

const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function ImportPageClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResponse | null>(null);

  const hasFatalError = useMemo(() => Boolean(result?.report.fatalErrors.length), [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setErrorMessage("Select a CSV file to import.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/imports/csv", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as CsvImportResponse & { error?: string };

      if (!response.ok && !payload.report) {
        setErrorMessage(payload.error ?? "Import failed.");
        return;
      }

      if (payload.report) {
        setResult({
          jobId: payload.jobId ?? null,
          report: payload.report,
        });
      }

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Import completed with validation errors.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">CSV Import</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Upload an HRIS export to create or update employees by <code>employee_id</code>.
        </p>

        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Uploaded By (email)
            <input
              name="uploadedBy"
              type="email"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              placeholder="hr_editor@company.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            CSV File
            <input
              name="file"
              type="file"
              accept=".csv,text/csv"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              required
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Importing..." : "Run Import"}
            </button>
          </div>
        </form>

        {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}
      </section>

      {result ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-900">Import Result</h2>
            {result.jobId ? <p className="text-xs text-zinc-500">Job ID: {result.jobId}</p> : null}
          </div>

          {hasFatalError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {result.report.fatalErrors.join(" ")}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Rows</p>
              <p className="text-2xl font-semibold text-zinc-900">{result.report.totalRows}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Created</p>
              <p className="text-2xl font-semibold text-emerald-700">{result.report.createdCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Updated</p>
              <p className="text-2xl font-semibold text-sky-700">{result.report.updatedCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Rejected</p>
              <p className="text-2xl font-semibold text-rose-700">{result.report.rejectedCount}</p>
            </div>
          </div>

          {result.report.errorCsv ? (
            <button
              type="button"
              className="mt-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
              onClick={() => downloadCsv(result.report.errorCsv ?? "", "import-errors.csv")}
            >
              Download Error CSV
            </button>
          ) : null}

          {result.report.rejectedRows.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-600">
                    <th className="py-2 pr-4">Row</th>
                    <th className="py-2 pr-4">Employee ID</th>
                    <th className="py-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {result.report.rejectedRows.slice(0, 100).map((row) => (
                    <tr key={`${row.rowNumber}-${row.employeeId}`} className="border-b border-zinc-100 align-top">
                      <td className="py-2 pr-4 text-zinc-700">{row.rowNumber}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-700">{row.employeeId || "-"}</td>
                      <td className="py-2 text-zinc-700">{row.errors.join(" ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.report.rejectedRows.length > 100 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Showing first 100 rejected rows. Download the error CSV for the full list.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
