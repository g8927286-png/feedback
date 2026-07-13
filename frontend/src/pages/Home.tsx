import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FeedbackForm from "../components/FeedbackForm";
import SatisfactionDial from "../components/SatisfactionDial";
import Toast from "../components/Toast";

const STEPS = [
  {
    n: "01",
    title: "Avalie",
    text: "Classifique a sua experiência de 1 a 5 estrelas em segundos.",
    delay: "reveal-delay-100",
  },
  {
    n: "02",
    title: "Descreva",
    text: "Conte-nos, com as suas palavras, o que correu bem ou mal.",
    delay: "reveal-delay-200",
  },
  {
    n: "03",
    title: "Acompanhamos",
    text: "A equipa lê tudo e usa os padrões para decidir melhorias.",
    delay: "reveal-delay-300",
  },
];

export default function Home() {
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

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
  }, []);

  return (
    <div className="min-h-screen bg-paper/90">
      <div className="h-1 w-full bg-gradient-to-r from-navy via-gold to-teal" />

      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy font-display text-sm font-semibold text-paper">
              VI
            </span>
            <div>
              <p className="font-display text-base font-semibold text-navy sm:text-lg">Voz Institucional</p>
              <p className="text-xs uppercase tracking-[0.26em] text-navy-soft">Feedback público</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm sm:gap-6">
            <a href="#form" className="hidden rounded-full border border-line bg-white px-4 py-2 font-medium text-navy transition hover:border-navy hover:text-navy sm:inline-flex">
              Deixar feedback
            </a>
            <Link
              to="/admin"
              className="rounded-full border border-line bg-white px-4 py-2 text-[11px] uppercase tracking-wide text-navy-soft transition hover:border-navy hover:text-navy"
            >
              Área reservada
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <div className="absolute right-0 top-0 hidden h-72 w-72 rounded-full bg-gold/10 blur-3xl lg:block" />
          <div className="absolute left-0 top-24 hidden h-72 w-72 rounded-full bg-teal/10 blur-3xl lg:block" />
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.95fr] lg:gap-16">
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white/90 p-8 shadow-card sm:p-10 lg:p-12 reveal-on-scroll reveal-delay-100">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-navy/10 to-transparent" />
              <p className="eyebrow mb-3 inline-flex items-center gap-2 rounded-full border border-navy-soft bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Recolha de feedback · aberta ao público
              </p>
              <h1 className="mt-4 max-w-2xl font-display text-[2.35rem] font-semibold leading-[1.02] text-navy sm:text-5xl">
                A sua opinião transforma os serviços da instituição.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-ink/75 sm:text-lg">
                Dê feedback em menos de dois minutos. O seu contributo é lido por equipas reais e ajuda a melhorar cada atendimento, serviço online e comunicação.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                <div className="rounded-3xl border border-line bg-paper-dim px-5 py-4">
                  <p className="text-sm font-semibold text-navy">Rápido e simples</p>
                  <p className="mt-2 text-sm text-ink/65">Preencha o feedback sem julga mentos e sem complicações.</p>
                </div>
                <div className="rounded-3xl border border-line bg-paper-dim px-5 py-4">
                  <p className="text-sm font-semibold text-navy">Anónimo quando quiser</p>
                  <p className="mt-2 text-sm text-ink/65">Pode deixar nome e email apenas se quiser ser contactado.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <a
                  href="#form"
                  className="inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-navy-deep"
                >
                  Dar feedback agora
                </a>
                <span className="text-sm text-ink/60"><strong>Sem cadastro</strong> • Totalmente orientado para melhorias</span>
              </div>
            </div>

            <div className="relative flex items-center justify-center reveal-on-scroll reveal-delay-200">
              <div className="absolute -right-12 -top-10 h-56 w-56 rounded-full bg-navy/5 blur-3xl" />
              <div className="relative w-full max-w-[360px] rounded-[2rem] border border-line bg-white/95 p-8 shadow-card sm:p-10">
                <SatisfactionDial value={87} label="Satisfação nos últimos 30 dias" />
                <p className="mt-5 text-center text-sm text-ink/70">Meta contínua de melhoria com base em cada opinião que recebemos.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-5">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className={`rounded-[1.75rem] border border-line bg-white/85 p-6 shadow-card transition hover:-translate-y-1 hover:bg-white sm:p-7 reveal-on-scroll ${step.delay}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-sm font-semibold text-paper">
                  {step.n}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="form" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="rounded-[2rem] border border-line bg-white/95 p-8 shadow-card sm:p-10 reveal-on-scroll reveal-delay-100">
              <p className="eyebrow">Deixe a sua voz</p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">
                Envie feedback de forma simples e segura
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-ink/75">
                Cada comentário ajuda a melhorar atendimento, instalações e serviços online. E se preferir, pode deixar o seu feedback sem nome nem email.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex gap-4 rounded-3xl border border-line bg-paper-dim p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy text-paper">⭐</span>
                  <div>
                    <p className="font-semibold text-navy">Classificação rápida</p>
                    <p className="text-sm text-ink/65">Escolha entre 1 e 5 estrelas e ajude-nos a perceber o seu nível de satisfação.</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-3xl border border-line bg-paper-dim p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold text-paper">💬</span>
                  <div>
                    <p className="font-semibold text-navy">Mensagem detalhada</p>
                    <p className="text-sm text-ink/65">Conte-nos o que correu bem ou o que podemos melhorar.</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-3xl border border-line bg-paper-dim p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal text-paper">🔒</span>
                  <div>
                    <p className="font-semibold text-navy">Privacidade opcional</p>
                    <p className="text-sm text-ink/65">Os seus dados pessoais são só para contacto se quiser deixar nome e email.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal-on-scroll reveal-delay-200">
              <FeedbackForm
                onSuccess={() =>
                  setToast({ message: "Obrigado! O seu feedback foi registado com sucesso.", tone: "success" })
                }
                onError={(message) => setToast({ message, tone: "error" })}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="rule">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-ink/40 sm:px-6">
          Este canal destina-se exclusivamente a feedback sobre os serviços da instituição.
        </div>
      </footer>

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}
