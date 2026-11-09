import type { Line, Product } from "../../types/entities";

export function OrderLineItems({
  lines,
  setLines,
  products,
}: {
  lines: Line[];
  setLines: (next: Line[]) => void;
  products: Product[];
}) {
  function lineChange(index: number, patch: Partial<Line>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  return (
    <fieldset>
      <legend>Order items</legend>
      {lines.map((line, i) => (
        <div className="line" key={i}>
          <select
            aria-label={"Product " + (i + 1)}
            required
            value={line.productId}
            onChange={(e) => lineChange(i, { productId: e.target.value })}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            aria-label={"Quantity " + (i + 1)}
            type="number"
            min="1"
            max="1000000"
            required
            value={line.quantity || ""}
            onChange={(e) =>
              lineChange(i, { quantity: Number(e.target.value) })
            }
          />
          <button
            type="button"
            aria-label="Remove line"
            disabled={lines.length === 1}
            onClick={() => setLines(lines.filter((_, n) => n !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLines([...lines, { productId: "", quantity: 1 }])}
      >
        + Add line
      </button>
    </fieldset>
  );
}
