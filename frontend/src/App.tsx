import { useEffect, useState } from "react";
import { api } from "./api";
import AuthForm, { type User } from "./AuthForm";
import Booking from "./Booking";
import MyAppointments from "./MyAppointments";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const refresh = () => setVersion((v) => v + 1);

  if (loading) return <div className="container">A carregar...</div>;

  if (!user) {
    return (
      <div className="container">
        <h1>Barbearia</h1>
        <AuthForm onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="container">
      <header className="top">
        <h1>Barbearia</h1>
        <div>
          <span>Olá, {user.name}</span>
          <button className="link" onClick={logout}>Sair</button>
        </div>
      </header>
      <Booking version={version} onChange={refresh} />
      <MyAppointments version={version} onChange={refresh} />
    </div>
  );
}