import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminLogin, ApiError } from "../api";

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(password);
      onLogin(res.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-navy font-display text-base font-semibold text-paper">
            VI
          </span>
          <h1 className="font-display text-2xl font-semibold text-navy">Área reservada</h1>
          <p className="mt-1 text-sm text-ink/60">Introduza a password de administração.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl2 border border-line bg-white/70 p-5 shadow-card sm:p-6">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-navy">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink focus:border-navy"
          />
          {error && <p className="mt-2 text-sm text-brick">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-navy-deep disabled:opacity-60"
          >
            {loading ? "A verificar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="font-mono text-xs uppercase tracking-wide text-navy-soft hover:text-navy">
            ← Voltar ao formulário público
          </Link>
        </p>
      </div>
    </div>
  );
}
