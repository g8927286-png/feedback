interface SatisfactionDialProps {
  /** Valor entre 0 e 100 */
  value: number;
  label?: string;
  size?: number;
}

/**
 * Elemento de assinatura visual do produto: um mostrador semicircular
 * que representa "o quanto a instituição está a ouvir bem" — reutilizado
 * de forma decorativa na página pública e de forma funcional (com dados
 * reais) no painel de administração.
 */
export default function SatisfactionDial({ value, label, size = 220 }: SatisfactionDialProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 80;
  const circumference = Math.PI * radius; // semicírculo
  const offset = circumference - (clamped / 100) * circumference;

  const angle = (clamped / 100) * 180 - 90;
  const needleRad = (angle * Math.PI) / 180;
  const needleX = 100 + Math.sin(needleRad) * 62;
  const needleY = 100 - Math.cos(needleRad) * 62;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 200 120" className="w-full">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#D6DBD8"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#dial-gradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <defs>
          <linearGradient id="dial-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#AE4438" />
            <stop offset="50%" stopColor="#C6982F" />
            <stop offset="100%" stopColor="#3C7859" />
          </linearGradient>
        </defs>
        <line
          x1="100"
          y1="100"
          x2={needleX}
          y2={needleY}
          stroke="#1E2F52"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <circle cx="100" cy="100" r="6" fill="#1E2F52" />
      </svg>
      <div className="-mt-4 text-center">
        <p className="font-display text-3xl font-semibold text-navy">{clamped.toFixed(0)}%</p>
        {label && <p className="eyebrow mt-1">{label}</p>}
      </div>
    </div>
  );
}
