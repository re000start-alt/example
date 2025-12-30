import React, { useState } from "react";
import { View, Pressable, Text, Modal, StyleSheet, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { FilterType } from "./StatusFilterBar";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Tasks" },
  { value: "todo", label: "To Do" },
  { value: "inprogress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

const FilterSelector = ({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const activeLabel = filterOptions.find((option) => option.value === active)?.label;

  return (
    <View>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText}>{activeLabel}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      <Modal animationType="slide" transparent visible={visible}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Filter tasks</Text>
            <ScrollView contentContainerStyle={styles.list}>
              {filterOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                  style={[
                    styles.option,
                    option.value === active && styles.optionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.value === active && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 16,
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.textPrimary,
  },
  list: {
    gap: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
});

export default FilterSelector;
