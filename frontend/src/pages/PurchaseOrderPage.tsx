import { useEffect, useState } from "react";
import type { RequestApi } from "../api/client";
import type {
  PurchaseOrder,
  Stock,
  Product,
  Warehouse,
} from "../types/entities";
import { reference, stockLabel } from "../utils/labels";
import { TableLayout, RowActions } from "../components/records/TableLayout";
import { DeleteDialog } from "../components/records/DeleteDialog";
import { PurchaseOrderForm } from "../components/purchaseOrder/PurchaseOrderForm";
export function PurchaseOrderPage({ request }: { request: RequestApi }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, reload] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<PurchaseOrder | "new" | null>(null),
    [deleting, setDeleting] = useState<PurchaseOrder | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      request<PurchaseOrder[]>("/purchase-orders?scope=dashboard"),
      request<Stock[]>("/stocks?scope=dashboard"),
      request<Product[]>("/products?scope=dashboard"),
      request<Warehouse[]>("/warehouses?scope=dashboard"),
    ])
      .then(([purchaseOrders, stocks, products, warehouses]) => {
        if (active) {
          setPurchaseOrders(purchaseOrders);
          setStocks(stocks);
          setProducts(products);
          setWarehouses(warehouses);
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
  const stockNames = new Map(
    stocks.map((stock) => [stock._id, stockLabel(stock, products, warehouses)]),
  );

  const visible = purchaseOrders.filter((row) =>
    [
      stockNames.get(row.stockId) ?? "Unknown stock",
      row.supplierId,
      row.quantity,
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
        title="Purchase orders"
        noun="purchase order"
        loading={loading}
        count={purchaseOrders.length}
        empty={!visible.length}
        query={query}
        setQuery={setQuery}
        onNew={() => setEditor("new")}
      >
        <thead>
          <tr>
            <th>Receiving stock</th>
            <th>Supplier ID</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row._id}>
              <td>{stockNames.get(row.stockId) ?? "Unknown stock"}</td>
              <td>{row.supplierId}</td>
              <td>{row.quantity}</td>
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
        <PurchaseOrderForm
          purchaseOrder={editor === "new" ? undefined : editor}
          stocks={stocks.filter((row) => !row.readOnly)}
          stockNames={stockNames}
          request={request}
          onSaved={saved}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          noun="purchase order"
          label={reference(deleting._id)}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await request("/purchase-orders/" + deleting._id, "DELETE");
            setDeleting(null);
            reload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
