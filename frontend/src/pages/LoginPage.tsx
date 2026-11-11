import { Brand } from "../components/layout/Brand";
import { AuthForm } from "../components/auth/AuthForm";
import type { Session } from "../hooks/useSession";

export function LoginPage({ enter }: { enter: (s: Session) => void }) {
  return (
    <main className="login">
      <aside className="cover">
        <Brand />
        <div className="cover-copy">
          <h1>Product catalog</h1>
          <p>Sign in to place an order.</p>
        </div>
        <div className="warehouse-art" aria-hidden="true">
          {[0, 1, 2].map((n) => (
            <div className={"rack rack-" + n} key={n}>
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          ))}
        </div>
      </aside>

      <AuthForm enter={enter} />
    </main>
  );
}
