import { useState } from "react";
import { Heart, Wind, Droplets, Thermometer, Brain, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import clsx from "clsx";
import type { Patient, VitalsHistoryPoint } from "../types";

const RISK_STYLES = {
  LOW:      { card: "border-emerald-800 bg-emerald-950/30", badge: "bg-emerald-700 text-emerald-100", label: "LOW" },
  MEDIUM:   { card: "border-yellow-700 bg-yellow-950/30",   badge: "bg-yellow-600 text-yellow-100",   label: "MEDIUM" },
  HIGH:     { card: "border-orange-600 bg-orange-950/40",   badge: "bg-orange-600 text-orange-100",   label: "HIGH" },
  CRITICAL: { card: "border-red-500 bg-red-950/50 shadow-red-900/50 shadow-lg", badge: "bg-red-600 text-red-100", label: "CRITICAL" },
};

interface Props {
  patient: Patient;
  history: VitalsHistoryPoint[];
  onClick: () => void;
  selected: boolean;
}

export function PatientCard({ patient, history, onClick, selected }: Props) {
  const risk = RISK_STYLES[patient.risk_level];
  const isCritical = patient.risk_level === "CRITICAL";

  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-xl border p-4 cursor-pointer transition-all duration-300",
        risk.card,
        selected && "ring-2 ring-cyan-500",
        isCritical && "animate-pulse_fast",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white text-sm leading-tight">{patient.patient_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{patient.age}y · {patient.ward}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", risk.badge)}>
            {risk.label}
          </span>
          <span className="text-xs text-slate-500">
            qSOFA <span className="font-bold text-slate-300">{patient.qsofa_score}/3</span>
          </span>
        </div>
      </div>

      {/* Risk score bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Risk score</span>
          <span className="font-mono text-slate-300">{patient.risk_score.toFixed(1)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-700">
          <div
            className={clsx("h-1.5 rounded-full transition-all duration-700",
              patient.risk_level === "CRITICAL" ? "bg-red-500" :
              patient.risk_level === "HIGH"     ? "bg-orange-500" :
              patient.risk_level === "MEDIUM"   ? "bg-yellow-500" : "bg-emerald-500"
            )}
            style={{ width: `${Math.min(100, (patient.risk_score / 8) * 100)}%` }}
          />
        </div>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <VitalBadge icon={<Heart size={11} />} label="HR" value={`${patient.heart_rate?.toFixed(0)}`} unit="bpm"
          warn={patient.heart_rate > 100 || patient.heart_rate < 50} />
        <VitalBadge icon={<Activity size={11} />} label="BP" value={`${patient.systolic_bp?.toFixed(0)}/${patient.diastolic_bp?.toFixed(0)}`}
          warn={patient.systolic_bp < 100} />
        <VitalBadge icon={<Droplets size={11} />} label="SpO₂" value={`${patient.spo2?.toFixed(1)}`} unit="%"
          warn={patient.spo2 < 94} critical={patient.spo2 < 90} />
        <VitalBadge icon={<Thermometer size={11} />} label="Temp" value={`${patient.temperature?.toFixed(1)}`} unit="°C"
          warn={patient.temperature > 38.3 || patient.temperature < 36} />
        <VitalBadge icon={<Wind size={11} />} label="RR" value={`${patient.respiratory_rate?.toFixed(0)}`} unit="/min"
          warn={patient.respiratory_rate >= 22} />
        <VitalBadge icon={<Brain size={11} />} label="Lactate" value={`${patient.lactate?.toFixed(1)}`} unit="mmol"
          warn={patient.lactate >= 2} critical={patient.lactate >= 4} />
      </div>

      {/* Sparkline */}
      {history.length > 3 && (
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line type="monotone" dataKey="risk_score" stroke={isCritical ? "#ef4444" : "#06b6d4"}
                dot={false} strokeWidth={1.5} isAnimationActive={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }}
                formatter={(v: number) => [v.toFixed(1), "Risk"]}
                labelFormatter={() => ""}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Flags */}
      {patient.flags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {patient.flags.slice(0, 3).map(f => (
            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {f}
            </span>
          ))}
          {patient.flags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
              +{patient.flags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function VitalBadge({ icon, label, value, unit, warn, critical }: {
  icon: React.ReactNode; label: string; value: string; unit?: string;
  warn?: boolean; critical?: boolean;
}) {
  return (
    <div className={clsx(
      "rounded-lg px-2 py-1.5 text-center border",
      critical ? "bg-red-950 border-red-700" :
      warn     ? "bg-orange-950 border-orange-800" :
                 "bg-slate-800 border-slate-700"
    )}>
      <div className={clsx("flex items-center justify-center gap-0.5 mb-0.5",
        critical ? "text-red-400" : warn ? "text-orange-400" : "text-slate-500")}>
        {icon}
        <span className="text-[9px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={clsx("font-mono font-bold text-xs leading-none",
        critical ? "text-red-300" : warn ? "text-orange-300" : "text-slate-300")}>
        {value}
        {unit && <span className="text-[9px] font-normal ml-0.5 opacity-70">{unit}</span>}
      </p>
    </div>
  );
}
