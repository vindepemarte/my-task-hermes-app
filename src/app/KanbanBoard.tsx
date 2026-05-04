"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";

type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "Low" | "Medium" | "High";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
};

const STORAGE_KEY = "my-task-hermes-app:tasks";

const columns: Array<{
  status: TaskStatus;
  label: string;
  accent: string;
}> = [
  { status: "todo", label: "Todo", accent: "bg-amber-400" },
  { status: "in-progress", label: "In Progress", accent: "bg-sky-500" },
  { status: "done", label: "Done", accent: "bg-emerald-500" },
];

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  Medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  High: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

const seededTasks: Task[] = [
  {
    id: "seed-1",
    title: "Draft launch checklist",
    description: "Outline the final QA pass, device checks, and release notes.",
    priority: "High",
    status: "todo",
  },
  {
    id: "seed-2",
    title: "Refine onboarding copy",
    description: "Tighten the hero message and clarify the first-run empty state.",
    priority: "Medium",
    status: "in-progress",
  },
  {
    id: "seed-3",
    title: "Archive resolved bugs",
    description: "Close completed tickets and capture any follow-up polish items.",
    priority: "Low",
    status: "done",
  },
];

const emptyFormState: TaskFormState = {
  title: "",
  description: "",
  priority: "Medium",
};

const taskListeners = new Set<() => void>();

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "Low" || value === "Medium" || value === "High";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in-progress" || value === "done";
}

function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    isTaskPriority(candidate.priority) &&
    isTaskStatus(candidate.status)
  );
}

function readStoredTasks(): Task[] {
  if (typeof window === "undefined") {
    return seededTasks;
  }

  try {
    const rawTasks = localStorage.getItem(STORAGE_KEY);
    if (!rawTasks) {
      return seededTasks;
    }

    const parsedTasks: unknown = JSON.parse(rawTasks);
    return Array.isArray(parsedTasks) && parsedTasks.every(isTask)
      ? parsedTasks
      : seededTasks;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return seededTasks;
  }
}

function subscribeToTasks(onStoreChange: () => void) {
  taskListeners.add(onStoreChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    taskListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function writeTasks(nextTasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));

  taskListeners.forEach((listener) => {
    listener();
  });
}

export default function KanbanBoard() {
  const [formState, setFormState] = useState<TaskFormState>(emptyFormState);
  const tasks = useSyncExternalStore(
    subscribeToTasks,
    readStoredTasks,
    () => seededTasks,
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const tasksByColumn = columns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.status),
  }));

  const createTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = formState.title.trim();
    const description = formState.description.trim();

    if (!title || !description) {
      return;
    }

    const nextTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority: formState.priority,
      status: "todo",
    };

    writeTasks([nextTask, ...tasks]);
    setFormState(emptyFormState);
  };

  const moveTask = (taskId: string, direction: -1 | 1) => {
    writeTasks(
      tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const currentColumnIndex = columns.findIndex(
          (column) => column.status === task.status,
        );
        const nextColumn = columns[currentColumnIndex + direction];

        return nextColumn ? { ...task, status: nextColumn.status } : task;
      }),
    );
  };

  const deleteTask = (taskId: string) => {
    writeTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-50 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                my-task-hermes-app
              </div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Keep the board light, clear, and moving.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                A local-first kanban board for planning work, tracking momentum,
                and closing tasks without backend overhead.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
              <StatCard
                label="Total tasks"
                value={String(totalTasks)}
                note="Across all columns"
              />
              <StatCard
                label="Completed"
                value={String(completedTasks)}
                note="Tasks in Done"
              />
              <StatCard
                label="Storage"
                value="Synced"
                note="Saved in this browser"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="glass-panel rounded-[2rem] border border-white/60 p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                New task
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Add work to the queue
              </h2>
            </div>

            <form className="space-y-4" onSubmit={createTask}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </span>
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Prepare stakeholder update"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  maxLength={80}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Summarize what needs to happen next."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  maxLength={220}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Priority
                </span>
                <select
                  value={formState.priority}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
              >
                Add task to Todo
              </button>
            </form>
          </aside>

          <section className="grid gap-4 lg:grid-cols-3">
            {tasksByColumn.map((column) => (
              <section
                key={column.status}
                className="glass-panel rounded-[2rem] border border-white/60 p-4 sm:p-5"
              >
                <header className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${column.accent}`} />
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        {column.label}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {column.tasks.length} task
                        {column.tasks.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </header>

                <div className="space-y-3">
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => {
                      const columnIndex = columns.findIndex(
                        (item) => item.status === column.status,
                      );
                      const canMoveLeft = columnIndex > 0;
                      const canMoveRight = columnIndex < columns.length - 1;

                      return (
                        <article
                          key={task.id}
                          className="board-card rounded-[1.5rem] border border-slate-200/80 p-4 transition hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}
                              >
                                {task.priority} priority
                              </span>
                              <h3 className="mt-3 text-base font-semibold text-slate-950">
                                {task.title}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Delete ${task.title}`}
                            >
                              Delete
                            </button>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {task.description}
                          </p>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveTask(task.id, -1)}
                              disabled={!canMoveLeft}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(task.id, 1)}
                              disabled={!canMoveRight}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Next →
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center text-sm leading-6 text-slate-500">
                      No tasks here yet. Move work in or create a new task.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}
