import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Send, Mic, MicOff, Bot, User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTasks } from "@/contexts/SupabaseTaskContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import "../styles/ai-assistant.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  data?: any;
  confirmationNeeded?: boolean;
}

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
}

export const AIAssistant = ({ open, onOpenChange, selectedDate }: AIAssistantProps) => {
  const { addTask, addProject, projects } = useTasks();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Jan, your AI assistant. 👋 I can help you manage your tasks, create new ones, set reminders, and more. You can type or use the mic button to talk to me. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: string; data: any } | null>(null);
  const [pendingTaskData, setPendingTaskData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, transcript, isSupported, toggleListening, stopListening } = useSpeechRecognition({
    onResult: (finalTranscript) => {
      setInput(finalTranscript);
    },
    onError: (error) => {
      toast.error(`Voice input error: ${error}`);
    },
  });

  // Update input field with interim transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: userMessage,
          conversationHistory,
          availableProjects: projects.map(p => ({ id: p.id, name: p.name })),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.data?.message || formatActionResponse(data),
        action: data.action,
        data: data.data,
        confirmationNeeded: data.confirmationNeeded,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Handle actions
      if (data.action === "create_task" && data.confirmationNeeded) {
        setPendingAction({ action: data.action, data: data.data });
      } else if (data.action === "create_task" && !data.confirmationNeeded) {
        await executeTaskCreation(data.data);
      } else if (data.action === "ask_project") {
        // Store the pending task data for later
        setPendingTaskData(data.data.pendingTask);
      } else if (data.action === "create_project" && data.confirmationNeeded) {
        setPendingAction({ action: data.action, data: data.data });
      } else if (data.action === "create_project" && !data.confirmationNeeded) {
        await executeProjectCreation(data.data);
      }
    } catch (error) {
      console.error("AI assistant error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatActionResponse = (data: any): string => {
    if (data.action === "create_task") {
      const task = data.data;
      let response = data.confirmationMessage || `I'll create a task for you:\n\n`;
      response += `📝 **Title:** ${task.title}\n`;
      if (task.description) response += `📄 **Description:** ${task.description}\n`;
      response += `🎯 **Priority:** ${task.priority || "medium"}\n`;
      response += `📊 **Status:** ${task.status || "todo"}\n`;
      if (task.dueDate) response += `📅 **Due Date:** ${task.dueDate}\n`;
      if (task.reminder) response += `⏰ **Reminder:** ${task.reminder}\n`;
      if (task.projectId) {
        const project = projects.find(p => p.id === task.projectId);
        response += `📁 **Project:** ${project?.name || 'Unknown'}\n`;
      } else {
        response += `📁 **Project:** Personal\n`;
      }
      if (data.confirmationNeeded) {
        response += `\nWould you like me to create this task? (Yes/No)`;
      }
      return response;
    }
    if (data.action === "ask_project") {
      return data.data?.message || "Which project would you like to add this task to?";
    }
    if (data.action === "create_project") {
      return data.confirmationMessage || `I'll create a new project "${data.data.name}" for you. Confirm?`;
    }
    if (data.action === "generate_content") {
      return `Here's what I generated:\n\n**Title:** ${data.data.title}\n**Description:** ${data.data.description}`;
    }
    if (data.action === "change_tone" || data.action === "improve" || data.action === "shorten" || data.action === "lengthen") {
      return `Here's the modified text:\n\n${data.data.text}`;
    }
    return data.data?.message || "I'm here to help!";
  };

  const executeTaskCreation = async (taskData: any) => {
    try {
      // Parse due date if provided
      let dueDate: string | undefined;
      if (taskData.dueDate) {
        const date = new Date(taskData.dueDate);
        if (!isNaN(date.getTime())) {
          dueDate = date.toISOString();
        }
      } else if (selectedDate) {
        dueDate = selectedDate.toISOString();
      }

      // Parse reminder if provided
      let reminder: string | undefined;
      if (taskData.reminder && dueDate) {
        const [hours, minutes] = taskData.reminder.split(":");
        const reminderDate = new Date(dueDate);
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        reminder = reminderDate.toISOString();
      }

      await addTask({
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        dueDate,
        reminder,
        project: taskData.projectId || undefined,
      });

      toast.success("Task created successfully!");
      setPendingAction(null);
      setPendingTaskData(null);

      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "✅ Task created successfully! Is there anything else I can help you with?",
        },
      ]);
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task. Please try again.");
    }
  };

  const executeProjectCreation = async (projectData: any) => {
    try {
      await addProject(projectData.name, projectData.color || "#6366f1");
      toast.success("Project created successfully!");
      setPendingAction(null);

      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: `✅ Project "${projectData.name}" created! Now, would you like me to create the task in this project?`,
        },
      ]);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    }
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (!pendingAction) return;

    if (confirmed) {
      if (pendingAction.action === "create_task") {
        await executeTaskCreation(pendingAction.data);
      } else if (pendingAction.action === "create_project") {
        await executeProjectCreation(pendingAction.data);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "No problem! Let me know if you'd like to modify anything or create a different task.",
        },
      ]);
      setPendingAction(null);
      setPendingTaskData(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleMicClick = () => {
    if (!isSupported) {
      toast.error("Voice input is not supported in your browser");
      return;
    }
    toggleListening();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ai-assistant-dialog">
        <div className="ai-assistant-header">
          <div className="ai-assistant-header-info">
            <div className="ai-assistant-avatar">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="ai-assistant-name">Jan</h3>
              <span className="ai-assistant-status">AI Assistant</span>
            </div>
          </div>
          <button className="ai-assistant-close" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="ai-assistant-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-assistant-message ${msg.role === "user" ? "user" : "assistant"}`}
            >
              <div className="ai-assistant-message-icon">
                {msg.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className="ai-assistant-message-content">
                <p>{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-assistant-message assistant">
              <div className="ai-assistant-message-icon">
                <Bot className="h-4 w-4" />
              </div>
              <div className="ai-assistant-message-content">
                <div className="ai-assistant-typing">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Jan is typing...</span>
                </div>
              </div>
            </div>
          )}

          {pendingAction && (
            <div className="ai-assistant-confirmation">
              <Button
                onClick={() => handleConfirmation(true)}
                className="ai-assistant-confirm-btn yes"
              >
                Yes, create it
              </Button>
              <Button
                onClick={() => handleConfirmation(false)}
                variant="outline"
                className="ai-assistant-confirm-btn no"
              >
                No, cancel
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant-input-area">
          <div className={`ai-assistant-input-wrapper ${isListening ? "listening" : ""}`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Type a message or use mic..."}
              className="ai-assistant-input"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleMicClick}
              className={`ai-assistant-mic-btn ${isListening ? "active" : ""}`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="ai-assistant-send-btn"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {isListening && (
            <div className="ai-assistant-listening-indicator">
              <span className="ai-assistant-listening-dot"></span>
              <span>Listening... Speak now</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
