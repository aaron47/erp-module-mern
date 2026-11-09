import type { RequestApi } from "../../api/client";
import type { PurchaseOrder, Stock } from "../../types/entities";
import { FormDialog } from "../records/FormDialog";

export function PurchaseOrderForm({
  purchaseOrder,
  stocks,
  stockNames,
  request,
  onSaved,
  onClose,
}: {
  purchaseOrder?: PurchaseOrder;
  stocks: Stock[];
  stockNames: Map<string, string>;
  request: RequestApi;
  onSaved: () => void;
  onClose: () => void;
}) {
  async function submit(form: FormData) {
    const body = {
      stockId: String(form.get("stockId") ?? ""),
      supplierId: String(form.get("supplierId") ?? ""),
      quantity: Number(form.get("quantity")),
    };
    if (purchaseOrder)
      await request("/purchase-orders/" + purchaseOrder._id, "PUT", body);
    else await request("/purchase-orders", "POST", body);
    onSaved();
  }
  return (
    <FormDialog
      title={(purchaseOrder ? "Edit " : "New ") + "purchase order"}
      submitLabel="Save purchase order"
      onClose={onClose}
      onSubmit={submit}
    >
      <label>
        Receiving stock
        <select
          name="stockId"
          required
          defaultValue={purchaseOrder?.stockId ?? ""}
        >
          <option value="">Select receiving stock</option>
          {stocks.map((stock) => (
            <option key={stock._id} value={stock._id}>
              {stockNames.get(stock._id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Supplier ID
        <input
          name="supplierId"
          required
          defaultValue={purchaseOrder?.supplierId ?? ""}
        />
      </label>
      <label>
        Quantity
        <input
          name="quantity"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={purchaseOrder?.quantity ?? ""}
        />
      </label>

      <small>Saving records the receipt and adjusts on-hand stock.</small>
    </FormDialog>
  );
}
