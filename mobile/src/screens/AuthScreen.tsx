import React from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { colors } from "../theme/colors";

const AuthScreen = () => {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
        />
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.linkText}>Create an account</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  linkText: {
    color: colors.primaryDark,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AuthScreen;
