import { useCallback, useState } from "react";
import { Sidebar, type Section } from "../components/layout/Sidebar";
import type { Session } from "../hooks/useSession";
import { api, ApiError, type RequestApi } from "../api/client";
import { ProductPage } from "./ProductPage";
import { WarehousePage } from "./WarehousePage";
import { StockPage } from "./StockPage";
import { OrderPage } from "./OrderPage";
import { ReservationPage } from "./ReservationPage";
import { PurchaseOrderPage } from "./PurchaseOrderPage";
export function RecordsPage({
  session,
  leave,
}: {
  session: Session;
  leave: () => void;
}) {
  const [section, select] = useState<Section>("products");
  const request: RequestApi = useCallback(
    async (path, method, body) => {
      try {
        return await api(path, method, body, session.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) leave();
        throw error;
      }
    },
    [session.token, leave],
  );
  return (
    <div className="layout">
      <Sidebar
        kind={section}
        select={select}
        email={session.email}
        leave={leave}
      />
      <main className="content">
        {section === "products" && <ProductPage request={request} />}
        {section === "warehouses" && <WarehousePage request={request} />}
        {section === "stocks" && <StockPage request={request} />}
        {section === "orders" && <OrderPage request={request} />}
        {section === "reservations" && <ReservationPage request={request} />}
        {section === "purchase-orders" && (
          <PurchaseOrderPage request={request} />
        )}
      </main>
    </div>
  );
}
