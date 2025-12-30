import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../integrations/supabase/client";
import { showToast } from "../utils/toast";
import { useDeviceLayout } from "../hooks/useDeviceLayout";

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { isTablet } = useDeviceLayout();

  const handleSubmit = async () => {
    if (!email || !password) {
      showToast("Enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast("Check your inbox to confirm your account.");
      }
    } catch (error: any) {
      showToast(error.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.inner, isTablet && styles.innerTablet]}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{mode === "signin" ? "Sign In" : "Create Account"}</Text>
          <Text style={styles.subtitle}>Access your tasks across devices.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => setMode(mode === "signin" ? "signup" : "signin")}> 
            <Text style={styles.secondaryButtonText}>
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  innerTablet: {
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    width: "100%",
    maxWidth: 480,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    color: "#64748B",
  },
  fieldGroup: {
    marginTop: 16,
  },
  label: {
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  primaryButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
});

export default AuthScreen;
