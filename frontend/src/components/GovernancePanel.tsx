import { useState } from "react";
import { Shield, GitBranch, Activity, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface Props {
  eventsPerMin: number;
  totalEvents: number;
  criticalPct: number;
}

const VITALS_SCHEMA_SUMMARY = [
  { field: "event_id",         type: "string (uuid)",  required: true  },
  { field: "patient_id",       type: "string",          required: true  },
  { field: "patient_name",     type: "string",          required: true  },
  { field: "heart_rate",       type: "number (bpm)",    required: true  },
  { field: "systolic_bp",      type: "number (mmHg)",   required: true  },
  { field: "spo2",             type: "number (%)",      required: true  },
  { field: "temperature",      type: "number (°C)",     required: true  },
  { field: "respiratory_rate", type: "number (/min)",   required: true  },
  { field: "lactate",          type: "number (mmol/L)", required: true  },
  { field: "gcs",              type: "integer [3–15]",  required: true  },
  { field: "wbc",              type: "number (k/uL)",   required: true  },
  { field: "timestamp",        type: "string (ISO 8601)",required: true },
];

const ALERTS_SCHEMA_SUMMARY = [
  { field: "alert_id",      type: "string (uuid)",   required: true },
  { field: "patient_id",    type: "string",           required: true },
  { field: "risk_level",    type: "enum: LOW/MEDIUM/HIGH/CRITICAL", required: true },
  { field: "risk_score",    type: "number [0–10]",   required: true },
  { field: "qsofa_score",   type: "integer [0–3]",   required: true },
  { field: "flags",         type: "string[]",         required: true },
  { field: "vitals_snapshot", type: "object",         required: true },
  { field: "timestamp",     type: "string (ISO 8601)", required: true },
];

const PIPELINE = [
  { id: "producer", label: "Python Producer",   sub: "8 patients · 4s interval",         color: "cyan",   topic: null },
  { id: "t1",       label: "icu-vitals",        sub: "JSON Schema · BACKWARD compat",    color: "violet", topic: true  },
  { id: "processor",label: "Stream Processor",  sub: "qSOFA + SIRS scoring",             color: "cyan",   topic: null },
  { id: "t2",       label: "sepsis-alerts",     sub: "JSON Schema · BACKWARD compat",    color: "violet", topic: true  },
  { id: "backend",  label: "FastAPI Backend",   sub: "WebSocket broadcast",              color: "cyan",   topic: null },
  { id: "ui",       label: "React Dashboard",   sub: "Real-time · <100ms latency",       color: "emerald",topic: null },
];

export function GovernancePanel({ eventsPerMin, totalEvents, criticalPct }: Props) {
  const [schemaOpen, setSchemaOpen] = useState<"vitals" | "alerts" | null>(null);

  return (
    <div className="space-y-4">
      {/* Stream health */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={15} className="text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Stream Health</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Events/min" value={eventsPerMin.toFixed(0)} color="cyan" />
          <Metric label="Total events" value={totalEvents > 999 ? `${(totalEvents/1000).toFixed(1)}k` : String(totalEvents)} color="slate" />
          <Metric label="Critical %" value={`${criticalPct.toFixed(0)}%`} color={criticalPct > 40 ? "red" : "emerald"} />
        </div>
      </div>

      {/* Data lineage */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">Data Lineage</span>
        </div>
        <div className="flex flex-col gap-1">
          {PIPELINE.map((node, i) => (
            <div key={node.id}>
              <div className={clsx(
                "rounded-lg px-3 py-2 border text-xs flex items-center justify-between",
                node.topic
                  ? "bg-violet-950/40 border-violet-700/50 text-violet-300"
                  : node.color === "emerald"
                    ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                    : "bg-slate-800 border-slate-600 text-slate-300"
              )}>
                <span className="font-medium">{node.label}</span>
                <span className={clsx("text-[10px]",
                  node.topic ? "text-violet-500" : "text-slate-500")}>{node.sub}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <div className="w-px h-3 bg-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Schema Registry */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} className="text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Schema Governance</span>
        </div>

        <div className="space-y-2">
          <SchemaCard
            subject="icu-vitals-value"
            version={1}
            compat="BACKWARD"
            fields={VITALS_SCHEMA_SUMMARY}
            open={schemaOpen === "vitals"}
            onToggle={() => setSchemaOpen(s => s === "vitals" ? null : "vitals")}
          />
          <SchemaCard
            subject="sepsis-alerts-value"
            version={1}
            compat="BACKWARD"
            fields={ALERTS_SCHEMA_SUMMARY}
            open={schemaOpen === "alerts"}
            onToggle={() => setSchemaOpen(s => s === "alerts" ? null : "alerts")}
          />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
          <GovernanceRule icon="check" text="Schema validation on produce" />
          <GovernanceRule icon="check" text="BACKWARD compatibility enforced" />
          <GovernanceRule icon="check" text="JSON Schema Draft-07" />
          <GovernanceRule icon="check" text="Required field enforcement" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    cyan:    "text-cyan-300",
    slate:   "text-slate-300",
    emerald: "text-emerald-300",
    red:     "text-red-400",
  };
  return (
    <div className="bg-slate-800 rounded-lg p-2.5 text-center border border-slate-700">
      <p className={clsx("font-mono font-bold text-lg leading-none", colors[color])}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function SchemaCard({ subject, version, compat, fields, open, onToggle }: {
  subject: string; version: number; compat: string;
  fields: { field: string; type: string; required: boolean }[];
  open: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-750 text-left transition-colors"
      >
        <div>
          <p className="text-xs font-mono text-amber-300">{subject}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">v{version} · {compat} · JSON Schema</p>
        </div>
        {open ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
      </button>
      {open && (
        <div className="divide-y divide-slate-800">
          {fields.map(f => (
            <div key={f.field} className="flex items-center justify-between px-3 py-1.5 bg-slate-900">
              <span className="text-[11px] font-mono text-slate-300">{f.field}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{f.type}</span>
                {f.required
                  ? <CheckCircle size={10} className="text-emerald-500" />
                  : <AlertCircle size={10} className="text-slate-600" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GovernanceRule({ icon, text }: { icon: "check" | "warn"; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <CheckCircle size={11} className="text-emerald-500 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
