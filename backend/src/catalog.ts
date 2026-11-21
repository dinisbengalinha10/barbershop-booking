import { Router } from "express";
import { pool } from "./db";

export const catalogRouter = Router();

catalogRouter.get("/services", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, name, duration_min, price_cents FROM services ORDER BY id"
  );
  res.json(result.rows);
});

catalogRouter.get("/barbers", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, name FROM barbers WHERE active = true ORDER BY id"
  );
  res.json(result.rows);
});

catalogRouter.get("/availability", async (req, res) => {
  const { barberId, serviceId, date } = req.query;
  if (!barberId || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return res.status(400).json({ error: "Indica barberId, serviceId e date (AAAA-MM-DD)" });
  }

  const svc = await pool.query("SELECT duration_min FROM services WHERE id = $1", [serviceId]);
  if (!svc.rows[0]) {
    return res.status(404).json({ error: "Serviço não encontrado" });
  }
  const duration = svc.rows[0].duration_min;

  const result = await pool.query(
    `SELECT slot AS starts_at
     FROM working_hours wh
     CROSS JOIN LATERAL generate_series(
       ($1::date + wh.start_time) AT TIME ZONE 'Europe/Lisbon',
       ($1::date + wh.end_time) AT TIME ZONE 'Europe/Lisbon' - make_interval(mins => $3::int),
       interval '30 minutes'
     ) AS slot
     WHERE wh.barber_id = $2
       AND wh.weekday = EXTRACT(DOW FROM $1::date)
       AND slot > now()
       AND NOT EXISTS (
         SELECT 1 FROM appointments a
         WHERE a.barber_id = wh.barber_id
           AND a.status = 'confirmed'
           AND tstzrange(a.starts_at, a.ends_at) && tstzrange(slot, slot + make_interval(mins => $3::int))
       )
     ORDER BY slot`,
    [date, barberId, duration]
  );

  res.json(result.rows.map((r) => r.starts_at));
});