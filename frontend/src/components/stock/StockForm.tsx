import type { RequestApi } from "../../api/client";
import type { Stock, Product, Warehouse } from "../../types/entities";
import { FormDialog } from "../records/FormDialog";

export function StockForm({
  stock,
  products,
  warehouses,
  request,
  onSaved,
  onClose,
}: {
  stock?: Stock;
  products: Product[];
  warehouses: Warehouse[];
  request: RequestApi;
  onSaved: () => void;
  onClose: () => void;
}) {
  async function submit(form: FormData) {
    const body = {
      productId: stock?.productId ?? String(form.get("productId") ?? ""),
      warehouseId: stock?.warehouseId ?? String(form.get("warehouseId") ?? ""),
      quantityOnHand: Number(form.get("quantityOnHand")),
    };
    if (stock) await request("/stocks/" + stock._id, "PUT", body);
    else await request("/stocks", "POST", body);
    onSaved();
  }
  return (
    <FormDialog
      title={(stock ? "Edit " : "New ") + "stock record"}
      submitLabel="Save stock record"
      onClose={onClose}
      onSubmit={submit}
    >
      <label>
        Product
        <select
          name="productId"
          required
          defaultValue={stock?.productId ?? ""}
          disabled={!!stock}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Warehouse
        <select
          name="warehouseId"
          required
          defaultValue={stock?.warehouseId ?? ""}
          disabled={!!stock}
        >
          <option value="">Select warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse._id} value={warehouse._id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        On hand
        <input
          name="quantityOnHand"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={stock?.quantityOnHand ?? ""}
        />
      </label>
    </FormDialog>
  );
}
