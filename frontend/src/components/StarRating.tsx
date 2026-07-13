interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

const LABELS: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Insatisfeito",
  3: "Neutro",
  4: "Satisfeito",
  5: "Muito satisfeito",
};

export default function StarRating({ value, onChange, readOnly = false, size = 32 }: StarRatingProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1" role={readOnly ? undefined : "radiogroup"} aria-label="Classificação">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              aria-label={LABELS[star]}
              aria-pressed={filled}
              onClick={() => onChange?.(star)}
              className={`transition-transform ${
                readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
              }`}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={filled ? "#C6982F" : "none"}
                stroke={filled ? "#C6982F" : "#9AA3AE"}
                strokeWidth="1.5"
              >
                <path
                  d="M12 2.5l2.9 6.1 6.6.8-4.85 4.55 1.25 6.6L12 17.6l-5.9 3.05 1.25-6.6L2.5 9.4l6.6-.8L12 2.5z"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          );
        })}
      </div>
      {!readOnly && (
        <p className="font-mono text-xs text-navy-soft h-4">{value ? LABELS[value] : "Selecione uma classificação"}</p>
      )}
    </div>
  );
}
