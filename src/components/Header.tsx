import { Search, Sparkles, Plus, User, FolderPlus } from "lucide-react";
import "../styles/header.css";

interface HeaderProps {
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  onOpenAI: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isAuthenticated?: boolean;
}

export const Header = ({ onOpenNewTask, onOpenNewProject, onOpenAI, onOpenProfile, onOpenAuth, searchQuery, onSearchChange, isAuthenticated = false }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <div className="header-logo-icon">
            <div className="header-logo-circle"></div>
          </div>
          <span className="header-logo-text">TaskFlow</span>
        </div>

        <div className="header-search">
          <Search className="header-search-icon" />
          <input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="header-search-input"
          />
        </div>

        <div className="header-actions">
          <button
            onClick={onOpenAI}
            className="header-btn header-btn-ghost"
          >
            <Sparkles className="h-4 w-4" />
            <span className="header-btn-text">Ask AI</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="header-btn header-btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="header-btn-text">New Task</span>
          </button>

          <button
            onClick={onOpenNewProject}
            className="header-btn header-btn-outline"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="header-btn-text">New Project</span>
          </button>

          {!isAuthenticated && (
            <button className="header-btn header-btn-outline" onClick={onOpenAuth}>
              Login
            </button>
          )}

          <button
            onClick={onOpenProfile}
            className="header-btn header-btn-ghost header-btn-icon"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
