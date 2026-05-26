import { Bell, AlertTriangle, AlertOctagon } from "lucide-react";
import type { Alert } from "../types";
import clsx from "clsx";

interface Props {
  alerts: Alert[];
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function AlertPanel({ alerts }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
        <Bell size={15} className="text-cyan-400" />
        <span className="text-sm font-semibold text-slate-200">Active Alerts</span>
        {alerts.length > 0 && (
          <span className="ml-auto text-xs bg-red-700 text-red-100 px-2 py-0.5 rounded-full font-bold">
            {alerts.length}
          </span>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600">
            <Bell size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          alerts.map(alert => <AlertRow key={alert.alert_id} alert={alert} />)
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const isCritical = alert.risk_level === "CRITICAL";
  return (
    <div className={clsx(
      "px-4 py-3 transition-colors",
      isCritical ? "bg-red-950/30 hover:bg-red-950/50" : "hover:bg-slate-800/50"
    )}>
      <div className="flex items-start gap-2">
        {isCritical
          ? <AlertOctagon size={14} className="text-red-400 mt-0.5 shrink-0" />
          : <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white truncate">{alert.patient_name}</p>
            <span className={clsx(
              "text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0",
              isCritical ? "bg-red-700 text-red-100" : "bg-orange-700 text-orange-100"
            )}>
              {alert.risk_level}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{alert.ward} · qSOFA {alert.qsofa_score}/3 · Score {alert.risk_score.toFixed(1)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {alert.flags.slice(0, 2).map(f => (
              <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 leading-tight">
                {f}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-1">{timeAgo(alert.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}
