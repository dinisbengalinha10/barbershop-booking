import { useEffect, useState } from "react";
import { api } from "./api";

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
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Service[]>("/services"), api<Barber[]>("/barbers")])
      .then(([s, b]) => {
        setServices(s);
        setBarbers(b);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="container">
      <h1>Barbearia</h1>
      {error && <p className="error">{error}</p>}

      <h2>Serviços</h2>
      <ul className="list">
        {services.map((s) => (
          <li key={s.id}>
            <span>{s.name}</span>
            <span>
              {s.duration_min} min · {(s.price_cents / 100).toFixed(2)} €
            </span>
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