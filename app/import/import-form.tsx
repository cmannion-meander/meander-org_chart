"use client";

import { useMemo, useState } from "react";

type RejectedImportRow = {
  rowNumber: number;
  employeeId: string;
  reasons: string[];
  row: Record<string, string>;
};

type CsvImportResponse = {
  importJobId: string;
  summary: {
    rowsTotal: number;
    rowsCreated: number;
    rowsUpdated: number;
    rowsRejected: number;
    rowsUnchanged: number;
  };
  rejectedRows: RejectedImportRow[];
  rejectedRowsCsv: string;
};

export function ImportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResponse | null>(null);

  const downloadHref = useMemo(() => {
    if (!result || result.summary.rowsRejected === 0) {
      return null;
    }

    return `data:text/csv;charset=utf-8,${encodeURIComponent(result.rejectedRowsCsv)}`;
  }, [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/imports/csv", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as Partial<CsvImportResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "CSV import failed.");
      }

      setResult(payload as CsvImportResponse);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV import failed.";
      setErrorMessage(message);
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="filter-form import-form" onSubmit={handleSubmit}>
        <label>
          CSV file
          <input type="file" name="file" accept=".csv,text/csv" required />
        </label>

        <div className="filter-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Importing..." : "Import CSV"}
          </button>
        </div>
      </form>

      {errorMessage ? <p className="error">{errorMessage}</p> : null}

      {result ? (
        <section className="status">
          <h2>Import Summary</h2>
          <div className="summary-grid">
            <p>
              <strong>Total Rows:</strong> {result.summary.rowsTotal}
            </p>
            <p>
              <strong>Created:</strong> {result.summary.rowsCreated}
            </p>
            <p>
              <strong>Updated:</strong> {result.summary.rowsUpdated}
            </p>
            <p>
              <strong>Unchanged:</strong> {result.summary.rowsUnchanged}
            </p>
            <p>
              <strong>Rejected:</strong> {result.summary.rowsRejected}
            </p>
            <p>
              <strong>Import Job ID:</strong> {result.importJobId}
            </p>
          </div>

          {result.summary.rowsRejected > 0 ? (
            <>
              <p>
                <a href={downloadHref ?? undefined} download="import_rejections.csv">
                  Download rejected rows CSV
                </a>
              </p>

              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Employee ID</th>
                      <th>Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rejectedRows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.employeeId}`}>
                        <td>{row.rowNumber}</td>
                        <td>{row.employeeId || "(empty)"}</td>
                        <td>{row.reasons.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="ok">No rejected rows.</p>
          )}
        </section>
      ) : null}
    </>
  );
}
