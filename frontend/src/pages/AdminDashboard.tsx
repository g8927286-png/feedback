import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, deleteFeedback, getStats, listFeedback } from "../api";
import SatisfactionDial from "../components/SatisfactionDial";
import StarRating from "../components/StarRating";
import Toast from "../components/Toast";
import type { Feedback, Stats } from "../types";

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

const CATEGORIES = ["Atendimento", "Instalações", "Serviços Online", "Comunicação", "Sugestão", "Outro"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [rating, setRating] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [statsRes, feedbackRes] = await Promise.all([
        getStats(token),
        listFeedback(token, { category, rating, search }),
      ]);
      setStats(statsRes);
      setFeedback(feedbackRes.feedback);
    } catch (err) {
      if (err instanceof ApiError && err.message.includes("expirada")) {
        onLogout();
        navigate("/admin");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(loadAll, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, rating, search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.15 }
    );

    document.querySelectorAll<HTMLElement>(".reveal-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stats, feedback.length]);

  async function handleDelete(id: number) {
    if (!confirm("Remover este feedback permanentemente?")) return;
    try {
      await deleteFeedback(token, id);
      setFeedback((prev) => prev.filter((item) => item.id !== id));
      setToast("Feedback removido.");
    } catch {
      setToast("Não foi possível remover o feedback.");
    }
  }

  const maxRatingCount = useMemo(() => {
    if (!stats) return 1;
    return Math.max(1, ...Object.values(stats.rating_distribution));
  }, [stats]);

  const maxCategoryCount = useMemo(() => {
    if (!stats) return 1;
    return Math.max(1, ...Object.values(stats.category_distribution));
  }, [stats]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy font-display text-sm font-semibold text-paper">
              VI
            </span>
            <span className="truncate font-display text-base font-semibold text-navy sm:text-lg">
              Painel de gestão
            </span>
          </div>
          <button
            onClick={() => {
              onLogout();
              navigate("/admin");
            }}
            className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-navy-soft hover:text-navy sm:text-xs"
          >
            Terminar sessão
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-brick/30 bg-brick-soft px-4 py-3 text-sm text-brick">
            {error}
          </div>
        )}

        {stats && (
          <section className="mb-8 grid gap-4 sm:mb-10 sm:gap-5 lg:grid-cols-[0.9fr_1.1fr_1.1fr] reveal-on-scroll reveal-delay-100">
            <div className="rounded-xl2 border border-line bg-white/70 p-5 shadow-card sm:p-6">
              <p className="eyebrow mb-4">Índice de satisfação</p>
              <div className="flex justify-center">
                <SatisfactionDial value={stats.satisfaction_rate} size={180} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-center">
                <div>
                  <p className="font-display text-2xl font-semibold text-navy">{stats.total}</p>
                  <p className="text-xs text-ink/50">respostas</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-navy">{stats.average_rating}</p>
                  <p className="text-xs text-ink/50">média (1–5)</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl2 border border-line bg-white/70 p-5 shadow-card sm:p-6">
              <p className="eyebrow mb-5">Distribuição por classificação</p>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.rating_distribution[String(star)] || 0;
                  const width = (count / maxRatingCount) * 100;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-4 font-mono text-xs text-ink/60">{star}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-dim">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${width}%`, transition: "width 0.6s ease-out" }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-xs text-ink/50">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl2 border border-line bg-white/70 p-5 shadow-card sm:p-6">
              <p className="eyebrow mb-5">Por área</p>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const count = stats.category_distribution[cat] || 0;
                  const width = (count / maxCategoryCount) * 100;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 truncate text-xs text-ink/60 sm:w-28">{cat}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-dim">
                        <div
                          className="h-full rounded-full bg-teal"
                          style={{ width: `${width}%`, transition: "width 0.6s ease-out" }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-xs text-ink/50">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-xl2 border border-line bg-white/70 shadow-card reveal-on-scroll reveal-delay-200">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
            <input
              type="text"
              placeholder="Pesquisar por nome ou mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-navy sm:min-w-[220px] sm:flex-1 sm:py-2"
            />
            <div className="flex gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-1/2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-navy sm:w-auto sm:py-2"
              >
                <option value="">Todas as áreas</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-1/2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-navy sm:w-auto sm:py-2"
              >
                <option value="">Todas as classificações</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} estrela{r > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-ink/50">A carregar...</p>
          ) : feedback.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-display text-lg text-navy">Sem resultados</p>
              <p className="mt-1 text-sm text-ink/50">Ajuste os filtros ou aguarde novas respostas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {feedback.map((item) => (
                <li key={item.id} className="p-4 sm:p-5 reveal-on-scroll reveal-delay-300">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <StarRating value={item.rating} readOnly size={15} />
                      <span className="rounded-full bg-paper-dim px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-navy-soft">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="font-mono text-xs text-ink/40">{formatDate(item.created_at)}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-brick hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink/85">{item.message}</p>
                  {(item.name || item.email) && (
                    <p className="mt-2 text-xs text-ink/40">
                      {[item.name, item.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
