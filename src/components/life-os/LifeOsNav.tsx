import type { TabKey } from "./constants";
import { tabs } from "./constants";

export function LifeOsNav({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="flex snap-x gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-white/80 p-2 shadow-lg shadow-slate-200/60 backdrop-blur md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-9" aria-label="Life OS sections">
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onChange(tab.key)} className={`min-h-12 min-w-32 shrink-0 snap-start rounded-2xl px-3 py-3 text-left transition md:min-w-0 ${activeTab === tab.key ? "bg-slate-950 text-white shadow-xl shadow-slate-300" : "text-slate-600 hover:bg-slate-100"}`}>
          <span className="flex items-center gap-2 text-sm font-black"><span aria-hidden>{tab.icon}</span><span className="sm:hidden md:inline">{tab.shortLabel}</span><span className="hidden sm:inline">{tab.label}</span></span>
          <span className="mt-1 block break-words text-xs leading-tight opacity-70">{tab.hint}</span>
        </button>
      ))}
    </nav>
  );
}
