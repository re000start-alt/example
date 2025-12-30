import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatusFilters, FilterType } from "@/components/StatusFilters";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { TaskItem } from "@/components/TaskItem";
import { TaskDialog } from "@/components/TaskDialog";
import { AIAssistant } from "@/components/AIAssistant";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { CalendarView } from "@/components/CalendarView";
import { ProjectView } from "@/components/ProjectView";
import { MobileNavbar } from "@/components/MobileNavbar";
import { useTasks } from "@/contexts/SupabaseTaskContext";
import { Task, TaskStatus, ViewMode } from "@/types/task";
import { isToday, isFuture, parseISO } from "date-fns";
import { useReminder } from "@/hooks/useReminder";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile, useIsMobileOrTablet } from "@/hooks/use-mobile";
import { ChevronDown, Circle, Clock, CheckCircle2, XCircle, Calendar, CalendarClock, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "../styles/index.css";

const MainContent = () => {
  const navigate = useNavigate();
  const { tasks, projects, updateTask, session } = useTasks();
  const { stopSound, activeReminders } = useReminder(tasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();

  useEffect(() => {
    // Check auth and redirect if not authenticated
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const filterTasks = (tasks: Task[]) => {
    let filtered = tasks;

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (activeFilter) {
      case "todo":
        filtered = filtered.filter((task) => task.status === "todo");
        break;
      case "inprogress":
        filtered = filtered.filter((task) => task.status === "inprogress");
        break;
      case "completed":
        filtered = filtered.filter((task) => task.status === "completed");
        break;
      case "cancelled":
        filtered = filtered.filter((task) => task.status === "cancelled");
        break;
      case "today":
        filtered = filtered.filter(
          (task) => task.dueDate && isToday(parseISO(task.dueDate))
        );
        break;
      case "upcoming":
        filtered = filtered.filter(
          (task) => task.dueDate && isFuture(parseISO(task.dueDate))
        );
        break;
    }

    return filtered;
  };

  const filteredTasks = filterTasks(tasks);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setTaskDialogOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTask(taskId, { status: newStatus });
    }
  };

  return (
    <div className={`index-container ${isMobile ? 'has-mobile-navbar' : ''}`}>
      {!isMobile && (
        <Header
          onOpenNewTask={handleNewTask}
          onOpenNewProject={() => setProjectDialogOpen(true)}
          onOpenAI={() => setAiDialogOpen(true)}
          onOpenProfile={() => setProfileDialogOpen(true)}
          onOpenAuth={() => setAuthDialogOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isAuthenticated={!!session}
        />
      )}

      {!isMobile && <StatusFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />}

      <main className="index-main">
        <div className={`index-header ${isMobileOrTablet ? 'mobile' : ''}`}>
          {isMobileOrTablet ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="index-title-dropdown">
                    {activeFilter === "all" ? (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    ) : activeFilter === "todo" ? (
                      <Circle className="h-4 w-4 text-status-todo" />
                    ) : activeFilter === "inprogress" ? (
                      <Clock className="h-4 w-4 text-status-inprogress" />
                    ) : activeFilter === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-status-completed" />
                    ) : activeFilter === "cancelled" ? (
                      <XCircle className="h-4 w-4 text-status-cancelled" />
                    ) : activeFilter === "today" ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <CalendarClock className="h-4 w-4" />
                    )}
                    <span className="index-title-text">
                      {activeFilter === "all"
                        ? "All Tasks"
                        : activeFilter === "inprogress"
                        ? "In Progress"
                        : activeFilter === "todo"
                        ? "To Do"
                        : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[180px]">
                  <DropdownMenuItem onClick={() => setActiveFilter("all")} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span>All Tasks</span>
                    {activeFilter === "all" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("todo")} className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-status-todo" />
                    <span>To Do</span>
                    {activeFilter === "todo" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("inprogress")} className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-status-inprogress" />
                    <span>In Progress</span>
                    {activeFilter === "inprogress" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("completed")} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-status-completed" />
                    <span>Completed</span>
                    {activeFilter === "completed" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("cancelled")} className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-status-cancelled" />
                    <span>Cancelled</span>
                    {activeFilter === "cancelled" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("today")} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Today</span>
                    {activeFilter === "today" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("upcoming")} className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    <span>Upcoming</span>
                    {activeFilter === "upcoming" && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />
            </>
          ) : (
            <>
              <h2 className="index-title-desktop">
                {activeFilter === "all"
                  ? "All Tasks"
                  : activeFilter === "inprogress"
                  ? "In Progress"
                  : activeFilter === "todo"
                  ? "To Do"
                  : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
              </h2>
              <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />
            </>
          )}
        </div>

        {activeView === "list" && (
          <div 
            className="index-tasks-list"
            onDragOver={handleDragOver}
            onDrop={(e) => {
              const statusMap: Record<string, TaskStatus> = {
                "todo": "todo",
                "inprogress": "inprogress",
                "completed": "completed",
                "cancelled": "cancelled"
              };
              if (activeFilter in statusMap) {
                handleDrop(e, statusMap[activeFilter]);
              }
            }}
          >
            {filteredTasks.length === 0 ? (
              <div className="index-empty">
                <p className="index-empty-text">
                  No tasks found. Create one to get started!
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem key={task.id} task={task} onEdit={handleEditTask} isReminderActive={activeReminders.has(task.id)} onStopReminder={stopSound} />
              ))
            )}
          </div>
        )}

        {activeView === "project" && (
          <ProjectView 
            projects={projects}
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            activeReminders={activeReminders}
            onStopReminder={stopSound}
          />
        )}

        {activeView === "calendar" && (
          <CalendarView 
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            activeReminders={activeReminders}
            onStopReminder={stopSound}
          />
        )}
      </main>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
      />
      <ProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} />
      <AIAssistant 
        open={aiDialogOpen} 
        onOpenChange={setAiDialogOpen}
        selectedDate={activeView === "calendar" ? selectedCalendarDate : null}
      />
      <ProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
        onLogout={() => {
          supabase.auth.signOut();
          navigate("/auth");
        }}
        onViewChange={(view) => {
          setActiveView(view as ViewMode);
          if (view === "list") {
            setActiveFilter("completed");
          }
        }}
      />
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onLogin={() => {}}
      />

      {isMobile && (
        <MobileNavbar
          onOpenNewTask={handleNewTask}
          onOpenNewProject={() => setProjectDialogOpen(true)}
          onOpenAI={() => setAiDialogOpen(true)}
          onOpenProfile={() => setProfileDialogOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}
    </div>
  );
};

const Index = () => {
  return <MainContent />;
};

export default Index;
