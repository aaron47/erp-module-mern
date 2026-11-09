import { useState } from "react";

export function DeleteDialog({
  noun,
  label,
  onCancel,
  onDelete,
}: {
  noun: string;
  label: string;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="overlay">
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm deletion"
      >
        <h2>Delete {noun}?</h2>
        <p>This removes {label}.</p>
        {error && <p role="alert">{error}</p>}
        <footer>
          <button disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            disabled={busy}
            className="danger"
            onClick={async () => {
              setBusy(true);
              try {
                await onDelete();
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete record
          </button>
        </footer>
      </section>
    </div>
  );
}
