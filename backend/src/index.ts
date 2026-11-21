import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db";
import { authRouter } from "./auth";
import { catalogRouter } from "./catalog";
import { appointmentsRouter } from "./appointments";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/db-health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT now() AS agora");
    res.json({ status: "ok", agora: result.rows[0].agora });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "erro" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api", catalogRouter);
app.use("/api/appointments", appointmentsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API a correr em http://localhost:${PORT}`));