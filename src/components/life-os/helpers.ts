import type { ClientRecord, Task, TaskStatus } from "@/lib/lifeOsDb";

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ensureTaskMetadata(tasks: Task[]) {
  return tasks.map((task) => ({ ...task, tags: task.tags ?? [] }));
}

export function taskStatusLabel(status: TaskStatus) {
  if (status === "todo") return "Start";
  if (status === "in-progress") return "Mark done";
  return "Reopen";
}

export function taskBelongsToClient(task: Task, client: ClientRecord) {
  if (task.clientId && task.clientId === client.id) return true;
  const clientKey = client.name.toLowerCase();
  const tags = (task.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => clientKey.includes(tag) || tag.includes(clientKey))) return true;
  return `${task.title} ${task.description}`.toLowerCase().includes(clientKey);
}

export function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function toggleTag(tags: string[], tag: string) {
  const normalized = normalizeTag(tag);
  return tags.includes(normalized) ? tags.filter((item) => item !== normalized) : [...tags, normalized];
}
