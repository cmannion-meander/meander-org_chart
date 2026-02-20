"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getCallbackUrl(): string {
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    return callback.toString();
  }

  async function signInWithMicrosoft() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: getCallbackUrl(),
          queryParams: {
            prompt: "select_account"
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth sign-in failed.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  }

  async function signInWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Password sign-in failed.");
      }

      setStatusMessage("Signed in.");
      window.location.assign(nextPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password sign-in failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signUpWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Signup failed.");
      }

      setStatusMessage(
        payload.message ??
          "Signup request submitted. Wait for an admin approval, then sign in with password."
      );
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="status">
      <h2>Sign in</h2>
      <div className="login-actions">
        <button type="button" onClick={signInWithMicrosoft} disabled={isSubmitting}>
          Continue with Microsoft
        </button>
      </div>

      <hr className="divider" />

      <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          className={mode === "signin" ? "active" : ""}
          onClick={() => {
            setMode("signin");
            setErrorMessage(null);
            setStatusMessage(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => {
            setMode("signup");
            setErrorMessage(null);
            setStatusMessage(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form className="login-form" onSubmit={mode === "signin" ? signInWithPassword : signUpWithPassword}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="name@company.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            placeholder="Your password"
          />
        </label>
        {mode === "signup" ? (
          <label>
            Confirm password
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Confirm your password"
            />
          </label>
        ) : null}
        <button type="submit" disabled={isSubmitting}>
          {mode === "signin" ? "Sign in with password" : "Create account"}
        </button>
      </form>

      {statusMessage ? <p className="ok">{statusMessage}</p> : null}
      {errorMessage ? <p className="error">{errorMessage}</p> : null}
    </section>
  );
}
