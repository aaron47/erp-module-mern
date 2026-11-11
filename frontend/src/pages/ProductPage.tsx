import { useEffect, useState } from "react";
import type { RequestApi } from "../api/client";
import type { Product } from "../types/entities";

import { TableLayout, RowActions } from "../components/records/TableLayout";
import { DeleteDialog } from "../components/records/DeleteDialog";
import { ProductForm } from "../components/product/ProductForm";
export function ProductPage({ request }: { request: RequestApi }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, reload] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Product | "new" | null>(null),
    [deleting, setDeleting] = useState<Product | null>(null);
  useEffect(() => {
    let active = true;
    request<Product[]>("/products?scope=dashboard")
      .then((rows) => {
        if (active) setProducts(rows);
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

  const visible = products.filter((row) =>
    [row.name, row.price.toFixed(2)].some((value) =>
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
        title="Products"
        noun="product"
        loading={loading}
        count={products.length}
        empty={!visible.length}
        query={query}
        setQuery={setQuery}
        onNew={() => setEditor("new")}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row._id}>
              <td>{row.name}</td>
              <td>{row.price.toFixed(2)}</td>
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
        <ProductForm
          product={editor === "new" ? undefined : editor}
          request={request}
          onSaved={saved}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          noun="product"
          label={deleting.name}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await request("/products/" + deleting._id, "DELETE");
            setDeleting(null);
            reload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
