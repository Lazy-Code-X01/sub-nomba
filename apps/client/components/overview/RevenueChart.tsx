"use client";

import { useState, useRef, useCallback } from "react";

export interface ChartPoint {
  label: string;
  revenue: number;
  refunds: number;
}

function fmtTick(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

const W   = 760;
const H   = 260;
const PAD = { top: 20, right: 20, bottom: 44, left: 60 };
const IW  = W - PAD.left - PAD.right;
const IH  = H - PAD.top  - PAD.bottom;

function computeYAxis(dataMax: number): { ticks: number[]; scale: number } {
  if (dataMax === 0) return { ticks: [0, 25, 50, 75, 100], scale: 100 };
  const roughStep = dataMax / 4;
  const power = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm  = roughStep / power;
  const step  = norm < 1.5  ? power
              : norm < 2.25 ? 2 * power
              : norm < 3.75 ? 2.5 * power
              : norm < 7.5  ? 5 * power
              : 10 * power;
  const scale  = step * (Math.ceil(dataMax / step) + 1);
  const ticks: number[] = [];
  for (let v = 0; v <= scale + step * 0.01; v += step) ticks.push(Math.round(v));
  return { ticks, scale };
}

function smooth(pts: [number, number][]): string {
  return pts.map(([x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cpx = (px + x) / 2;
    return `C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`;
  }).join(" ");
}

export default function RevenueChart({ data }: { data: ChartPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || data.length < 2) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(0, Math.min(data.length - 1,
      Math.round(((mx - PAD.left) / IW) * (data.length - 1))
    ));
    setHoverIdx(idx);
  }, [data.length]);

  const legend = (
    <div className="flex items-center gap-5 mb-5">
      <div className="flex items-center gap-2">
        <span className="inline-block w-5 h-0.5 rounded-full bg-yellow" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-label-3">Revenue</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-4 border-t border-dashed border-red" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-label-3">Refunds</span>
      </div>
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="pt-4 pb-5 px-5">
        {legend}
        <div className="flex items-center justify-center py-16">
          <p className="font-mono text-[12px] text-label-3">No revenue data yet.</p>
        </div>
      </div>
    );
  }

  const dataMax = Math.max(...data.map(d => d.revenue), 0);
  const { ticks: yTicks, scale: maxVal } = computeYAxis(dataMax);

  const toX = (i: number) => data.length === 1 ? PAD.left + IW / 2 : PAD.left + (i / (data.length - 1)) * IW;
  const toY = (v: number) => PAD.top + (1 - v / maxVal) * IH;
  const baseline = PAD.top + IH;

  const revPts: [number, number][] = data.map((d, i) => [toX(i), toY(d.revenue)]);
  const refPts: [number, number][] = data.map((d, i) => [toX(i), toY(d.refunds)]);

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const hx = hoverIdx !== null ? toX(hoverIdx) : 0;
  const TW = 172;
  const TH = 72;

  return (
    <div className="pt-4 pb-5 px-5">
      {legend}

      <div style={{ width: "100%", aspectRatio: `${W} / ${H}` }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--yellow)" stopOpacity="0.20" />
              <stop offset="100%" stopColor="var(--yellow)" stopOpacity="0"    />
            </linearGradient>
            <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--red)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--red)" stopOpacity="0"    />
            </linearGradient>
          </defs>

          {yTicks.map((v) => {
            const y = toY(v);
            return (
              <g key={v}>
                <line
                  x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="var(--border)" strokeWidth="1" strokeDasharray="5 6"
                />
                <text
                  x={8} y={y + 4}
                  textAnchor="start" fill="var(--text3)"
                  fontSize="10" fontFamily="var(--font-jetbrains)"
                >
                  {fmtTick(v)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => (
            <text
              key={i}
              x={toX(i)} y={H - 12}
              textAnchor="middle"
              fill={hoverIdx === i ? "var(--text2)" : "var(--text3)"}
              fontSize="10" fontFamily="var(--font-jetbrains)"
            >
              {d.label}
            </text>
          ))}

          <path
            d={`${smooth(revPts)} L ${toX(data.length - 1)} ${baseline} L ${toX(0)} ${baseline} Z`}
            fill="url(#revGrad)"
          />
          <path
            d={`${smooth(refPts)} L ${toX(data.length - 1)} ${baseline} L ${toX(0)} ${baseline} Z`}
            fill="url(#refGrad)"
          />
          <path
            d={smooth(revPts)}
            fill="none" stroke="var(--yellow)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d={smooth(refPts)}
            fill="none" stroke="var(--red)"
            strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round"
          />

          {data.length === 1 && (
            <circle
              cx={toX(0)} cy={toY(data[0].revenue)} r="5"
              fill="var(--yellow)" stroke="var(--surface)" strokeWidth="2.5"
            />
          )}

          {hoverIdx !== null && hovered && (
            <g>
              <line
                x1={hx} y1={PAD.top} x2={hx} y2={baseline}
                stroke="var(--border2)" strokeWidth="1"
              />
              <circle cx={hx} cy={toY(hovered.revenue)} r="5"
                fill="var(--yellow)" stroke="var(--surface)" strokeWidth="2.5" />
              <circle cx={hx} cy={toY(hovered.refunds)} r="4"
                fill="var(--red)" stroke="var(--surface)" strokeWidth="2" />
              {(() => {
                const flipLeft = hx + TW + 14 > W - PAD.right;
                const tx = flipLeft ? hx - TW - 14 : hx + 14;
                const ty = Math.max(
                  PAD.top + 4,
                  Math.min(toY(hovered.revenue) - TH / 2, baseline - TH - 4)
                );
                return (
                  <g>
                    <rect x={tx} y={ty} width={TW} height={TH} rx="8"
                      fill="var(--surface3)" stroke="var(--border2)" strokeWidth="1" />
                    <text x={tx + 12} y={ty + 17} fill="var(--text3)" fontSize="9" fontFamily="var(--font-jetbrains)">
                      {hovered.label}
                    </text>
                    <circle cx={tx + 13} cy={ty + 33} r="3" fill="var(--yellow)" />
                    <text x={tx + 22} y={ty + 37} fill="var(--text2)" fontSize="9" fontFamily="var(--font-jetbrains)">Revenue</text>
                    <text x={tx + TW - 12} y={ty + 37} textAnchor="end" fill="var(--yellow)" fontSize="10" fontWeight="600" fontFamily="var(--font-jetbrains)">
                      {fmtTick(hovered.revenue)}
                    </text>
                    <circle cx={tx + 13} cy={ty + 53} r="3" fill="var(--red)" />
                    <text x={tx + 22} y={ty + 57} fill="var(--text2)" fontSize="9" fontFamily="var(--font-jetbrains)">Refunds</text>
                    <text x={tx + TW - 12} y={ty + 57} textAnchor="end" fill="var(--red)" fontSize="10" fontWeight="600" fontFamily="var(--font-jetbrains)">
                      {fmtTick(hovered.refunds)}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
