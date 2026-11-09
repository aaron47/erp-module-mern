import type { RequestApi } from "../../api/client";
import type { Order, Product, Line } from "../../types/entities";
import { FormDialog } from "../records/FormDialog";

import { useState } from "react";
import { OrderLineItems } from "../records/OrderLineItems";
export function OrderForm({
  order,
  products,
  request,
  onSaved,
  onClose,
}: {
  order?: Order;
  products: Product[];
  request: RequestApi;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [lines, setLines] = useState<Line[]>(
    order?.items.map(({ productId, quantity }) => ({
      productId,
      quantity,
    })) ?? [{ productId: "", quantity: 1 }],
  );
  async function submit(form: FormData) {
    const body = {
      description: String(form.get("description") ?? ""),
      items: lines,
    };
    if (order) await request("/orders/" + order._id, "PUT", body);
    else await request("/orders", "POST", body);
    onSaved();
  }
  return (
    <FormDialog
      title={(order ? "Edit " : "New ") + "sales order"}
      submitLabel="Save sales order"
      onClose={onClose}
      onSubmit={submit}
    >
      <label>
        Description
        <input name="description" defaultValue={order?.description ?? ""} />
      </label>
      <OrderLineItems lines={lines} setLines={setLines} products={products} />
    </FormDialog>
  );
}
