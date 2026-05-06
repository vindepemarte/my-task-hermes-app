import type { ReactNode } from "react";
import type { TaskPriority } from "@/lib/lifeOsDb";
import { priorityStyle } from "./constants";

export function Shell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34rem),linear-gradient(135deg,#f8fafc,#eef2ff)] text-slate-950">{children}</main>;
}

export function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/50 backdrop-blur sm:p-5"><SectionHeader title={title} subtitle={subtitle} />{children}</section>;
}

export function Card({ children, tone = "white" }: { children: ReactNode; tone?: "white" | "slate" | "indigo" | "emerald" | "rose" | "fuchsia" }) {
  const toneClass = {
    white: "border-slate-200 bg-white",
    slate: "border-slate-200 bg-slate-50",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-950",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-950",
    rose: "border-rose-100 bg-rose-50 text-rose-950",
    fuchsia: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-950",
  }[tone];
  return <article className={`min-w-0 overflow-hidden rounded-3xl border p-4 shadow-sm ${toneClass}`}>{children}</article>;
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`max-w-full break-words rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{children}</span>;
}

export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`min-h-11 rounded-2xl px-4 py-2 text-sm font-black transition ${className}`}>{children}</button>;
}

export function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4 sm:text-sm" />;
}

export function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (value: string) => void; placeholder: string; rows?: number }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} className="w-full min-w-0 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold leading-6 text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4 sm:text-sm" />;
}

export function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-h-11 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-950 outline-none ring-indigo-200 transition focus:ring-4 sm:text-sm">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="min-w-0 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-500 md:col-span-2">{text}</div>;
}

export function MetricCard({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`min-w-0 rounded-3xl p-4 ring-1 ${danger ? "bg-rose-50 text-rose-950 ring-rose-100" : "bg-slate-950 text-white ring-slate-800"}`}><p className="break-words text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-2 break-words text-2xl font-black">{value}</p></div>;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-5 min-w-0"><h2 className="break-words text-xl font-black capitalize text-slate-950">{title}</h2><p className="mt-1 break-words text-sm leading-6 text-slate-500">{subtitle}</p></div>;
}

export function ActionCard({ title, body }: { title: string; body: string }) {
  return <Card><h3 className="break-words font-black text-slate-950">{title}</h3><p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{body}</p></Card>;
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return <Pill className={`shrink-0 ${priorityStyle[priority]}`}>{priority}</Pill>;
}
