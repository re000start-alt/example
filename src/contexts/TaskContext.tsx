import React, { createContext, useContext, useState, useEffect } from "react";
import { Task, Project } from "@/types/task";

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (name: string, color: string) => void;
  deleteProject: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("projects");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "work", name: "Work", color: "#4A90FF", taskCount: 0 },
          { id: "personal", name: "Personal", color: "#FF6B6B", taskCount: 0 },
        ];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    // Update project task counts
    const updatedProjects = projects.map((project) => ({
      ...project,
      taskCount: tasks.filter((task) => task.project === project.id).length,
    }));
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
  }, [tasks]);

  const addTask = (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const addProject = (name: string, color: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      color,
      taskCount: 0,
    };
    setProjects([...projects, newProject]);
  };

  const deleteProject = (id: string) => {
    if (id === "work" || id === "personal") return; // Prevent deleting default projects
    setProjects(projects.filter((project) => project.id !== id));
    // Move tasks to Personal project
    setTasks(
      tasks.map((task) => (task.project === id ? { ...task, project: "personal" } : task))
    );
  };

  return (
    <TaskContext.Provider
      value={{ tasks, projects, addTask, updateTask, deleteTask, addProject, deleteProject }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within TaskProvider");
  }
  return context;
};
