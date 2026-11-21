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

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
  });

const hoje = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

export default function Booking({ version, onChange }: { version: number; onChange: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState(hoje());
  const [slots, setSlots] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Service[]>("/services"), api<Barber[]>("/barbers")])
      .then(([s, b]) => {
        setServices(s);
        setBarbers(b);
        if (s[0]) setServiceId(String(s[0].id));
        if (b[0]) setBarberId(String(b[0].id));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!serviceId || !barberId || !date) return;
    api<string[]>(`/availability?barberId=${barberId}&serviceId=${serviceId}&date=${date}`)
      .then(setSlots)
      .catch((e) => setError(e.message));
  }, [serviceId, barberId, date, version]);

  async function reservar(startsAt: string) {
    setError("");
    setMessage("");
    try {
      await api("/appointments", {
        method: "POST",
        body: JSON.stringify({
          barberId: Number(barberId),
          serviceId: Number(serviceId),
          startsAt,
        }),
      });
      setMessage(`Marcação confirmada para as ${hora(startsAt)}.`);
      onChange();
    } catch (e) {
      setError((e as Error).message);
      onChange();
    }
  }

  return (
    <section className="card">
      <h2>Nova marcação</h2>

      <label>
        Serviço
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration_min} min · {(s.price_cents / 100).toFixed(2)} €)
            </option>
          ))}
        </select>
      </label>

      <label>
        Barbeiro
        <select value={barberId} onChange={(e) => setBarberId(e.target.value)}>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Dia
        <input type="date" value={date} min={hoje()} onChange={(e) => setDate(e.target.value)} />
      </label>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="slots">
        {slots.length === 0 && <p>Sem horários livres neste dia.</p>}
        {slots.map((s) => (
          <button key={s} onClick={() => reservar(s)}>
            {hora(s)}
          </button>
        ))}
      </div>
    </section>
  );
}