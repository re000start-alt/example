import "../styles/ProfileDialog.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Mail, Image as ImageIcon, Sun, Moon, Monitor, Palette, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { useTasks } from "@/contexts/SupabaseTaskContext";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout?: () => void;
  onViewChange?: (view: string) => void;
}

export const ProfileDialog = ({ open, onOpenChange, onLogout, onViewChange }: ProfileDialogProps) => {
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [tagline, setTagline] = useState("Task Manager Enthusiast");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authProvider, setAuthProvider] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { tasks, projects } = useTasks();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email || "");
        setAuthProvider(session.user.app_metadata.provider || "email");
        setCreatedAt(new Date(session.user.created_at).toLocaleDateString());
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, tagline, avatar_url")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setUsername(profile.name || "User");
          setTagline(profile.tagline || "Task Manager Enthusiast");
          
          // Use profile avatar or fallback to Google avatar
          let avatarToUse = profile.avatar_url || "";
          if (!avatarToUse && session.user.user_metadata?.avatar_url) {
            avatarToUse = session.user.user_metadata.avatar_url;
          }
          setAvatarUrl(avatarToUse);
        }
      }
    };
    if (open) loadProfile();
  }, [open]);

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const projectCount = projects.length;

  if (!open) return null;

  const handleSaveProfile = async () => {
    // Update locally first
    setIsEditingProfile(false);
    toast.success("Profile updated!");
    
    // Then update server
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase
        .from("profiles")
        .update({ name: username, tagline })
        .eq("id", session.user.id);
      
      if (error) {
        toast.error("Failed to save to server");
        console.error("Profile update error:", error);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload avatar");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", session.user.id);

    if (updateError) {
      toast.error("Failed to save avatar to server");
    } else {
      setAvatarUrl(publicUrl);
      toast.success("Avatar updated!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully!");
    onLogout?.();
    setShowLogoutConfirm(false);
    onOpenChange(false);
  };

  return (
    <div className="profile-overlay" onClick={() => onOpenChange(false)}>
      <div className="profile-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="profile-header">
          <div className="avatar-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} className="avatar-img" alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <input
              id="avatar-upload"
              type="file"
              className="hidden-input"
              onChange={handleAvatarUpload}
              accept="image/*"
            />
            <button
              className="avatar-btn"
              onClick={() => document.getElementById("avatar-upload")?.click()}
            >
              <ImageIcon size={16} />
            </button>
          </div>

          {isEditingProfile ? (
            <div className="edit-fields">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Tagline"
              />
              <Button onClick={handleSaveProfile}>Save</Button>
            </div>
          ) : (
            <>
              <h3 className="profile-name">{username}</h3>
              <p className="profile-email">{email}</p>
              <p className="profile-tagline">{tagline}</p>
              <Button variant="ghost" onClick={() => setIsEditingProfile(true)}>
                Edit Profile
              </Button>
            </>
          )}
        </div>

        <div className="profile-info">
          <div>
            <span>Created</span>
            <span>{createdAt}</span>
          </div>
          <div>
            <span>Provider</span>
            <span>
              {authProvider === "google"
                ? "Google Connected"
                : "Email Connected"}
            </span>
          </div>
          <div>
            <span>Completed</span>
            <span>{completedCount}</span>
          </div>
          <div>
            <span>Projects</span>
            <span>{projectCount}</span>
          </div>
        </div>

        <div className="profile-settings">
          <div className="setting-row">
            <span>Theme</span>
            <div className="theme-buttons">
              <Button
                onClick={() => setTheme("light")}
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
              >
                <Sun size={16} />
              </Button>
              <Button
                onClick={() => setTheme("dark")}
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
              >
                <Moon size={16} />
              </Button>
            </div>
          </div>

          <div className="setting-row">
            <span>Accent</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>

          <div className="setting-row">
            <span>Help & Support</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                (window.location.href = "mailto:support@taskflow.com")
              }
            >
              <Mail size={16} />
            </Button>
          </div>
        </div>

        <div className="logout-section">
          {!showLogoutConfirm ? (
            <button
              className="logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut size={16} />
              Sign out
            </button>
          ) : (
            <div className="logout-confirm">
              <p>Are you sure you want to log out?</p>
              <div className="logout-actions">
                <Button onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
