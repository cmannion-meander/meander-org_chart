"use client";

import { useEffect, useMemo, useState } from "react";

import type { Database } from "@/lib/supabase/types";

type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

type RolesApiPayload = {
  currentUser: {
    email: string;
    role: AppRole;
  };
  counts: Record<AppRole, number>;
  rows: UserRoleRow[];
};

const ROLES: readonly AppRole[] = ["admin", "hr_editor", "viewer", "pending_approval"] as const;

type RolesAdminClientProps = {
  currentUserEmail: string;
  currentUserRole: AppRole;
};

export function RolesAdminClient({ currentUserEmail, currentUserRole }: RolesAdminClientProps) {
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [counts, setCounts] = useState<Record<AppRole, number>>({
    admin: 0,
    hr_editor: 0,
    viewer: 0,
    pending_approval: 0
  });
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<AppRole>("viewer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const totalRows = useMemo(() => rows.length, [rows]);

  async function loadRows() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "GET",
        cache: "no-store"
      });

      const payload = (await response.json()) as RolesApiPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load role rows.");
      }

      setRows(payload.rows);
      setCounts(payload.counts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load role rows.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function handleUpsert(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email: formEmail,
          role: formRole
        })
      });

      const payload = (await response.json()) as RolesApiPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save role row.");
      }

      setRows(payload.rows);
      setCounts(payload.counts);
      setStatusMessage("Role saved.");
      setFormEmail("");
      setFormRole("viewer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save role row.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(email: string) {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as RolesApiPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete role row.");
      }

      setRows(payload.rows);
      setCounts(payload.counts);
      setStatusMessage("Role deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete role row.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function approveToViewer(email: string) {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ email, role: "viewer" })
      });

      const payload = (await response.json()) as RolesApiPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to approve user.");
      }

      setRows(payload.rows);
      setCounts(payload.counts);
      setStatusMessage("User approved as viewer.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve user.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <section className="status">
        <h2>Current Admin Session</h2>
        <p>
          <strong>Email:</strong> {currentUserEmail}
        </p>
        <p>
          <strong>Role:</strong> {currentUserRole}
        </p>
      </section>

      <section className="status">
        <h2>Role Counts</h2>
        <div className="summary-grid">
          <p>
            <strong>Admins:</strong> {counts.admin}
          </p>
          <p>
            <strong>HR Editors:</strong> {counts.hr_editor}
          </p>
          <p>
            <strong>Viewers:</strong> {counts.viewer}
          </p>
          <p>
            <strong>Pending Approval:</strong> {counts.pending_approval}
          </p>
          <p>
            <strong>Total Rows:</strong> {totalRows}
          </p>
        </div>
      </section>

      <section className="status">
        <h2>Add / Update Role</h2>
        <form className="filter-form" onSubmit={handleUpsert}>
          <label>
            User email
            <input
              type="email"
              value={formEmail}
              onChange={(event) => setFormEmail(event.target.value)}
              placeholder="user@company.com"
              required
            />
          </label>

          <label>
            Role
            <select
              value={formRole}
              onChange={(event) => setFormRole(event.target.value as AppRole)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-actions">
            <button type="submit" disabled={isLoading}>
              Save
            </button>
          </div>
        </form>
      </section>

      <section className="status">
        <h2>Current Role Rows</h2>
        {isLoading ? <p className="meta">Loading...</p> : null}

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isCurrentUser = row.user_email.toLowerCase() === currentUserEmail.toLowerCase();

                return (
                  <tr key={row.id}>
                    <td>
                      {row.user_email}
                      {isCurrentUser ? " (you)" : ""}
                    </td>
                    <td>{row.role}</td>
                    <td>{new Date(row.updated_at).toLocaleString()}</td>
                    <td>
                      <div className="inline-actions">
                        {row.role === "pending_approval" ? (
                          <button
                            type="button"
                            onClick={() => approveToViewer(row.user_email)}
                            disabled={isLoading}
                          >
                            Approve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(row.user_email)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {statusMessage ? <p className="ok">{statusMessage}</p> : null}
      {errorMessage ? <p className="error">{errorMessage}</p> : null}
    </>
  );
}
