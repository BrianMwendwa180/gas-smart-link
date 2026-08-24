interface GaugeProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit: string;
  decimals?: number;
  tone?: "gas" | "petrol" | "info" | "warn";
  size?: number;
}

const TONE: Record<string, string> = {
  gas: "var(--gas)",
  petrol: "var(--petrol)",
  info: "var(--info)",
  warn: "var(--warn)",
};

export function Gauge({
  label,
  value,
  min = 0,
  max,
  unit,
  decimals = 0,
  tone = "gas",
  size = 148,
}: GaugeProps) {
  const clamped = Math.min(Math.max(value, min), max);
  const pct = (clamped - min) / (max - min || 1);
  const start = 135;
  const sweep = 270;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arc = (sweep / 360) * circ;

  const ticks = Array.from({ length: 9 }, (_, i) => start + (sweep / 8) * i);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="overflow-visible">
        <g transform={`rotate(${start} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--grid)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={TONE[tone]}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${arc * pct} ${circ}`}
            style={{ transition: "stroke-dasharray 400ms ease-out" }}
          />
        </g>
        {ticks.map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const inner = r - 12;
          return (
            <line
              key={i}
              x1={cx + Math.cos(rad) * inner}
              y1={cy + Math.sin(rad) * inner}
              x2={cx + Math.cos(rad) * (inner - 5)}
              y2={cy + Math.sin(rad) * (inner - 5)}
              stroke="var(--grid)"
              strokeWidth={1.5}
            />
          );
        })}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          className="readout fill-foreground"
          style={{ fontSize: size * 0.2, fontWeight: 600 }}
        >
          {clamped.toFixed(decimals)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.16}
          textAnchor="middle"
          className="fill-muted-foreground readout"
          style={{ fontSize: 10, letterSpacing: "0.12em" }}
        >
          {unit.toUpperCase()}
        </text>
      </svg>
      <span className="label-caps">{label}</span>
    </div>
  );
}
