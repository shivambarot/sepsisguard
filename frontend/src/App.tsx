import { useState } from "react";
import { Bell, Shield } from "lucide-react";
import { useICU } from "./hooks/useICU";
import { Header } from "./components/Header";
import { PatientCard } from "./components/PatientCard";
import { PatientDetail } from "./components/PatientDetail";
import { AlertPanel } from "./components/AlertPanel";
import { GovernancePanel } from "./components/GovernancePanel";
import type { Patient } from "./types";
import clsx from "clsx";

const RISK_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
type SideTab = "alerts" | "governance";

export default function App() {
  const { patients, alerts, history, stats, connected, lastUpdate, totalEvents, eventsPerMin } = useICU();
  const [selected, setSelected] = useState<Patient | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>("alerts");

  const sorted = [...patients].sort(
    (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]
  );

  const criticalPct = patients.length > 0
    ? (patients.filter(p => p.risk_level === "CRITICAL" || p.risk_level === "HIGH").length / patients.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header stats={stats} connected={connected} lastUpdate={lastUpdate} />

      <div className="max-w-screen-2xl mx-auto flex gap-0 h-[calc(100vh-57px)]">
        {/* Patient grid */}
        <main className="flex-1 overflow-y-auto p-5">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <div className="w-12 h-12 border-2 border-cyan-700 border-t-cyan-400 rounded-full animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-500">Connecting to ICU stream…</p>
              <p className="text-sm mt-1">Make sure the backend is running on port 8000</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-sm text-slate-400 font-medium">
                  {patients.length} patients monitored · sorted by risk
                </h1>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sorted.map(p => (
                  <PatientCard
                    key={p.patient_id}
                    patient={p}
                    history={history[p.patient_id] ?? []}
                    onClick={() => setSelected(p)}
                    selected={selected?.patient_id === p.patient_id}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="w-72 border-l border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
            <TabBtn label="Alerts" icon={<Bell size={13} />} active={sideTab === "alerts"}
              badge={alerts.length} onClick={() => setSideTab("alerts")} />
            <TabBtn label="Governance" icon={<Shield size={13} />} active={sideTab === "governance"}
              onClick={() => setSideTab("governance")} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {sideTab === "alerts"
              ? <AlertPanel alerts={alerts} />
              : (
                <div className="p-3">
                  <GovernancePanel
                    eventsPerMin={eventsPerMin}
                    totalEvents={totalEvents}
                    criticalPct={criticalPct}
                  />
                </div>
              )
            }
          </div>
        </aside>
      </div>

      {/* Patient detail modal */}
      {selected && (
        <PatientDetail
          patient={patients.find(p => p.patient_id === selected.patient_id) ?? selected}
          history={history[selected.patient_id] ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function TabBtn({ label, icon, active, badge, onClick }: {
  label: string; icon: React.ReactNode; active: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors",
        active
          ? "border-cyan-500 text-cyan-400 bg-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}
      {label}
      {badge != null && badge > 0 && (
        <span className="bg-red-700 text-red-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}
