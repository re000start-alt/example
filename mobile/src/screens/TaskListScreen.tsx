import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
} from "react-native";
import TaskCard from "../components/TaskCard";
import SearchBar from "../components/SearchBar";
import StatusFilterBar, { FilterType } from "../components/StatusFilterBar";
import FilterSelector from "../components/FilterSelector";
import { colors } from "../theme/colors";
import { sampleTasks } from "../data/sampleTasks";

const TaskListScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return sampleTasks.filter((task) => {
      const matchesSearch =
        !normalized ||
        task.title.toLowerCase().includes(normalized) ||
        task.description.toLowerCase().includes(normalized);

      if (!matchesSearch) {
        return false;
      }

      switch (activeFilter) {
        case "todo":
        case "inprogress":
        case "completed":
        case "cancelled":
          return task.status === activeFilter;
        case "today":
          return task.dueDate === "2024-08-12";
        case "upcoming":
          return Boolean(task.dueDate);
        default:
          return true;
      }
    });
  }, [activeFilter, search]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>My Tasks</Text>
            <Text style={styles.subtitle}>Stay ahead of your schedule</Text>
          </View>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>New Task</Text>
          </Pressable>
        </View>
        <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
          <SearchBar value={search} onChange={setSearch} />
          {isTablet ? (
            <StatusFilterBar active={activeFilter} onChange={setActiveFilter} />
          ) : (
            <FilterSelector active={activeFilter} onChange={setActiveFilter} />
          )}
        </View>
      </View>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toolbar: {
    gap: 12,
  },
  toolbarTablet: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});

export default TaskListScreen;
