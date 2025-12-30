import { List, FolderKanban, CalendarDays } from "lucide-react";
import { ViewMode } from "@/types/task";
import "../styles/view-switcher.css";

interface ViewSwitcherProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewSwitcher = ({ activeView, onViewChange }: ViewSwitcherProps) => {
  const views = [
    { id: "list" as ViewMode, icon: List, label: "List" },
    { id: "project" as ViewMode, icon: FolderKanban, label: "Projects" },
    { id: "calendar" as ViewMode, icon: CalendarDays, label: "Calendar" },
  ];

  return (
    <div className="view-switcher">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`view-switcher-button ${isActive ? "view-switcher-button-active" : "view-switcher-button-inactive"}`}
            title={view.label}
          >
            <Icon className="view-switcher-icon" />
            <span className="view-switcher-text">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};
