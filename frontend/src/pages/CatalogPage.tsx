import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Product } from "../types/entities";
import type { Session } from "../hooks/useSession";
import { Brand } from "../components/layout/Brand";

export function CatalogPage({
  session,
  leave,
}: {
  session: Session | null;
  leave: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api("/catalog")
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  async function purchase(product: Product, quantity: number) {
    if (!session || busy) return;
    setBusy(true);
    setReceipt("");
    setError("");
    try {
      const result = await api(
        "/catalog/purchases",
        "POST",
        { productId: product._id, quantity },
        session.token,
      );
      const reference = result._id.slice(0, 8).toUpperCase();
      setReceipt(
        result.status === "CONFIRMED"
          ? `Order #${reference} confirmed for ${quantity} × ${product.name}.`
          : `Order #${reference} rejected. There is insufficient stock for ${quantity} × ${product.name}.`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        leave();
        location.hash = "login";
      } else setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="store">
      <header className="store-nav">
        <Brand />
        <nav>
          {session?.role === "admin" && <a href="#dashboard">Dashboard</a>}
          {session ? (
            <button onClick={leave}>Sign out</button>
          ) : (
            <a href="#login">Sign in</a>
          )}
        </nav>
      </header>
      <main>
        <h1>Product catalog</h1>
        {receipt && <p role="status">{receipt}</p>}
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => retry((n) => n + 1)}>Refresh catalog</button>
          </p>
        )}
        {loading ? (
          <p>Loading products…</p>
        ) : !products.length && !error ? (
          <p>No products available yet.</p>
        ) : null}
        <div className="catalog-grid">
          {products.map((product) => (
            <article key={product._id}>
              <h2>{product.name}</h2>
              <p className="catalog-price">
                Unit price · {product.price.toFixed(2)}
              </p>
              {session ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void purchase(
                      product,
                      Number(new FormData(e.currentTarget).get("quantity")),
                    );
                  }}
                >
                  <label>
                    Quantity
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      max="1000000"
                      required
                      defaultValue="1"
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    Purchase
                  </button>
                </form>
              ) : (
                <a href="#login">Sign in to purchase →</a>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
