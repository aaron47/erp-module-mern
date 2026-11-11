import type { ReactNode } from "react";
export function TableLayout({
  title,
  noun,
  loading,
  count,
  empty,
  query,
  setQuery,
  onNew,
  children,
}: {
  title: string;
  noun: string;
  loading: boolean;
  count: number;
  empty: boolean;
  query: string;
  setQuery: (query: string) => void;
  onNew: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="crumb">
        Workspace <span>/</span> {title}
      </div>
      <header className="title">
        <h1>{title}</h1>
        <button className="primary" disabled={loading} onClick={onNew}>
          + New {noun}
        </button>
      </header>
      <section className="table-card">
        <div className="tools">
          <strong>
            All records <small>{loading ? "…" : count}</small>
          </strong>
          <input
            aria-label="Search records"
            placeholder="Search records…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="scroll">
          <table>{children}</table>
        </div>
        {empty && (
          <div className="empty">
            {loading
              ? "Loading workspace…"
              : query
                ? "No matching records."
                : "No " + title.toLowerCase() + " yet."}
          </div>
        )}
      </section>
    </>
  );
}
export function RowActions({
  readOnly,
  edit,
  remove,
}: {
  readOnly?: boolean;
  edit: () => void;
  remove: () => void;
}) {
  if (readOnly) return <td>View only</td>;
  return (
    <td>
      <div className="actions">
        <button onClick={edit}>Edit</button>
        <button onClick={remove}>Delete</button>
      </div>
    </td>
  );
}
