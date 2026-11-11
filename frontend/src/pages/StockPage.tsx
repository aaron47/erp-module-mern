import { useEffect, useState } from "react";
import type { RequestApi } from "../api/client";
import type { Stock, Product, Warehouse } from "../types/entities";
import { productName, warehouseName, stockLabel } from "../utils/labels";
import { TableLayout, RowActions } from "../components/records/TableLayout";
import { DeleteDialog } from "../components/records/DeleteDialog";
import { StockForm } from "../components/stock/StockForm";
export function StockPage({ request }: { request: RequestApi }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, reload] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Stock | "new" | null>(null),
    [deleting, setDeleting] = useState<Stock | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      request<Stock[]>("/stocks?scope=dashboard"),
      request<Product[]>("/products?scope=dashboard"),
      request<Warehouse[]>("/warehouses?scope=dashboard"),
    ])
      .then(([stocks, products, warehouses]) => {
        if (active) {
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

  const visible = stocks.filter((row) =>
    [
      productName(products, row.productId),
      warehouseName(warehouses, row.warehouseId),
      row.quantityOnHand,
      row.quantityReserved,
      row.quantityOnHand - row.quantityReserved,
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
        title="Stock levels"
        noun="stock record"
        loading={loading}
        count={stocks.length}
        empty={!visible.length}
        query={query}
        setQuery={setQuery}
        onNew={() => setEditor("new")}
      >
        <thead>
          <tr>
            <th>Product</th>
            <th>Warehouse</th>
            <th>On hand</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row._id}>
              <td>{productName(products, row.productId)}</td>
              <td>{warehouseName(warehouses, row.warehouseId)}</td>
              <td>{row.quantityOnHand}</td>
              <td>{row.quantityReserved}</td>
              <td>{row.quantityOnHand - row.quantityReserved}</td>
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
        <StockForm
          stock={editor === "new" ? undefined : editor}
          products={products.filter((row) => !row.readOnly)}
          warehouses={warehouses.filter((row) => !row.readOnly)}
          request={request}
          onSaved={saved}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          noun="stock record"
          label={stockLabel(deleting, products, warehouses)}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await request("/stocks/" + deleting._id, "DELETE");
            setDeleting(null);
            reload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
