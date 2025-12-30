import { Circle, Clock, CheckCircle2, XCircle, Calendar, CalendarClock, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "../styles/status-filters.css";

export type FilterType = "all" | "todo" | "inprogress" | "completed" | "cancelled" | "today" | "upcoming";

interface StatusFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  isMobile?: boolean;
}

const filters = [
  { id: "all" as FilterType, label: "All", icon: Circle },
  { id: "todo" as FilterType, label: "To Do", icon: Circle },
  { id: "inprogress" as FilterType, label: "In Progress", icon: Clock },
  { id: "completed" as FilterType, label: "Completed", icon: CheckCircle2 },
  { id: "cancelled" as FilterType, label: "Cancelled", icon: XCircle },
  { id: "today" as FilterType, label: "Today", icon: Calendar },
  { id: "upcoming" as FilterType, label: "Upcoming", icon: CalendarClock },
];

export const StatusFilters = ({ activeFilter, onFilterChange, isMobile = false }: StatusFiltersProps) => {
  const activeFilterData = filters.find(f => f.id === activeFilter);
  const ActiveIcon = activeFilterData?.icon || Circle;

  if (isMobile) {
    return (
      <div className="status-filters-mobile">
        <Select value={activeFilter} onValueChange={(value: FilterType) => onFilterChange(value)}>
          <SelectTrigger className="status-filters-dropdown">
            <div className="status-filters-dropdown-value">
              <ActiveIcon className="status-filter-icon" />
              <span>{activeFilterData?.label || "All"}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover status-filters-dropdown-content">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <SelectItem key={filter.id} value={filter.id} className="status-filters-dropdown-item">
                  <div className="status-filters-dropdown-item-content">
                    <Icon className="status-filter-icon" />
                    <span>{filter.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="status-filters">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`status-filter-button ${isActive ? "status-filter-button-active" : "status-filter-button-inactive"}`}
          >
            <Icon className="status-filter-icon" />
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
};
