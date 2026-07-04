"use client";

// Yengil SVG grafiklar (dashboardlar uchun).
// Ranglar tekshiruvdan o'tgan: indigo #6366f1 asosiy seriya rangi,
// status ranglari (emerald/amber/rose/sky) faqat holat ma'lumotlari uchun.
import { useRef, useState } from "react";
import { fmtNumber } from "@/lib/utils";

export type ChartPoint = { label: string; value: number };

const W = 600;
const PAD = { top: 14, right: 12, bottom: 26, left: 40 };
const GRID = "#e2e8f0"; // slate-200 — bilinar-bilinmas to'r
const INK_MUTED = "#94a3b8"; // slate-400 — matn har doim matn rangida
const INK = "#475569"; // slate-600

function niceMax(max: number): number {
  if (max <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function useHover(count: number, plotLeft: number, plotWidth: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || count === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const step = plotWidth / count;
    const i = Math.floor((x - plotLeft) / step);
    setIdx(i >= 0 && i < count ? i : null);
  };
  return { ref, idx, onMove, onLeave: () => setIdx(null) };
}

function Tooltip({ x, label, value, suffix }: { x: number; label: string; value: number; suffix: string }) {
  const left = Math.min(Math.max((x / W) * 100, 8), 92);
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg"
      style={{ left: `${left}%` }}
    >
      <div className="text-slate-300">{label}</div>
      <div className="font-semibold">
        {fmtNumber(value)}
        {suffix}
      </div>
    </div>
  );
}

/** Bitta seriyali chiziqli grafik (o'sish dinamikasi kabi) */
export function LineChart({
  data,
  height = 200,
  color = "#6366f1",
  suffix = "",
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  suffix?: string;
}) {
  const H = height;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const { ref, idx, onMove, onLeave } = useHover(data.length, PAD.left, plotW);

  if (data.length === 0) return <div className="py-10 text-center text-sm text-slate-400">Ma'lumot yo'q</div>;

  const px = (i: number) => PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const py = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(d.value)}`).join(" ");
  const area = `${path} L${px(data.length - 1)},${PAD.top + plotH} L${px(0)},${PAD.top + plotH} Z`;
  const ticks = [0, 0.5, 1].map((t) => max * t);
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <div className="relative">
      {idx !== null && <Tooltip x={px(idx)} label={data[idx].label} value={data[idx].value} suffix={suffix} />}
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        role="img"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill={INK_MUTED}>
              {fmtNumber(t)}
            </text>
          </g>
        ))}
        <path d={area} fill={color} opacity="0.08" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i}>
            {i % labelEvery === 0 && (
              <text x={px(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={INK_MUTED}>
                {d.label}
              </text>
            )}
            {idx === i && (
              <>
                <line x1={px(i)} x2={px(i)} y1={PAD.top} y2={PAD.top + plotH} stroke={color} strokeWidth="1" opacity="0.3" />
                <circle cx={px(i)} cy={py(d.value)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Bitta seriyali ustunli grafik (haftalik davomat kabi) */
export function BarChart({
  data,
  height = 200,
  color = "#6366f1",
  suffix = "",
  maxValue,
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  suffix?: string;
  maxValue?: number;
}) {
  const H = height;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = maxValue ?? niceMax(Math.max(...data.map((d) => d.value), 1));
  const { ref, idx, onMove, onLeave } = useHover(data.length, PAD.left, plotW);

  if (data.length === 0) return <div className="py-10 text-center text-sm text-slate-400">Ma'lumot yo'q</div>;

  const step = plotW / data.length;
  const barW = Math.min(step * 0.6, 42);
  const py = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.5, 1].map((t) => max * t);
  const showValues = data.length <= 14;

  return (
    <div className="relative">
      {idx !== null && (
        <Tooltip x={PAD.left + idx * step + step / 2} label={data[idx].label} value={data[idx].value} suffix={suffix} />
      )}
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        role="img"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill={INK_MUTED}>
              {fmtNumber(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * step + (step - barW) / 2;
          const y = py(d.value);
          const h = Math.max(PAD.top + plotH - y, d.value > 0 ? 3 : 0);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="4"
                fill={color}
                opacity={idx === null || idx === i ? 1 : 0.45}
              />
              {showValues && d.value > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill={INK}>
                  {fmtNumber(d.value)}
                  {suffix}
                </text>
              )}
              <text x={PAD.left + i * step + step / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={INK_MUTED}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Holat taqsimoti (davomat statuslari kabi) — yorliqli gorizontal segmentlar */
export function SegmentBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div className="py-6 text-center text-sm text-slate-400">Ma'lumot yo'q</div>;
  return (
    <div>
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}: <span className="font-semibold">{fmtNumber(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
