import { useCallback, useState } from "react";

export type Session = {
  token: string;
  email: string;
  role: "customer" | "admin";
};
function restore(): Session | null {
  try {
    return JSON.parse(sessionStorage.getItem("erp-session") ?? "null");
  } catch {
    return null;
  }
}

export function useSession() {
  const [session, setSession] = useState(restore);
  const signOut = useCallback(() => {
    sessionStorage.removeItem("erp-session");
    setSession(null);
  }, []);
  const signIn = useCallback((next: Session) => {
    sessionStorage.setItem("erp-session", JSON.stringify(next));
    setSession(next);
  }, []);
  return { session, signIn, signOut };
}
