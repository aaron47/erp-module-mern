import { useSession } from "./hooks/useSession";
import { LoginPage } from "./pages/LoginPage";
import { RecordsPage } from "./pages/RecordsPage";

export function App() {
  const { session, signIn, signOut } = useSession();
  return session ? (
    <RecordsPage session={session} leave={signOut} />
  ) : (
    <LoginPage enter={signIn} />
  );
}
