import { useEffect, useState } from "react";
import type { RequestApi } from "../api/client";
import type { Warehouse } from "../types/entities";

import { TableLayout, RowActions } from "../components/records/TableLayout";
import { DeleteDialog } from "../components/records/DeleteDialog";
import { WarehouseForm } from "../components/warehouse/WarehouseForm";
export function WarehousePage({ request }: { request: RequestApi }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, reload] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Warehouse | "new" | null>(null),
    [deleting, setDeleting] = useState<Warehouse | null>(null);
  useEffect(() => {
    let active = true;
    request<Warehouse[]>("/warehouses?scope=dashboard")
      .then((rows) => {
        if (active) setWarehouses(rows);
      })
      .then(() => {
        if (active) {
          setLoading(false);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [request, version]);

  const visible = warehouses.filter((row) =>
    [
      row.code,
      row.name,
      row.city,
      row.address || "—",
      row.active ? "Active" : "Inactive",
    ].some((value) =>
      String(value).toLowerCase().includes(query.toLowerCase()),
    ),
  );
  function saved() {
    setEditor(null);
    reload((v) => v + 1);
  }
  return (
    <>
      {error && (
        <p role="alert">
          {error} <button onClick={() => reload((v) => v + 1)}>Retry</button>
        </p>
      )}
      <TableLayout
        title="Warehouses"
        noun="warehouse"
        loading={loading}
        count={warehouses.length}
        empty={!visible.length}
        query={query}
        setQuery={setQuery}
        onNew={() => setEditor("new")}
      >
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row._id}>
              <td>{row.code}</td>
              <td>{row.name}</td>
              <td>{row.city}</td>
              <td>{row.address || "—"}</td>
              <td>{row.active ? "Active" : "Inactive"}</td>
              <RowActions
                readOnly={row.readOnly}
                edit={() => setEditor(row)}
                remove={() => setDeleting(row)}
              />
            </tr>
          ))}
        </tbody>
      </TableLayout>
      {editor && (
        <WarehouseForm
          warehouse={editor === "new" ? undefined : editor}
          request={request}
          onSaved={saved}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          noun="warehouse"
          label={deleting.name}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await request("/warehouses/" + deleting._id, "DELETE");
            setDeleting(null);
            reload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
