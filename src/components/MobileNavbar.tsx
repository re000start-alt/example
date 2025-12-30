import { Search, Sparkles, Plus, User, FolderPlus } from "lucide-react";
import { useState } from "react";
import "../styles/mobile-navbar.css";

interface MobileNavbarProps {
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  onOpenAI: () => void;
  onOpenProfile: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const MobileNavbar = ({
  onOpenNewTask,
  onOpenNewProject,
  onOpenAI,
  onOpenProfile,
  searchQuery,
  onSearchChange,
}: MobileNavbarProps) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      {/* Mobile Header with Logo */}
      <header className="mobile-header">
        <div className="mobile-header-logo">
          <div className="mobile-header-logo-icon">
            <div className="mobile-header-logo-circle"></div>
          </div>
          <span className="mobile-header-logo-text">TaskFlow</span>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="mobile-navbar">
        {showSearch ? (
          <div className="mobile-navbar-search">
            <Search className="mobile-navbar-search-icon" />
            <input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="mobile-navbar-search-input"
              autoFocus
            />
            <button
              onClick={() => {
                setShowSearch(false);
                onSearchChange("");
              }}
              className="mobile-navbar-search-close"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="mobile-navbar-actions">
            <button onClick={() => setShowSearch(true)} className="mobile-navbar-btn">
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>

            <button onClick={onOpenAI} className="mobile-navbar-btn">
              <Sparkles className="h-5 w-5" />
              <span>AI</span>
            </button>

            <button onClick={onOpenNewTask} className="mobile-navbar-btn mobile-navbar-btn-primary">
              <Plus className="h-6 w-6" />
            </button>

            <button onClick={onOpenNewProject} className="mobile-navbar-btn">
              <FolderPlus className="h-5 w-5" />
              <span>Project</span>
            </button>

            <button onClick={onOpenProfile} className="mobile-navbar-btn">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
