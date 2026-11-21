import { useState, type FormEvent } from "react";
import { api } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AuthForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      }
      const data = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
      {mode === "register" && (
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
      )}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button type="submit">{mode === "login" ? "Entrar" : "Registar"}</button>
      <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>
    </form>
  );
}