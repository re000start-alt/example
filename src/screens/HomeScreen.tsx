import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTasks } from "../contexts/TaskContext";
import { Task, TaskStatus } from "../types/task";
import { TaskCard } from "../components/TaskCard";
import { useDeviceLayout } from "../hooks/useDeviceLayout";

const filters: { label: string; value: "all" | TaskStatus }[] = [
  { label: "All", value: "all" },
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "inprogress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "inprogress",
  inprogress: "completed",
  completed: "completed",
  cancelled: "cancelled",
};

const HomeScreen: React.FC = () => {
  const { tasks, loading, updateTask, deleteTask, refreshData, signOut } = useTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | TaskStatus>("all");
  const { isTablet } = useDeviceLayout();

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter = activeFilter === "all" || task.status === activeFilter;
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [tasks, activeFilter, searchQuery]);

  const handleAdvanceStatus = (task: Task) => {
    const newStatus = nextStatus[task.status];
    if (newStatus !== task.status) {
      updateTask(task.id, { status: newStatus });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>Stay on top of today&apos;s priorities</Text>
        </View>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={[styles.searchRow, isTablet && styles.searchRowTablet]}>
        <TextInput
          placeholder="Search tasks"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Pressable style={styles.refreshButton} onPress={refreshData}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={[styles.filterRow, isTablet && styles.filterRowTablet]}>
        {filters.map((filter) => (
          <Pressable
            key={filter.value}
            style={[styles.filterChip, activeFilter === filter.value && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onToggleStatus={handleAdvanceStatus} onDelete={deleteTask} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptyDescription}>
                Adjust your filters or create a new task in the web dashboard.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 12,
    marginBottom: 16,
    gap: 12,
  },
  headerTablet: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 6,
  },
  signOutButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  signOutText: {
    fontWeight: "600",
    color: "#0F172A",
  },
  searchRow: {
    gap: 12,
    marginBottom: 16,
  },
  searchRowTablet: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  refreshText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterRowTablet: {
    justifyContent: "flex-start",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#1E40AF",
    borderColor: "#1E40AF",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748B",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
  emptyDescription: {
    marginTop: 6,
    textAlign: "center",
    color: "#64748B",
  },
});

export default HomeScreen;
