import type { RequestApi } from "../../api/client";
import type { Warehouse } from "../../types/entities";
import { FormDialog } from "../records/FormDialog";

export function WarehouseForm({
  warehouse,
  request,
  onSaved,
  onClose,
}: {
  warehouse?: Warehouse;
  request: RequestApi;
  onSaved: () => void;
  onClose: () => void;
}) {
  async function submit(form: FormData) {
    const body = {
      code: String(form.get("code") ?? ""),
      name: String(form.get("name") ?? ""),
      city: String(form.get("city") ?? ""),
      address: String(form.get("address") ?? ""),
      active: form.has("active"),
    };
    if (warehouse) await request("/warehouses/" + warehouse._id, "PUT", body);
    else await request("/warehouses", "POST", body);
    onSaved();
  }
  return (
    <FormDialog
      title={(warehouse ? "Edit " : "New ") + "warehouse"}
      submitLabel="Save warehouse"
      onClose={onClose}
      onSubmit={submit}
    >
      <label>
        Code
        <input name="code" required defaultValue={warehouse?.code ?? ""} />
      </label>
      <label>
        Name
        <input name="name" required defaultValue={warehouse?.name ?? ""} />
      </label>
      <label>
        City
        <input name="city" required defaultValue={warehouse?.city ?? ""} />
      </label>
      <label>
        Address
        <input name="address" defaultValue={warehouse?.address ?? ""} />
      </label>
      <label>
        Active
        <input
          type="checkbox"
          name="active"
          defaultChecked={warehouse?.active ?? true}
        />
      </label>
    </FormDialog>
  );
}
