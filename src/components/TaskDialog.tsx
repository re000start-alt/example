import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useState, useEffect, useRef } from "react";
import { useTasks } from "@/contexts/SupabaseTaskContext";
import { Paperclip, X, Loader2, Circle, Calendar as CalendarIcon, Flag, Bell, FolderOpen } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { uploadFileToStorage } from "@/lib/uploadToStorage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "../styles/task-dialog.css";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

export const TaskDialog = ({ open, onOpenChange, task }: TaskDialogProps) => {
  const { addTask, updateTask, projects } = useTasks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    project: "work",
    dueDate: "",
    reminder: "",
    attachments: [] as { id: string; name: string; type: string; url: string; size: number }[],
  });

  useEffect(() => {
    if (task) {
      let dateOnly = "";
      if (task.dueDate) {
        dateOnly = task.dueDate.split('T')[0];
      }
      
      let timeOnly = "";
      if (task.reminder) {
        const reminderDate = new Date(task.reminder);
        const hours = String(reminderDate.getHours()).padStart(2, '0');
        const minutes = String(reminderDate.getMinutes()).padStart(2, '0');
        timeOnly = `${hours}:${minutes}`;
      }
      
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        project: task.project,
        dueDate: dateOnly,
        reminder: timeOnly,
        attachments: task.attachments || [],
      });
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayString = `${yyyy}-${mm}-${dd}`;
      
      // Find Personal project or use first project
      const personalProject = projects.find(p => p.name.toLowerCase() === 'personal');
      const defaultProject = personalProject?.id || projects[0]?.id || "";
      
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        project: defaultProject,
        dueDate: todayString,
        reminder: "",
        attachments: [],
      });
    }
  }, [task, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload files");
        return;
      }

      const uploadPromises = Array.from(files).map(file => 
        uploadFileToStorage(file, user.id)
      );
      
      const newAttachments = await Promise.all(uploadPromises);
      
      const existingUrls = new Set(formData.attachments.map(att => att.url));
      const uniqueNewAttachments = newAttachments.filter(att => !existingUrls.has(att.url));
      
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...uniqueNewAttachments],
      });
      toast.success(`${uniqueNewAttachments.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((att) => att.id !== id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let reminderTimestamp = null;
    if (formData.reminder && formData.dueDate) {
      const [hours, minutes] = formData.reminder.split(':');
      const dueDate = new Date(formData.dueDate + 'T00:00:00');
      dueDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      reminderTimestamp = dueDate.toISOString();
    }
    
    let dueDateTimestamp = null;
    if (formData.dueDate) {
      dueDateTimestamp = new Date(formData.dueDate + 'T00:00:00').toISOString();
    }
    
    const taskData = {
      ...formData,
      dueDate: dueDateTimestamp,
      reminder: reminderTimestamp,
    };
    
    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }
    onOpenChange(false);
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "todo": return "TO DO";
      case "inprogress": return "IN PROGRESS";
      case "completed": return "COMPLETED";
      case "cancelled": return "CANCELLED";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case "low": return "Low";
      case "medium": return "Medium";
      case "high": return "High";
      default: return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto bg-card mx-4">
        <form onSubmit={handleSubmit} className="task-dialog-form">
          {/* Title - Large editable at top */}
          <div className="task-dialog-title-container">
            <span className="task-dialog-title-icon">↳</span>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title..."
              required
              className="task-dialog-title-input"
            />
          </div>

          {/* Properties rows */}
          <div className="task-dialog-properties">
            {/* Status row */}
            <div className="task-dialog-property-row">
              <div className="task-dialog-property-label">
                <Circle className="h-4 w-4" />
                <span>Status</span>
              </div>
              <div className="task-dialog-property-value">
                <Select
                  value={formData.status}
                  onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className={`task-dialog-status-trigger status-${formData.status}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="todo">TO DO</SelectItem>
                    <SelectItem value="inprogress">IN PROGRESS</SelectItem>
                    <SelectItem value="completed">COMPLETED</SelectItem>
                    <SelectItem value="cancelled">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due date row */}
            <div className="task-dialog-property-row">
              <div className="task-dialog-property-label">
                <CalendarIcon className="h-4 w-4" />
                <span>Due date</span>
              </div>
              <div className="task-dialog-property-value task-dialog-date-value">
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="task-dialog-date-input"
                />
                <button
                  type="button"
                  className="task-dialog-date-shortcut"
                  onClick={() => {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    setFormData({ ...formData, dueDate: `${yyyy}-${mm}-${dd}` });
                  }}
                >
                  <CalendarIcon className="h-3 w-3" /> Today
                </button>
              </div>
            </div>

            {/* Priority row */}
            <div className="task-dialog-property-row">
              <div className="task-dialog-property-label">
                <Flag className="h-4 w-4" />
                <span>Priority</span>
              </div>
              <div className="task-dialog-property-value">
                <Select
                  value={formData.priority}
                  onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="task-dialog-select-trigger">
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reminder row */}
            <div className="task-dialog-property-row">
              <div className="task-dialog-property-label">
                <Bell className="h-4 w-4" />
                <span>Reminder</span>
              </div>
              <div className="task-dialog-property-value">
                {formData.reminder ? (
                  <div className="task-dialog-reminder-value">
                    <Input
                      type="time"
                      value={formData.reminder}
                      onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                      className="task-dialog-time-input"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, reminder: "" })}
                      className="task-dialog-clear-btn"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Input
                    type="time"
                    value={formData.reminder}
                    onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                    className="task-dialog-time-input"
                    placeholder="Empty"
                  />
                )}
              </div>
            </div>

            {/* Project row */}
            <div className="task-dialog-property-row">
              <div className="task-dialog-property-label">
                <FolderOpen className="h-4 w-4" />
                <span>Project</span>
              </div>
              <div className="task-dialog-property-value">
                <Select
                  value={formData.project}
                  onValueChange={(value) => setFormData({ ...formData, project: value })}
                >
                  <SelectTrigger className="task-dialog-select-trigger">
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description with rich text editor */}
          <div className="task-dialog-description">
            <div className="task-dialog-editor-container">
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Add a detailed description..."
                className="min-h-[200px]"
                showPrintButton={false}
              />
            </div>
            <div className="task-dialog-attachment-row">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="task-dialog-attach-btn"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                <span>Attach file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Attachments */}
          {formData.attachments.length > 0 && (
            <div className="task-dialog-attachments">
              {formData.attachments.map((att) => (
                <div key={att.id} className="task-dialog-attachment">
                  {att.type.startsWith("image/") ? (
                    <img src={att.url} alt={att.name} className="task-dialog-attachment-preview" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  <span className="task-dialog-attachment-name">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="task-dialog-attachment-remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="task-dialog-footer">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {task ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
