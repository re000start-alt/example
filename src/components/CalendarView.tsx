import { Task } from "@/types/task";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";
import { TaskItem } from "./TaskItem";
import { MonthYearPicker } from "./MonthYearPicker";
import "../styles/calendar.css";

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  activeReminders: Set<string>;
  onStopReminder?: () => void;
}

export const CalendarView = ({ tasks, onEditTask, activeReminders, onStopReminder }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      // Parse YYYY-MM-DD format and compare dates without time
      const taskDate = parseISO(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    console.log("Drop task", taskId, "on date", date);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <MonthYearPicker 
          currentDate={currentMonth}
          onDateChange={setCurrentMonth}
        />
        <div className="calendar-nav">
          <button
            className="calendar-nav-button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="calendar-today-button"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </button>
          <button
            className="calendar-nav-button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, day)}
                className={`calendar-day ${!isCurrentMonth ? "calendar-day-other-month" : ""} ${isToday ? "calendar-day-today" : ""} ${isSelected ? "calendar-day-selected" : ""}`}
              >
                <span className={`calendar-day-number ${!isCurrentMonth ? "calendar-day-number-other-month" : ""} ${isToday ? "calendar-day-number-today" : ""}`}>
                  {format(day, "d")}
                </span>
                
                {dayTasks.length > 0 && (
                  <div className="calendar-day-dots">
                    {Array.from({ length: Math.min(dayTasks.length, 5) }).map((_, i) => (
                      <div key={i} className="calendar-day-dot" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedDateTasks.length > 0 && (
        <div className="calendar-selected-date">
          <h3 className="calendar-selected-date-title">
            Tasks for {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          <div className="calendar-selected-date-tasks">
            {selectedDateTasks.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={onEditTask} isReminderActive={activeReminders.has(task.id)} onStopReminder={onStopReminder} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
