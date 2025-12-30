export type TaskStatus = "todo" | "inprogress" | "completed" | "cancelled";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string;
  project?: string;
};

export const sampleTasks: Task[] = [
  {
    id: "task-1",
    title: "Finalize sprint roadmap",
    description: "Align priorities with the product and design teams.",
    status: "inprogress",
    dueDate: "2024-08-15",
    project: "Product"
  },
  {
    id: "task-2",
    title: "QA mobile release",
    description: "Regression test the mobile build before store submission.",
    status: "todo",
    dueDate: "2024-08-12",
    project: "Mobile"
  },
  {
    id: "task-3",
    title: "Post-release analysis",
    description: "Review usage metrics after launch.",
    status: "completed",
    dueDate: "2024-08-02",
    project: "Analytics"
  },
  {
    id: "task-4",
    title: "Archive cancelled initiative",
    description: "Close out documentation and inform stakeholders.",
    status: "cancelled",
    dueDate: "2024-08-05",
    project: "Operations"
  }
];
