interface ToastProps {
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, tone = "success", onClose }: ToastProps) {
  const toneClasses =
    tone === "success"
      ? "bg-navy text-paper border-navy-deep"
      : "bg-brick text-paper border-brick";

  return (
    <div
      role="status"
      className={`fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-xl2 border px-5 py-4 shadow-lift animate-rise animate-pop sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm ${toneClasses}`}
    >
      <p className="text-sm leading-snug">{message}</p>
      <button
        onClick={onClose}
        aria-label="Fechar notificação"
        className="ml-2 text-paper/70 hover:text-paper"
      >
        ✕
      </button>
    </div>
  );
}
