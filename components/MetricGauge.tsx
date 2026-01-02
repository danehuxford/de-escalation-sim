"use client";

import React from "react";

type MetricGaugeProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  detail?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const pointOnArc = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (Math.PI / 180) * (deg - 90);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

const arcPath = (
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  steps = 40
) => {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const d = fromDeg + (toDeg - fromDeg) * t;
    points.push(pointOnArc(cx, cy, r, d));
  }
  const [first, ...rest] = points;
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")}`;
};

export default function MetricGauge({
  label,
  value,
  min = 0,
  max = 100,
  size = 160,
  showValue = true,
  detail
}: MetricGaugeProps) {
  const sizePx = size ?? 160;
  const SIZE = 120;
  const R = 48;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const stroke = 10;

  const raw = Number(value);
  const safe = Number.isFinite(raw) ? raw : 0;
  const minV = min ?? 0;
  const maxV = max ?? 100;
  const clamped = clamp(safe, minV, maxV);
  const t = (clamped - minV) / (maxV - minV || 1);
  const angleDeg = -90 + t * 180;

  const needleLen = R;
  const tickAngles = [-90, -45, 0, 45, 90];
  const tickOuter = R + 3;
  const tickInner = R - 8;
  const neutralTickInner = R - 12;
  const neutralTickOuter = R + 4;

  const trackPath = arcPath(CX, CY, R, -90, 90);
  const leftArc = arcPath(CX, CY, R, -90, 0);
  const rightArc = arcPath(CX, CY, R, 0, 90);

  const showDebug =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEBUG_METRICS === "1";

  const needleTip = pointOnArc(CX, CY, needleLen, angleDeg);
  const debugTip = pointOnArc(CX, CY, needleLen + 6, angleDeg);

  return (
    <div
      className="flex flex-col items-center gap-2"
      aria-label={`${label} ${Math.round(clamped)} out of 100`}
      data-value={process.env.NODE_ENV !== "production" ? clamped : undefined}
      data-angle={process.env.NODE_ENV !== "production" ? angleDeg.toFixed(1) : undefined}
    >
      <svg
        width={sizePx}
        height={sizePx}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id={`${label}-left-gradient`}
            x1={CX - R}
            y1={CY}
            x2={CX}
            y2={CY - R}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient
            id={`${label}-right-gradient`}
            x1={CX}
            y1={CY - R}
            x2={CX + R}
            y2={CY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.9" />
          </linearGradient>
          <filter id={`${label}-needle-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.6" />
          </filter>
        </defs>

        <path
          d={trackPath}
          stroke="#1f2937"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          opacity={0.45}
        />
        <path
          d={leftArc}
          stroke={`url(#${label}-left-gradient)`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={rightArc}
          stroke={`url(#${label}-right-gradient)`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />

        {tickAngles.map((tickAngle) => {
          const isNeutral = tickAngle === 0;
          const outer = isNeutral ? neutralTickOuter : tickOuter;
          const inner = isNeutral ? neutralTickInner : tickInner;
          const outerPoint = pointOnArc(CX, CY, outer, tickAngle);
          const innerPoint = pointOnArc(CX, CY, inner, tickAngle);
          return (
            <line
              key={tickAngle}
              x1={outerPoint.x}
              y1={outerPoint.y}
              x2={innerPoint.x}
              y2={innerPoint.y}
              stroke={isNeutral ? "#e2e8f0" : "#64748b"}
              strokeWidth={isNeutral ? 2 : 1}
              opacity={isNeutral ? 0.9 : 0.6}
            />
          );
        })}

        {showDebug && (
          <line
            x1={CX}
            y1={CY}
            x2={debugTip.x}
            y2={debugTip.y}
            stroke="#38bdf8"
            strokeWidth={1}
            opacity={0.35}
          />
        )}
        <line
          x1={CX}
          y1={CY}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={4}
          strokeLinecap="round"
          filter={`url(#${label}-needle-shadow)`}
          style={{
            transition: "all 250ms cubic-bezier(0.2, 0.8, 0.2, 1)"
          }}
        />

        {showDebug && (
          <>
            {[-90, 0, 90].map((tickAngle) => {
              const point = pointOnArc(CX, CY, R + 10, tickAngle);
              const label =
                tickAngle === -90 ? "-90" : tickAngle === 0 ? "0" : "+90";
              return (
                <text
                  key={tickAngle}
                  x={point.x}
                  y={point.y}
                  fill="#94a3b8"
                  fontSize="6"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              );
            })}
          </>
        )}
        {showDebug && (
          <circle cx={CX} cy={CY} r={1} fill="red" />
        )}
        <circle cx={CX} cy={CY} r={3} fill="white" />
      </svg>
      <div className="text-base font-semibold text-slate-200">{label}</div>
      {showValue && (
        <div className="text-xs text-slate-400">
          {Math.round(clamped)}
          {detail ? <div className="text-[11px] text-slate-500">{detail}</div> : null}
          {showDebug && (
            <div className="text-[10px] text-slate-600">
              v={Math.round(clamped)} a={angleDeg.toFixed(1)}°
            </div>
          )}
        </div>
      )}
    </div>
  );
}
