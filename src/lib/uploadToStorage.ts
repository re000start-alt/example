import { supabase } from "@/integrations/supabase/client";

export interface UploadedAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export async function uploadFileToStorage(file: File, userId: string): Promise<UploadedAttachment> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('task-attachments')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(filePath);

  return {
    id: data.path,
    name: file.name,
    type: file.type,
    url: publicUrl,
    size: file.size,
  };
}
