import { useEffect, useState } from "react";
import type { RequestApi } from "../api/client";
import type { Order, Product } from "../types/entities";
import { reference, productName } from "../utils/labels";
import { TableLayout, RowActions } from "../components/records/TableLayout";
import { DeleteDialog } from "../components/records/DeleteDialog";
import { OrderForm } from "../components/order/OrderForm";
export function OrderPage({ request }: { request: RequestApi }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, reload] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Order | "new" | null>(null),
    [deleting, setDeleting] = useState<Order | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([request<Order[]>("/orders"), request<Product[]>("/products")])
      .then(([orders, products]) => {
        if (active) {
          setOrders(orders);
          setProducts(products);
        }
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

  const lineSummary = (row: Order) =>
    row.items
      .map(
        (line) =>
          line.quantity +
          " × " +
          productName(products, line.productId) +
          " @ " +
          line.unitPrice.toFixed(2),
      )
      .join(", ");
  const visible = orders.filter((row) =>
    [
      reference(row._id),
      row.description || "—",
      lineSummary(row),
      row.status,
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
        title="Sales orders"
        noun="sales order"
        loading={loading}
        count={orders.length}
        empty={!visible.length}
        query={query}
        setQuery={setQuery}
        onNew={() => setEditor("new")}
      >
        <thead>
          <tr>
            <th>Order</th>
            <th>Description</th>
            <th>Line items</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row._id}>
              <td>{reference(row._id)}</td>
              <td>{row.description || "—"}</td>
              <td>{lineSummary(row)}</td>
              <td>
                <span className={"status " + row.status}>{row.status}</span>
              </td>
              <RowActions
                edit={() => setEditor(row)}
                remove={() => setDeleting(row)}
              />
            </tr>
          ))}
        </tbody>
      </TableLayout>
      {editor && (
        <OrderForm
          order={editor === "new" ? undefined : editor}
          products={products}
          request={request}
          onSaved={saved}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          noun="sales order"
          label={deleting.description || reference(deleting._id)}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await request("/orders/" + deleting._id, "DELETE");
            setDeleting(null);
            reload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
