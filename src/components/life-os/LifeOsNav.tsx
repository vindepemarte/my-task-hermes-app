import type { TabKey } from "./constants";
import { tabs } from "./constants";

const primaryTabs: TabKey[] = ["overview", "battle", "tasks", "clients", "content", "analytics"];

export function LifeOsNav({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  const primary = tabs.filter((tab) => primaryTabs.includes(tab.key));
  const secondary = tabs.filter((tab) => !primaryTabs.includes(tab.key));

  return (
    <nav className="rounded-[1.75rem] border border-white/70 bg-white/90 p-2 shadow-lg shadow-slate-200/50 backdrop-blur" aria-label="Life OS sections">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {primary.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`min-h-12 rounded-2xl px-3 py-2 text-left transition ${
              activeTab === tab.key ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-black">
              <span aria-hidden>{tab.icon}</span>
              <span>{tab.shortLabel}</span>
            </span>
          </button>
        ))}
        <select
          value={secondary.some((tab) => tab.key === activeTab) ? activeTab : ""}
          onChange={(event) => event.target.value && onChange(event.target.value as TabKey)}
          className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
          aria-label="More Life OS sections"
        >
          <option value="">More</option>
          {secondary.map((tab) => (
            <option key={tab.key} value={tab.key}>{tab.shortLabel}</option>
          ))}
        </select>
      </div>
    </nav>
  );
}
