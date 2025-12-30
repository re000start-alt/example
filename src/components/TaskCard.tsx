import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const statusLabels: Record<Task["status"], string> = {
  todo: "To Do",
  inprogress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onDelete }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{task.title}</Text>
          {task.description ? <Text style={styles.description}>{task.description}</Text> : null}
        </View>
        <View style={[styles.statusBadge, styles[`status_${task.status}`]]}>
          <Text style={styles.statusText}>{statusLabels[task.status]}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={() => onToggleStatus(task)}>
          <Text style={styles.secondaryButtonText}>Advance Status</Text>
        </Pressable>
        <Pressable style={styles.dangerButton} onPress={() => onDelete(task)}>
          <Text style={styles.dangerButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  description: {
    marginTop: 6,
    color: "#475569",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  status_todo: {
    backgroundColor: "#0F172A",
  },
  status_inprogress: {
    backgroundColor: "#2563EB",
  },
  status_completed: {
    backgroundColor: "#16A34A",
  },
  status_cancelled: {
    backgroundColor: "#DC2626",
  },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1E293B",
    fontWeight: "600",
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  dangerButtonText: {
    color: "#DC2626",
    fontWeight: "600",
  },
});
