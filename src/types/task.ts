export type TaskStatus = "todo" | "inprogress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";
export type ViewMode = "list" | "project" | "calendar";

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  dueDate?: string;
  reminder?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}
