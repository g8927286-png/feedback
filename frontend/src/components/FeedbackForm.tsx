import { FormEvent, useEffect, useState } from "react";
import { ApiError, getCategories, submitFeedback } from "../api";
import StarRating from "./StarRating";

interface FeedbackFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

const FALLBACK_CATEGORIES = [
  "Atendimento",
  "Instalações",
  "Serviços Online",
  "Comunicação",
  "Sugestão",
  "Outro",
];

export default function FeedbackForm({ onSuccess, onError }: FeedbackFormProps) {
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(FALLBACK_CATEGORIES[0]);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res.categories?.length) {
          setCategories(res.categories);
          setCategory(res.categories[0]);
        }
      })
      .catch(() => {
        /* mantém a lista de reserva em caso de falha de rede */
      });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});

    const localErrors: Record<string, string> = {};
    if (!rating) localErrors.rating = "Escolha uma classificação de 1 a 5.";
    if (message.trim().length < 5) localErrors.message = "Escreva pelo menos alguns detalhes.";
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({ name, email, category, rating, message });
      setName("");
      setEmail("");
      setCategory(categories[0]);
      setRating(0);
      setMessage("");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors || {});
        onError(err.message);
      } else {
        onError("Não foi possível enviar o feedback. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-[2rem] border border-line bg-white/95 p-6 shadow-card backdrop-blur-sm sm:p-8 animate-fade-in-up"
    >
      <div className="mb-6 sm:mb-7">
        <p className="eyebrow">Passo único</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-[28px]">
          Conte-nos como correu
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-ink/70">
          Leva menos de dois minutos. Os campos de identificação são opcionais.
        </p>
      </div>

      <div className="mb-6 sm:mb-7">
        <label className="mb-3 block text-sm font-medium text-navy">Como classifica a sua experiência?</label>
        <div className="rounded-3xl border border-line bg-paper-dim p-4">
          <StarRating value={rating} onChange={setRating} size={32} />
          <p className="mt-3 text-sm text-ink/65">Escolha as estrelas que refletem melhor a sua satisfação.</p>
        </div>
        {errors.rating && <p className="mt-3 text-sm text-brick">{errors.rating}</p>}
      </div>

      <div className="grid gap-6 sm:gap-7">
        <div className="rounded-3xl border border-line bg-paper-dim p-5">
          <label htmlFor="category" className="mb-2 block text-sm font-medium text-navy">
            Área a que se refere
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-navy"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-line bg-paper-dim p-5">
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-navy">
            A sua mensagem
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Descreva o que correu bem ou o que podemos melhorar..."
            className="min-h-[150px] w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none focus:border-navy"
          />
          <div className="mt-3 flex items-center justify-between text-sm text-ink/50">
            <span>{errors.message ? <span className="text-brick">{errors.message}</span> : "Mínimo 5 caracteres"}</span>
            <span className="font-mono text-xs text-ink/40">{message.length}/2000</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-line bg-paper-dim p-5">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-navy">
              Nome <span className="font-normal text-ink/40">(opcional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="O seu nome"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none focus:border-navy"
            />
          </div>
          <div className="rounded-3xl border border-line bg-paper-dim p-5">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-navy">
              Email <span className="font-normal text-ink/40">(opcional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none focus:border-navy"
            />
            {errors.email && <p className="mt-2 text-sm text-brick">{errors.email}</p>}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-navy px-6 py-3.5 text-sm font-semibold text-paper shadow-sm transition duration-200 hover:bg-navy-deep hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto animate-pop"
        >
          {submitting ? "A enviar..." : "Enviar feedback"}
        </button>
        <p className="mt-3 text-xs text-ink/40">
          Os dados de identificação são usados apenas para eventual contacto de seguimento.
        </p>
      </div>
    </form>
  );
}
