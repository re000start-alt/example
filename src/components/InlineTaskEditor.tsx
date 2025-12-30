import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useState, useRef, useEffect } from "react";
import { useTasks } from "@/contexts/SupabaseTaskContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Bell, Save, X, Paperclip, Loader2, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./RichTextEditor";
import { uploadFileToStorage } from "@/lib/uploadToStorage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  saveAttachmentToDatabase, 
  deleteAttachmentFromDatabase, 
  deleteAttachmentFromStorage,
  previewAttachment 
} from "@/lib/attachmentUtils";

interface InlineTaskEditorProps {
  task: Task;
  field: "description" | "status" | "priority" | "dueDate" | "reminder";
  onClose: () => void;
}

export const InlineTaskEditor = ({ task, field, onClose }: InlineTaskEditorProps) => {
  const { updateTask, projects } = useTasks();
  
  // Initialize value based on field type
  const getInitialValue = () => {
    if (field === "reminder" && task.reminder) {
      const reminderDate = new Date(task.reminder);
      const hours = String(reminderDate.getHours()).padStart(2, '0');
      const minutes = String(reminderDate.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return (task[field] as string) || "";
  };
  
  const [value, setValue] = useState<string>(getInitialValue());
  const [date, setDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    if (field === "dueDate") {
      updateTask(task.id, { dueDate: date ? format(date, "yyyy-MM-dd") : "" });
    } else if (field === "description") {
      updateTask(task.id, { description: value, attachments });
    } else if (field === "reminder") {
      // Convert time to full timestamp
      if (value && task.dueDate) {
        const [hours, minutes] = value.split(':');
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        updateTask(task.id, { reminder: dueDate.toISOString() });
      } else {
        updateTask(task.id, { reminder: null });
      }
    } else {
      updateTask(task.id, { [field]: value });
    }
    onClose();
  };

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
      
      // Check for duplicates based on URL
      const existingUrls = new Set(attachments.map(att => att.url));
      const uniqueNewAttachments = newAttachments.filter(att => !existingUrls.has(att.url));
      
      // Save to database
      for (const attachment of uniqueNewAttachments) {
        await saveAttachmentToDatabase(task.id, attachment, user.id);
      }
      
      setAttachments([...attachments, ...uniqueNewAttachments]);
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

  const handleDeleteAttachment = async (attachmentId: string, url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/task-attachments/');
      const filePath = urlParts[1];

      // Delete from database
      await deleteAttachmentFromDatabase(attachmentId);
      
      // Delete from storage
      if (filePath) {
        await deleteAttachmentFromStorage(filePath);
      }

      // Update local state
      const newAttachments = attachments.filter(a => a.id !== attachmentId);
      setAttachments(newAttachments);
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete attachment");
    }
  };


  if (field === "status") {
    return (
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={(val) => { setValue(val); updateTask(task.id, { status: val as TaskStatus }); onClose(); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="inprogress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field === "priority") {
    return (
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={(val) => { setValue(val); updateTask(task.id, { priority: val as TaskPriority }); onClose(); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field === "dueDate") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); updateTask(task.id, { dueDate: d ? format(d, "yyyy-MM-dd") : "" }); onClose(); }} initialFocus />
        </PopoverContent>
      </Popover>
    );
  }

  if (field === "reminder") {
    const handleClearReminder = () => {
      updateTask(task.id, { reminder: null });
      onClose();
    };

    return (
      <div className="flex items-center gap-2">
        <Input
          type="time"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-[180px]"
          autoFocus
        />
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleClearReminder} title="Clear reminder">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }


  if (field === "description") {
    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Attach"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-secondary rounded-lg min-h-[300px] p-4">
          <RichTextEditor
            value={value}
            onChange={setValue}
            placeholder="Edit description... Drag & drop images or paste content."
            className="min-h-[250px]"
            showPrintButton={false}
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg group relative">
                {att.type.startsWith("image/") ? (
                  <img src={att.url} alt={att.name} className="h-8 w-8 object-cover rounded" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                <span className="text-sm truncate max-w-[150px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => previewAttachment(att.url, att.name)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(att.id, att.url)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};
