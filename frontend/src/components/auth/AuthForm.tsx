import { useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { Session } from "../../hooks/useSession";

export function AuthForm({ enter }: { enter: (s: Session) => void }) {
  const [register, mode] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      enter(
        await api("/auth/" + (register ? "register" : "login"), "POST", {
          email: data.get("email"),
          password: data.get("password"),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="access">
      <div className="access-inner">
        <h2>{register ? "Create your workspace" : "Welcome back"}</h2>
        <p>
          {register
            ? "Register to start managing your inventory."
            : "Sign in to your ERP workspace."}
        </p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              autoComplete="email"
              name="email"
              placeholder="you@company.com"
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete={register ? "new-password" : "current-password"}
              name="password"
              type="password"
              minLength={8}
              placeholder={
                register ? "At least 8 characters" : "Enter your password"
              }
              required
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button disabled={busy} className="primary">
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}{" "}
            <span>→</span>
          </button>
        </form>
        <div className="switch">
          {register ? "Already registered?" : "New to Ledger?"}{" "}
          <button
            onClick={() => {
              mode(!register);
              setError("");
            }}
          >
            {register ? "Sign in" : "Create an account"}
          </button>
        </div>
      </div>
    </section>
  );
}
