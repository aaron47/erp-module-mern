import type { RequestApi } from "../../api/client";
import type { Product } from "../../types/entities";
import { FormDialog } from "../records/FormDialog";

export function ProductForm({
  product,
  request,
  onSaved,
  onClose,
}: {
  product?: Product;
  request: RequestApi;
  onSaved: () => void;
  onClose: () => void;
}) {
  async function submit(form: FormData) {
    const body = {
      name: String(form.get("name") ?? ""),
      price: Number(form.get("price")),
    };
    if (product) await request("/products/" + product._id, "PUT", body);
    else await request("/products", "POST", body);
    onSaved();
  }
  return (
    <FormDialog
      title={(product ? "Edit " : "New ") + "product"}
      submitLabel="Save product"
      onClose={onClose}
      onSubmit={submit}
    >
      <label>
        Name
        <input name="name" required defaultValue={product?.name ?? ""} />
      </label>
      <label>
        Unit price
        <input
          name="price"
          type="number"
          min={0}
          step={0.01}
          required
          defaultValue={product?.price ?? ""}
        />
      </label>
    </FormDialog>
  );
}
