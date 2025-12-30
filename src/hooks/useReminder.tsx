import { useEffect, useRef, useState } from "react";
import { Task } from "@/types/task";

export const useReminder = (tasks: Task[]) => {
  const checkedReminders = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeReminders, setActiveReminders] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Create audio element for reminder sound with looping
    if (!audioRef.current) {
      audioRef.current = new Audio("/alarm.wav");
      audioRef.current.loop = true;
    }

    const checkReminders = () => {
      const now = new Date();
      const todayDate = now.toDateString();
      const newActiveReminders = new Set<string>();

      tasks.forEach((task) => {
        if (task.reminder) {
          const reminderDate = new Date(task.reminder);
          const reminderKey = `${task.id}-${task.reminder}-${todayDate}`;

          // Check if reminder time has arrived and not yet triggered today
          if (now >= reminderDate && reminderDate.toDateString() === todayDate && !checkedReminders.current.has(reminderKey)) {
            checkedReminders.current.add(reminderKey);
            newActiveReminders.add(task.id);
            
            // Play sound and loop
            if (audioRef.current && audioRef.current.paused) {
              audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
            }

            // Show notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Task Reminder", {
                body: task.title,
                icon: "/favicon.ico",
              });
            }
          }
        }
      });

      setActiveReminders(newActiveReminders);

      // Clear checked reminders at midnight
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const nextMidnight = new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
      if (now.getTime() >= nextMidnight.getTime()) {
        checkedReminders.current.clear();
        setActiveReminders(new Set());
      }
    };

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check every 10 seconds for more responsive reminders
    const interval = setInterval(checkReminders, 10000);
    checkReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [tasks]);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveReminders(new Set());
  };

  return { stopSound, hasActiveReminder: activeReminders.size > 0, activeReminders };
};
