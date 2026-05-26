import { Activity, Wifi, WifiOff, Clock } from "lucide-react";
import type { ICUStats } from "../types";
import clsx from "clsx";

interface Props {
  stats: ICUStats;
  connected: boolean;
  lastUpdate: Date | null;
}

export function Header({ stats, connected, lastUpdate }: Props) {
  return (
    <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <Activity className="text-cyan-400" size={24} />
          <span className="font-bold text-white text-lg tracking-tight">SepsisGuard</span>
          <span className="text-xs text-slate-500 ml-1">AI-Powered ICU Monitor</span>
        </div>

        {/* Stats pills */}
        <div className="flex gap-3 flex-1">
          <StatPill label="Total" value={stats.total_patients} color="slate" />
          <StatPill label="Critical" value={stats.critical} color="red" blink={stats.critical > 0} />
          <StatPill label="High Risk" value={stats.high} color="orange" />
          <StatPill label="Stable" value={stats.stable} color="green" />
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-4 text-sm">
          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={13} />
              <span>{lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
          <div className={clsx(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
            connected
              ? "text-emerald-400 border-emerald-700 bg-emerald-950"
              : "text-red-400 border-red-800 bg-red-950"
          )}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "Live" : "Reconnecting…"}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatPill({
  label, value, color, blink,
}: {
  label: string; value: number; color: string; blink?: boolean;
}) {
  const colors: Record<string, string> = {
    slate:  "bg-slate-800 border-slate-600 text-slate-300",
    red:    "bg-red-950 border-red-700 text-red-300",
    orange: "bg-orange-950 border-orange-700 text-orange-300",
    green:  "bg-emerald-950 border-emerald-700 text-emerald-300",
  };
  return (
    <div className={clsx(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm",
      colors[color],
      blink && value > 0 && "animate-pulse",
    )}>
      <span className="font-bold text-base leading-none">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}
