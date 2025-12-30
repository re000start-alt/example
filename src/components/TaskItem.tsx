import { Task, TaskStatus } from "@/types/task";
import { Calendar, Bell, MoreVertical, Circle, CheckCircle2, Clock, XCircle, ChevronRight, ChevronDown, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTasks } from "@/contexts/SupabaseTaskContext";
import { useState } from "react";
import { InlineTaskEditor } from "./InlineTaskEditor";
import "../styles/task-item.css";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  isReminderActive?: boolean;
  onStopReminder?: () => void;
}

export const TaskItem = ({ task, onEdit, isReminderActive = false, onStopReminder }: TaskItemProps) => {
  const { updateTask, deleteTask } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editingField, setEditingField] = useState<"status" | "priority" | "dueDate" | "reminder" | null>(null);
  const isMobile = useIsMobile();

  const statusIcons = {
    todo: Circle,
    inprogress: Clock,
    completed: CheckCircle2,
    cancelled: XCircle,
  };

  const statusColors = {
    todo: "text-status-todo",
    inprogress: "text-status-inprogress",
    completed: "text-status-completed",
    cancelled: "text-status-cancelled",
  };

  const priorityColors = {
    low: "bg-priority-low/10 text-priority-low border-priority-low/20",
    medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
    high: "bg-priority-high/10 text-priority-high border-priority-high/20",
  };

  const StatusIcon = statusIcons[task.status];

  const cycleStatus = () => {
    const statuses: TaskStatus[] = ["todo", "inprogress", "completed", "cancelled"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateTask(task.id, { status: nextStatus });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
    setEditedTitle(task.title);
  };

  const handleTitleBlur = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateTask(task.id, { title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  return (
    <div 
      className="task-item"
      draggable
      onDragStart={handleDragStart}
    >
      {task.description && !isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="task-expand-btn"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`task-status-btn ${statusColors[task.status]}`}>
            <StatusIcon className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover z-50">
          <DropdownMenuItem onClick={() => updateTask(task.id, { status: "todo" })}>
            <Circle className="h-4 w-4 mr-2 text-status-todo" />
            To Do
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateTask(task.id, { status: "inprogress" })}>
            <Clock className="h-4 w-4 mr-2 text-status-inprogress" />
            In Progress
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateTask(task.id, { status: "completed" })}>
            <CheckCircle2 className="h-4 w-4 mr-2 text-status-completed" />
            Completed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateTask(task.id, { status: "cancelled" })}>
            <XCircle className="h-4 w-4 mr-2 text-status-cancelled" />
            Cancelled
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="task-content">
        <div className="task-title-container">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleBlur();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              className="task-title-input"
              autoFocus
            />
          ) : (
            <h3
              className={`task-title ${task.status === "completed" ? "completed" : ""}`}
              onDoubleClick={handleTitleDoubleClick}
            >
              {task.title}
            </h3>
          )}
        </div>

        {task.description && isExpanded && (
          <div className="task-description">
            <div dangerouslySetInnerHTML={{ __html: task.description }} />
          </div>
        )}

        {task.attachments && task.attachments.length > 0 && isExpanded && (
          <div className="task-attachments">
            {task.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="task-attachment"
              >
                {att.type.startsWith("image/") ? (
                  <>
                    <ImageIcon className="task-attachment-icon" />
                    <img src={att.url} alt={att.name} className="task-attachment-preview" />
                  </>
                ) : att.type === "application/pdf" ? (
                  <>
                    <FileText className="task-attachment-icon" />
                    <span className="task-attachment-name">{att.name}</span>
                  </>
                ) : att.url.includes("youtube.com") || att.url.includes("youtube") ? (
                  <>
                    <Paperclip className="task-attachment-icon" />
                    <span className="task-attachment-name">YouTube Video</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="task-attachment-icon" />
                    <span className="task-attachment-name">{att.name}</span>
                  </>
                )}
              </a>
            ))}
          </div>
        )}

        <div className="task-metadata">
          {editingField === "priority" ? (
            <InlineTaskEditor task={task} field="priority" onClose={() => setEditingField(null)} />
          ) : (
            <span
              className={`task-badge priority-${task.priority}`}
              onClick={() => setEditingField("priority")}
            >
              {task.priority}
            </span>
          )}

          {editingField === "dueDate" ? (
            <InlineTaskEditor task={task} field="dueDate" onClose={() => setEditingField(null)} />
          ) : task.dueDate ? (
            <div
              className="task-date"
              onClick={() => setEditingField("dueDate")}
            >
              <Calendar className="task-date-icon" />
              {format(new Date(task.dueDate), "MMM dd")}
            </div>
          ) : (
            <button
              className="task-add-btn"
              onClick={() => setEditingField("dueDate")}
            >
              <Calendar className="task-date-icon" />
              Add date
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onStopReminder) {
                onStopReminder();
              }
            }}
            title="Stop reminder sound"
            className={`task-date-icon-button ${isReminderActive ? "active" : ""}`}
          >
            <Bell className="task-date-icon" />
          </button>

          {editingField === "reminder" ? (
            <InlineTaskEditor task={task} field="reminder" onClose={() => setEditingField(null)} />
          ) : task.reminder ? (
            <div
              className={`task-date ${isReminderActive ? "text-destructive animate-pulse" : ""}`}
              onClick={() => setEditingField("reminder")}
            >
              {(() => {
                try {
                  const date = new Date(task.reminder);
                  if (!isNaN(date.getTime())) {
                    return format(date, "hh:mm a");
                  }
                  return task.reminder;
                } catch {
                  return task.reminder;
                }
              })()}
            </div>
          ) : (
            <button
              className="task-add-btn"
              onClick={() => setEditingField("reminder")}
            >
              Add reminder
            </button>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="task-date">
              <Paperclip className="task-date-icon" />
              {task.attachments.length}
            </div>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="task-more-btn">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => deleteTask(task.id)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
