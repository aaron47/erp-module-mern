import { useState, type ReactNode, type FormEvent } from "react";
export function FormDialog({
  title,
  submitLabel,
  onSubmit,
  onClose,
  children,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<void>;
  onClose: () => void;
  children: ReactNode;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(new FormData(e.currentTarget));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="overlay">
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
      >
        <header>
          <h2 id="form-title">{title}</h2>
          <button disabled={busy} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          {children}
          {error && <p role="alert">{error}</p>}
          <footer>
            <button type="button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
