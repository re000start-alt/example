import { Project, Task } from "@/types/task";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { TaskItem } from "./TaskItem";
import { useTasks } from "@/contexts/SupabaseTaskContext";
import { toast } from "sonner";
import "../styles/project-view.css";

interface ProjectViewProps {
  projects: Project[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  activeReminders: Set<string>;
  onStopReminder?: () => void;
}

export const ProjectView = ({ projects, tasks, onEditTask, activeReminders, onStopReminder }: ProjectViewProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { deleteProject } = useTasks();

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project === projectId);
  };

  // Default projects that cannot be deleted
  const defaultProjectNames = ['personal', 'work'];
  
  const isDefaultProject = (projectName: string) => {
    return defaultProjectNames.includes(projectName.toLowerCase());
  };

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    
    if (isDefaultProject(project.name)) {
      toast.error("Default projects cannot be deleted");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this project? All tasks will remain but will be unassigned.")) {
      try {
        await deleteProject(project.id);
        toast.success("Project deleted successfully");
      } catch (error) {
        toast.error("Failed to delete project");
        console.error(error);
      }
    }
  };

  return (
    <div className="project-view-container">
      {projects.length === 0 ? (
        <div className="project-empty">
          <p>No projects yet. Create one to organize your tasks!</p>
        </div>
      ) : (
        projects.map((project) => {
        const isExpanded = expandedProjects.has(project.id);
        const projectTasks = getProjectTasks(project.id);

        return (
          <div key={project.id} className="project-card">
            <div className="project-header-wrapper">
              <button
                onClick={() => toggleProject(project.id)}
                className="project-header"
              >
                {isExpanded ? (
                  <ChevronDown className="project-chevron" />
                ) : (
                  <ChevronRight className="project-chevron" />
                )}
                <div
                  className="project-color"
                  style={{ backgroundColor: project.color }}
                />
                <span className="project-name">{project.name}</span>
                <span className="project-count">
                  ({projectTasks.length} {projectTasks.length === 1 ? "task" : "tasks"})
                </span>
              </button>
              {!isDefaultProject(project.name) && (
                <button
                  onClick={(e) => handleDeleteProject(e, project)}
                  className="project-delete-btn"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="project-tasks">
                {projectTasks.length > 0 ? (
                  projectTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onEdit={onEditTask} isReminderActive={activeReminders.has(task.id)} onStopReminder={onStopReminder} />
                  ))
                ) : (
                  <p className="project-empty">
                    No tasks in this project
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }))}
    </div>
  );
};
