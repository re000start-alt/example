import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

interface MonthYearPickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const MonthYearPicker = ({ currentDate, onDateChange }: MonthYearPickerProps) => {
  const [date, setDate] = useState<Date>(currentDate);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      onDateChange(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="calendar-month-title-button">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};
