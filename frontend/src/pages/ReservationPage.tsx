import { useEffect, useState } from "react";
import type { RequestApi } from "../api/client";
import type {
  Reservation,
  Order,
  Stock,
  Product,
  Warehouse,
} from "../types/entities";
import { reference, stockLabel, orderLabel } from "../utils/labels";
import { TableLayout, RowActions } from "../components/records/TableLayout";
import { DeleteDialog } from "../components/records/DeleteDialog";
import { ReservationForm } from "../components/reservation/ReservationForm";
export function ReservationPage({ request }: { request: RequestApi }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, reload] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Reservation | "new" | null>(null),
    [deleting, setDeleting] = useState<Reservation | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      request<Reservation[]>("/reservations?scope=dashboard"),
      request<Order[]>("/orders?scope=dashboard"),
      request<Stock[]>("/stocks?scope=dashboard"),
      request<Product[]>("/products?scope=dashboard"),
      request<Warehouse[]>("/warehouses?scope=dashboard"),
    ])
      .then(([reservations, orders, stocks, products, warehouses]) => {
        if (active) {
          setReservations(reservations);
          setOrders(orders);
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
  const orderNames = new Map(
    orders.map((order) => [order._id, orderLabel(order)]),
  );

  const visible = reservations.filter((row) =>
    [
      orderNames.get(row.orderId) ?? "Unknown order",
      stockNames.get(row.stockId) ?? "Unknown stock",
      row.quantity,
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
        title="Reservations"
        noun="reservation"
        loading={loading}
        count={reservations.length}
        empty={!visible.length}
        query={query}
        setQuery={setQuery}
        onNew={() => setEditor("new")}
      >
        <thead>
          <tr>
            <th>Sales order</th>
            <th>Stock record</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row._id}>
              <td>{orderNames.get(row.orderId) ?? "Unknown order"}</td>
              <td>{stockNames.get(row.stockId) ?? "Unknown stock"}</td>
              <td>{row.quantity}</td>
              <td>
                <span className={"status " + row.status}>{row.status}</span>
              </td>
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
        <ReservationForm
          reservation={editor === "new" ? undefined : editor}
          orders={orders.filter((row) => !row.readOnly)}
          stocks={stocks.filter((row) => !row.readOnly)}
          stockNames={stockNames}
          request={request}
          onSaved={saved}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          noun="reservation"
          label={reference(deleting._id)}
          onCancel={() => setDeleting(null)}
          onDelete={async () => {
            await request("/reservations/" + deleting._id, "DELETE");
            setDeleting(null);
            reload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
