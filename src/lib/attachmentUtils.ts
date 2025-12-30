import { supabase } from "@/integrations/supabase/client";
import { Attachment } from "@/types/task";
import { toast } from "sonner";

export async function saveAttachmentToDatabase(
  taskId: string,
  attachment: Attachment,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("attachments")
    .insert({
      id: attachment.id,
      task_id: taskId,
      user_id: userId,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      size: attachment.size,
    });

  if (error) {
    console.error("Error saving attachment to database:", error);
    throw error;
  }
}

export async function deleteAttachmentFromDatabase(
  attachmentId: string
): Promise<void> {
  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) {
    console.error("Error deleting attachment from database:", error);
    throw error;
  }
}

export async function deleteAttachmentFromStorage(
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from("task-attachments")
    .remove([filePath]);

  if (error) {
    console.error("Error deleting attachment from storage:", error);
    throw error;
  }
}

export async function fetchTaskAttachments(
  taskId: string
): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching attachments:", error);
    return [];
  }

  return (data || []).map((att) => ({
    id: att.id,
    name: att.name,
    type: att.type,
    url: att.url,
    size: att.size,
  }));
}

export function previewAttachment(url: string, name: string): void {
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    toast.error("Failed to open preview window. Please check popup blockers.");
    return;
  }

  const fileExtension = name.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
    fileExtension || ""
  );
  const isPdf = fileExtension === "pdf";

  if (isImage) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${name}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #000;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${url}" alt="${name}" />
        </body>
      </html>
    `);
  } else if (isPdf) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${name}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
            }
            iframe {
              width: 100vw;
              height: 100vh;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="${url}"></iframe>
        </body>
      </html>
    `);
  } else {
    // For other file types, just open the URL directly
    previewWindow.location.href = url;
  }

  previewWindow.document.close();
}
