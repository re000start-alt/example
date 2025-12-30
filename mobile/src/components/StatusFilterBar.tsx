import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export type FilterType =
  | "all"
  | "todo"
  | "inprogress"
  | "completed"
  | "cancelled"
  | "today"
  | "upcoming";

const filterLabels: Record<FilterType, string> = {
  all: "All Tasks",
  todo: "To Do",
  inprogress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  today: "Today",
  upcoming: "Upcoming",
};

const StatusFilterBar = ({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}) => {
  return (
    <View style={styles.container}>
      {(Object.keys(filterLabels) as FilterType[]).map((filter) => {
        const isActive = active === filter;
        return (
          <Pressable
            key={filter}
            onPress={() => onChange(filter)}
            style={[styles.button, isActive && styles.activeButton]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {filterLabels[filter]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  activeLabel: {
    color: "#FFFFFF",
  },
});

export default StatusFilterBar;
