import type { TabKey } from "./constants";

export function MobileCommandStrip({ nextTaskTitle, energy, onChangeTab }: { nextTaskTitle: string; energy: number; onChangeTab: (tab: TabKey) => void }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-slate-200 bg-slate-950/95 p-3 text-white shadow-2xl shadow-slate-900/30 backdrop-blur sm:hidden">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-200">Next tiny action</p>
        <p className="mt-1 truncate text-sm font-black">{nextTaskTitle || "Ask Lexa for the next move"}</p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <button onClick={() => onChangeTab("tasks")} className="min-h-11 rounded-2xl bg-white px-2 text-xs font-black text-slate-950">Tasks</button>
        <button onClick={() => onChangeTab("clients")} className="min-h-11 rounded-2xl bg-white/15 px-2 text-xs font-black">Clients</button>
        <button onClick={() => onChangeTab("analytics")} className="min-h-11 rounded-2xl bg-white/15 px-2 text-xs font-black">Log</button>
        <div className="flex min-h-11 items-center justify-center rounded-2xl bg-indigo-500 px-2 text-xs font-black">{energy || "–"}/10</div>
      </div>
    </div>
  );
}
