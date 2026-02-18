"use client";

import { useEffect, useMemo, useState } from "react";

import type { AppRole } from "@/lib/auth/authorization";

type RoleRecord = {
  user_email: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
};

type RolesApiResponse = {
  currentUserEmail: string;
  roles: RoleRecord[];
};

const ROLE_OPTIONS: AppRole[] = ["admin", "hr_editor", "viewer"];

export function RolesAdminClient({ initialEmail }: { initialEmail: string }) {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("viewer");
  const [draftRoles, setDraftRoles] = useState<Record<string, AppRole>>({});

  const roleCountSummary = useMemo(() => {
    const summary = { admin: 0, hr_editor: 0, viewer: 0 };
    for (const roleRecord of roles) {
      summary[roleRecord.role] += 1;
    }
    return summary;
  }, [roles]);

  const loadRoles = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "GET",
      });

      const payload = (await response.json()) as RolesApiResponse & { error?: string };
      if (!response.ok) {
        setErrorMessage(payload.error ?? "Failed to load roles.");
        return;
      }

      const rolesFromApi = payload.roles ?? [];
      setRoles(rolesFromApi);
      setCurrentUserEmail(payload.currentUserEmail || initialEmail);
      const nextDrafts: Record<string, AppRole> = {};
      for (const roleRecord of rolesFromApi) {
        nextDrafts[roleRecord.user_email] = roleRecord.role;
      }
      setDraftRoles(nextDrafts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load roles.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsertRole = async (userEmail: string, role: AppRole) => {
    setErrorMessage(null);
    setMessage(null);

    const response = await fetch("/api/admin/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, role }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to save role.");
      return;
    }

    setMessage(`Saved role for ${userEmail}.`);
    await loadRoles();
  };

  const deleteRole = async (userEmail: string) => {
    setErrorMessage(null);
    setMessage(null);

    const response = await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to remove role.");
      return;
    }

    setMessage(`Removed role row for ${userEmail}.`);
    await loadRoles();
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Admin · User Roles</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage `admin`, `hr_editor`, and `viewer` access by email.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Signed in as <span className="font-semibold">{currentUserEmail}</span>
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Admins</p>
            <p className="text-2xl font-semibold text-zinc-900">{roleCountSummary.admin}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">HR Editors</p>
            <p className="text-2xl font-semibold text-zinc-900">{roleCountSummary.hr_editor}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Viewers</p>
            <p className="text-2xl font-semibold text-zinc-900">{roleCountSummary.viewer}</p>
          </div>
        </div>

        <form
          className="mt-6 grid gap-3 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            void upsertRole(newUserEmail.trim().toLowerCase(), newRole);
          }}
        >
          <input
            type="email"
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
            placeholder="name@company.com"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 sm:col-span-2"
            required
          />
          <select
            value={newRole}
            onChange={(event) => setNewRole(event.target.value as AppRole)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white sm:col-span-3">
            Add / Update Role
          </button>
        </form>

        {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Current Role Rows</h2>

        {loading ? (
          <p className="mt-3 text-sm text-zinc-600">Loading...</p>
        ) : roles.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            No explicit role rows found. Users default to <code>viewer</code>.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((roleRecord) => {
                  const draftRole = draftRoles[roleRecord.user_email] ?? roleRecord.role;
                  const isSelf = roleRecord.user_email === currentUserEmail;

                  return (
                    <tr key={roleRecord.user_email} className="border-b border-zinc-100">
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-700">{roleRecord.user_email}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={draftRole}
                          onChange={(event) =>
                            setDraftRoles((previous) => ({
                              ...previous,
                              [roleRecord.user_email]: event.target.value as AppRole,
                            }))
                          }
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-900"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-4 text-zinc-600">
                        {new Date(roleRecord.updated_at).toLocaleString()}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void upsertRole(roleRecord.user_email, draftRole);
                            }}
                            className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void deleteRole(roleRecord.user_email);
                            }}
                            disabled={isSelf}
                            className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                        {isSelf ? <p className="mt-1 text-xs text-zinc-500">You cannot delete your own role.</p> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
