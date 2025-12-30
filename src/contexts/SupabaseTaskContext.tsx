import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task, Project } from "@/types/task";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  session: Session | null;
  loading: boolean;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addProject: (name: string, color: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        refreshData();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
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
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch all attachments for tasks
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("attachments")
        .select("*")
        .order("created_at", { ascending: true });

      if (attachmentsError) throw attachmentsError;

      // Group attachments by task_id
      const attachmentsByTaskId = (attachmentsData || []).reduce((acc, att) => {
        if (!acc[att.task_id]) {
          acc[att.task_id] = [];
        }
        acc[att.task_id].push({
          id: att.id,
          name: att.name,
          type: att.type,
          url: att.url,
          size: att.size,
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Map database fields to Task type
      const mappedTasks: Task[] = (tasksData || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        status: t.status as any,
        priority: t.priority as any,
        project: t.project_id || "",
        dueDate: t.due_date,
        reminder: t.reminder,
        attachments: attachmentsByTaskId[t.id] || [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      // Map database fields to Project type
      const mappedProjects: Project[] = (projectsData || []).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        taskCount: p.task_count || 0,
      }));

      setTasks(mappedTasks);
      setProjects(mappedProjects);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    // Create optimistic task with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      project: task.project || "",
      dueDate: task.dueDate,
      reminder: task.reminder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to local state immediately
    setTasks([optimisticTask, ...tasks]);
    toast.success("Task created!");

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
            project_id: task.project,
            due_date: task.dueDate,
            reminder: task.reminder,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic task with real one from server
      const mappedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        status: data.status as any,
        priority: data.priority as any,
        project: data.project_id || "",
        dueDate: data.due_date,
        reminder: data.reminder,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setTasks(prevTasks => prevTasks.map(t => t.id === tempId ? mappedTask : t));
    } catch (error: any) {
      // Remove optimistic task on error
      setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
      toast.error(error.message || "Failed to create task");
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Save previous state for rollback
    const previousTasks = [...tasks];
    
    // Update local state immediately
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    toast.success("Task updated!");

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          project_id: updates.project,
          due_date: updates.dueDate,
          reminder: updates.reminder,
        })
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      // Rollback on error
      setTasks(previousTasks);
      toast.error(error.message || "Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    // Save previous state for rollback
    const previousTasks = [...tasks];
    
    // Update local state immediately
    setTasks(tasks.filter((t) => t.id !== id));
    toast.success("Task deleted!");

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      // Rollback on error
      setTasks(previousTasks);
      toast.error(error.message || "Failed to delete task");
    }
  };

  const addProject = async (name: string, color: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            user_id: session?.user?.id,
            name,
            color,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const mappedProject: Project = {
        id: data.id,
        name: data.name,
        color: data.color,
        taskCount: 0,
      };
      setProjects([...projects, mappedProject]);
      toast.success("Project created!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        session,
        loading,
        addTask,
        updateTask,
        deleteTask,
        addProject,
        deleteProject,
        refreshData,
      }}
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