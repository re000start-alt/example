import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const SearchBar = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? "Search tasks"}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    height: 40,
    color: colors.textPrimary,
    fontSize: 14,
  },
});

export default SearchBar;
