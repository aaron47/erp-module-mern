import type { RequestApi } from "../../api/client";
import type { Reservation, Order, Stock } from "../../types/entities";
import { FormDialog } from "../records/FormDialog";
import { orderLabel } from "../../utils/labels";

export function ReservationForm({
  reservation,
  orders,
  stocks,
  stockNames,
  request,
  onSaved,
  onClose,
}: {
  reservation?: Reservation;
  orders: Order[];
  stocks: Stock[];
  stockNames: Map<string, string>;
  request: RequestApi;
  onSaved: () => void;
  onClose: () => void;
}) {
  async function submit(form: FormData) {
    const body = {
      orderId: String(form.get("orderId") ?? ""),
      stockId: String(form.get("stockId") ?? ""),
      quantity: Number(form.get("quantity")),
      status: String(form.get("status") ?? ""),
    };
    if (reservation)
      await request("/reservations/" + reservation._id, "PUT", body);
    else await request("/reservations", "POST", body);
    onSaved();
  }
  return (
    <FormDialog
      title={(reservation ? "Edit " : "New ") + "reservation"}
      submitLabel="Save reservation"
      onClose={onClose}
      onSubmit={submit}
    >
      <label>
        Sales order
        <select
          name="orderId"
          required
          defaultValue={reservation?.orderId ?? ""}
        >
          <option value="">Select sales order</option>
          {orders.map((order) => (
            <option key={order._id} value={order._id}>
              {orderLabel(order)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Stock record
        <select
          name="stockId"
          required
          defaultValue={reservation?.stockId ?? ""}
        >
          <option value="">Select stock record</option>
          {stocks.map((stock) => (
            <option key={stock._id} value={stock._id}>
              {stockNames.get(stock._id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          name="quantity"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={reservation?.quantity ?? ""}
        />
      </label>
      <label>
        Status
        <select name="status" defaultValue={reservation?.status ?? "RESERVED"}>
          <option>RESERVED</option>
          <option>RELEASED</option>
          <option>FULFILLED</option>
        </select>
      </label>
    </FormDialog>
  );
}
