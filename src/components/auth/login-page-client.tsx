"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginPageClientProps = {
  nextPath: string;
};

export function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoadingMicrosoft, setIsLoadingMicrosoft] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  const getRedirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const handleMicrosoftSignIn = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoadingMicrosoft(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: getRedirectTo(),
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } finally {
      setIsLoadingMicrosoft(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoadingEmail(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: getRedirectTo(),
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setInfoMessage("Check your email for the login link.");
      }
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10 sm:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Use Microsoft Entra ID if configured. Email magic link is available as a fallback.
        </p>

        <button
          type="button"
          onClick={() => {
            void handleMicrosoftSignIn();
          }}
          disabled={isLoadingMicrosoft}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isLoadingMicrosoft ? "Connecting..." : "Continue with Microsoft"}
        </button>

        <div className="my-5 border-t border-zinc-200" />

        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <label className="block text-sm text-zinc-700">
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              required
            />
          </label>
          <button
            type="submit"
            disabled={isLoadingEmail}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-60"
          >
            {isLoadingEmail ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}
        {infoMessage ? <p className="mt-4 text-sm text-emerald-700">{infoMessage}</p> : null}
      </section>
    </main>
  );
}
