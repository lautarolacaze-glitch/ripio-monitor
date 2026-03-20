interface StatusBadgeProps {
  status: "up" | "down" | "scanning" | "error";
}

const config: Record<
  StatusBadgeProps["status"],
  { color: string; dot: string; label: string; pulse: boolean }
> = {
  up: {
    color: "text-green-400",
    dot: "bg-green-400",
    label: "En linea",
    pulse: false,
  },
  down: {
    color: "text-red-400",
    dot: "bg-red-400",
    label: "Fuera de linea",
    pulse: false,
  },
  scanning: {
    color: "text-blue-400",
    dot: "bg-blue-400",
    label: "Escaneando",
    pulse: true,
  },
  error: {
    color: "text-orange-400",
    dot: "bg-orange-400",
    label: "Error",
    pulse: false,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { color, dot, label, pulse } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium ${color}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dot}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  );
}
