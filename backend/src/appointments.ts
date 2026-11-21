import { Router } from "express";
import { pool } from "./db";
import { requireAuth, AuthRequest } from "./auth";

export const appointmentsRouter = Router();

// Criar marcação
appointmentsRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { barberId, serviceId, startsAt } = req.body;
  const start = new Date(startsAt);
  if (!barberId || !serviceId || isNaN(start.getTime())) {
    return res.status(400).json({ error: "Indica barberId, serviceId e startsAt" });
  }
  if (start.getTime() <= Date.now()) {
    return res.status(400).json({ error: "A data tem de ser no futuro" });
  }

  const svc = await pool.query("SELECT duration_min FROM services WHERE id = $1", [serviceId]);
  if (!svc.rows[0]) {
    return res.status(404).json({ error: "Serviço não encontrado" });
  }
  const end = new Date(start.getTime() + svc.rows[0].duration_min * 60_000);

  // O horário tem de estar dentro do turno do barbeiro
  const shift = await pool.query(
    `SELECT 1 FROM working_hours wh
     WHERE wh.barber_id = $1
       AND wh.weekday = EXTRACT(DOW FROM ($2::timestamptz AT TIME ZONE 'Europe/Lisbon'))
       AND ($2::timestamptz AT TIME ZONE 'Europe/Lisbon')::time >= wh.start_time
       AND ($3::timestamptz AT TIME ZONE 'Europe/Lisbon')::time <= wh.end_time`,
    [barberId, start.toISOString(), end.toISOString()]
  );
  if (!shift.rows[0]) {
    return res.status(400).json({ error: "Horário fora do turno do barbeiro" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (user_id, barber_id, service_id, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, barber_id, service_id, starts_at, ends_at, status`,
      [req.user!.id, barberId, serviceId, start.toISOString(), end.toISOString()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    // 23P01 = violação da restrição EXCLUDE (marcação sobreposta)
    if (err.code === "23P01") {
      return res.status(409).json({ error: "Esse horário já foi reservado" });
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// As minhas marcações
appointmentsRouter.get("/mine", requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT a.id, a.starts_at, a.ends_at, a.status,
            s.name AS service, s.price_cents, b.name AS barber
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN barbers b ON b.id = a.barber_id
     WHERE a.user_id = $1
     ORDER BY a.starts_at DESC`,
    [req.user!.id]
  );
  res.json(result.rows);
});

// Cancelar
appointmentsRouter.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `UPDATE appointments SET status = 'cancelled'
     WHERE id = $1 AND status = 'confirmed' AND (user_id = $2 OR $3 = 'admin')
     RETURNING id`,
    [Number(req.params.id), req.user!.id, req.user!.role]
  );
  if (!result.rows[0]) {
    return res.status(404).json({ error: "Marcação não encontrada" });
  }
  res.json({ status: "cancelled" });
});