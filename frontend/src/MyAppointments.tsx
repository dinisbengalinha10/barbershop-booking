import { useEffect, useState } from "react";
import { api } from "./api";

interface Appointment {
  id: number;
  starts_at: string;
  status: string;
  service: string;
  barber: string;
  price_cents: number;
}

const formatar = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", {
    timeZone: "Europe/Lisbon",
    dateStyle: "short",
    timeStyle: "short",
  });

export default function MyAppointments({ version, onChange }: { version: number; onChange: () => void }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Appointment[]>("/appointments/mine")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [version]);

  async function cancelar(id: number) {
    try {
      await api(`/appointments/${id}`, { method: "DELETE" });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h2>As minhas marcações</h2>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p>Ainda não tens marcações.</p>}
      <ul className="list">
        {items.map((a) => (
          <li key={a.id} className={a.status === "cancelled" ? "cancelled" : ""}>
            <span>
              {formatar(a.starts_at)} · {a.service} com {a.barber}
            </span>
            {a.status === "confirmed" ? (
              <button className="link" onClick={() => cancelar(a.id)}>
                Cancelar
              </button>
            ) : (
              <span>cancelada</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}