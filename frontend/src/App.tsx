import { useSession } from "./hooks/useSession";
import { LoginPage } from "./pages/LoginPage";
import { RecordsPage } from "./pages/RecordsPage";
import { CatalogPage } from "./pages/CatalogPage";
import { api, ApiError } from "./api/client";
import { useEffect, useState } from "react";

export function App() {
  const { session, signIn, signOut } = useSession();
  const [route, setRoute] = useState(location.hash);
  useEffect(() => {
    const navigate = () => setRoute(location.hash);
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    if (!session) return;
    let active = true;
    api("/me", "GET", undefined, session.token)
      .then((account) => {
        if (active && account.role !== session.role)
          signIn({ ...session, ...account });
      })
      .catch((error) => {
        if (active && error instanceof ApiError && error.status === 401)
          signOut();
      });
    return () => {
      active = false;
    };
  }, [session, signIn, signOut]);
  function leave() {
    signOut();
    location.hash = "catalog";
  }
  if (!session && route === "#login")
    return (
      <LoginPage
        enter={(next) => {
          signIn(next);
          location.hash = "catalog";
        }}
      />
    );
  if (session?.role === "admin" && route === "#dashboard")
    return <RecordsPage session={session} leave={leave} />;
  return (
    <CatalogPage
      key={session?.token ?? "guest"}
      session={session}
      leave={leave}
    />
  );
}
