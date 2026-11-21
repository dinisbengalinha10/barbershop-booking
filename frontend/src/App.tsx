import { useEffect, useState } from "react";
import { api } from "./api";
import AuthForm, { type User } from "./AuthForm";

interface Service {
  id: number;
  name: string;
  duration_min: number;
  price_cents: number;
}

interface Barber {
  id: number;
  name: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!user) return;
    Promise.all([api<Service[]>("/services"), api<Barber[]>("/barbers")])
      .then(([s, b]) => {
        setServices(s);
        setBarbers(b);
      })
      .catch((e) => setError(e.message));
  }, [user]);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

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
      {error && <p className="error">{error}</p>}

      <h2>Serviços</h2>
      <ul className="list">
        {services.map((s) => (
          <li key={s.id}>
            <span>{s.name}</span>
            <span>{s.duration_min} min · {(s.price_cents / 100).toFixed(2)} €</span>
          </li>
        ))}
      </ul>

      <h2>Barbeiros</h2>
      <ul className="list">
        {barbers.map((b) => (
          <li key={b.id}>{b.name}</li>
        ))}
      </ul>
    </div>
  );
}