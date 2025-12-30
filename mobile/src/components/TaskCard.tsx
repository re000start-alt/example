import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Task } from "../data/sampleTasks";
import { colors } from "../theme/colors";

const statusStyles = {
  todo: { label: "To Do", color: colors.muted },
  inprogress: { label: "In Progress", color: colors.warning },
  completed: { label: "Completed", color: colors.success },
  cancelled: { label: "Cancelled", color: colors.danger },
};

const TaskCard = ({ task }: { task: Task }) => {
  const status = statusStyles[task.status];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.badge, { backgroundColor: status.color }]}>
          <Text style={styles.badgeText}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.description}>{task.description}</Text>
      <View style={styles.footer}>
        {task.project ? <Text style={styles.project}>{task.project}</Text> : null}
        {task.dueDate ? <Text style={styles.date}>Due {task.dueDate}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  project: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default TaskCard;
