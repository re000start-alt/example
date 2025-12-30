import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { Project, Task } from "../types/task";
import { showToast } from "../utils/toast";

interface TaskContextValue {
  tasks: Task[];
  projects: Project[];
  session: Session | null;
  loading: boolean;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        refreshData();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        refreshData();
      } else {
        setTasks([]);
        setProjects([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      const mappedTasks: Task[] = (tasksData || []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        project: task.project_id || "",
        dueDate: task.due_date ?? undefined,
        reminder: task.reminder ?? undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));

      const mappedProjects: Project[] = (projectsData || []).map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        taskCount: project.task_count || 0,
      }));

      setTasks(mappedTasks);
      setProjects(mappedProjects);
    } catch (error: any) {
      showToast(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addTask: TaskContextValue["addTask"] = async (task) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      project: task.project,
      dueDate: task.dueDate,
      reminder: task.reminder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            user_id: session?.user?.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            project_id: task.project || null,
            due_date: task.dueDate ?? null,
            reminder: task.reminder ?? null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const mappedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        status: data.status,
        priority: data.priority,
        project: data.project_id || "",
        dueDate: data.due_date ?? undefined,
        reminder: data.reminder ?? undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setTasks((prev) => prev.map((item) => (item.id === tempId ? mappedTask : item)));
      showToast("Task created");
    } catch (error: any) {
      setTasks((prev) => prev.filter((item) => item.id !== tempId));
      showToast(error.message || "Failed to create task");
    }
  };

  const updateTask: TaskContextValue["updateTask"] = async (id, updates) => {
    const previous = [...tasks];
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          project_id: updates.project || null,
          due_date: updates.dueDate ?? null,
          reminder: updates.reminder ?? null,
        })
        .eq("id", id);

      if (error) throw error;
      showToast("Task updated");
    } catch (error: any) {
      setTasks(previous);
      showToast(error.message || "Failed to update task");
    }
  };

  const deleteTask: TaskContextValue["deleteTask"] = async (id) => {
    const previous = [...tasks];
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      showToast("Task deleted");
    } catch (error: any) {
      setTasks(previous);
      showToast(error.message || "Failed to delete task");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      tasks,
      projects,
      session,
      loading,
      addTask,
      updateTask,
      deleteTask,
      refreshData,
      signOut,
    }),
    [tasks, projects, session, loading]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within TaskProvider");
  }
  return context;
};
