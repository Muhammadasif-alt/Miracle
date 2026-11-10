"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

/** Email + password form for one team member. The email starts filled in; the password is always typed. */
export function LoginForm({ next, defaultEmail, devPassword }: { next: string; defaultEmail: string; devPassword?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = next;
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(res.status === 400 ? "Enter your email and password." : (body?.error?.message ?? "Sign-in failed. Please try again."));
    } catch {
      setError("Can’t reach the server. Check that the API is running, then try again.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1.5 h-11"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-faint hover:bg-hover hover:text-fg"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary btn-lg w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {devPassword ? (
        <p className="text-center text-[11px] text-faint">
          Development password: <code className="font-mono text-muted">{devPassword}</code> · shown only in development
        </p>
      ) : null}
    </form>
  );
}
