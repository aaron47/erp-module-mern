import { Brand } from "./Brand";

const titles = {
  products: "Products",
  warehouses: "Warehouses",
  stocks: "Stock levels",
  orders: "Sales orders",
  reservations: "Reservations",
  "purchase-orders": "Purchase orders",
};
export type Section = keyof typeof titles;
const sections: { name: string; kinds: Section[] }[] = [
  { name: "Inventory", kinds: ["products", "warehouses", "stocks"] },
  { name: "Sales", kinds: ["orders", "reservations"] },
  { name: "Procurement", kinds: ["purchase-orders"] },
];
export function Sidebar({
  kind,
  select,
  email,
  leave,
}: {
  kind: Section;
  select: (kind: Section) => void;
  email: string;
  leave: () => void;
}) {
  return (
    <aside className="nav">
      <Brand />
      <nav>
        {sections.map((section) => (
          <div key={section.name}>
            <h3>{section.name}</h3>
            {section.kinds.map((k) => (
              <button
                key={k}
                className={kind === k ? "current" : ""}
                onClick={() => select(k)}
              >
                {titles[k]}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="account">
        <small>{email}</small>
        <button onClick={leave}>Sign out</button>
      </div>
    </aside>
  );
}
