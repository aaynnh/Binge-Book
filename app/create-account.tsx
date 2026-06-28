import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signInWithOAuth, signUpWithEmail, type OAuthProvider } from "@/services/authService";

type AuthMode = "apple" | "google" | "email";

const authOptions: { id: AuthMode; label: string; icon: string }[] = [
  { id: "apple", label: "Continue with Apple", icon: "A" },
  { id: "google", label: "Continue with Google", icon: "G" },
  { id: "email", label: "Continue with email", icon: "@" },
];

const authCopy = {
  apple: "Opens Apple OAuth and creates your BingeBook session.",
  google: "Opens Google OAuth and creates your BingeBook session.",
  email: "Create your account with an email and password.",
};

export default function CreateAccountScreen() {
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Choose a real sign-up method.");

  async function handleProvider(provider: OAuthProvider) {
    setMode(provider);
    setIsLoading(true);
    setStatusMessage(`Opening ${provider === "apple" ? "Apple" : "Google"} sign in...`);

    try {
      await signInWithOAuth(provider);
      router.replace("/profile-setup");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEmailSignup() {
    setIsLoading(true);
    setStatusMessage("Creating your account...");

    try {
      const session = await signUpWithEmail(email, password);

      if (session) {
        router.replace("/profile-setup");
        return;
      }

      setStatusMessage("Account created. Check your email to confirm your login.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Email sign up failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.centerWrap}>
          <View style={styles.header}>
            <Text style={styles.brand}>BingeBook</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Choose how you want to start your reading deck.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.authStack}>
              {authOptions.map((option) => {
                const isActive = mode === option.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    key={option.id}
                    disabled={isLoading}
                    onPress={() => {
                      setMode(option.id);
                      setStatusMessage(
                        option.id === "email"
                          ? "Email selected. Enter your details to continue."
                          : `${option.id === "apple" ? "Apple" : "Google"} selected. Tap continue when you are ready.`
                      );
                    }}
                    style={[styles.authButton, isActive && styles.authButtonActive]}>
                    <View style={[styles.authIcon, isActive && styles.authIconActive]}>
                      <Text style={[styles.authIconText, isActive && styles.authIconTextActive]}>
                        {option.icon}
                      </Text>
                    </View>
                    <Text style={[styles.authText, isActive && styles.authTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.detailPanel}>
              <Text style={styles.detailLabel}>{mode} setup</Text>
              <Text style={styles.detailCopy}>{authCopy[mode]}</Text>

              {mode === "email" ? (
                <View style={styles.fields}>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="Email address"
                    placeholderTextColor="rgba(255,250,240,0.44)"
                    style={styles.input}
                    value={email}
                  />
                  <TextInput
                    onChangeText={setPassword}
                    placeholder="Create password"
                    placeholderTextColor="rgba(255,250,240,0.44)"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                  />
                </View>
              ) : null}

              {(mode === "apple" || mode === "google") ? (
                <View style={styles.connectedPill}>
                  {isLoading ? <ActivityIndicator color="#F1D99D" size="small" /> : null}
                  <Text style={styles.connectedText}>{mode === "apple" ? "Apple" : "Google"} auth</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={mode === "email" ? handleEmailSignup : () => handleProvider(mode)}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Working..." : mode === "email" ? "Create account" : `Continue with ${mode}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={() => router.push("/sign-in")}
              style={[styles.secondaryButton, isLoading && styles.primaryButtonDisabled]}>
              <Text style={styles.secondaryButtonText}>Already have an account?</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>{statusMessage}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071323",
    paddingHorizontal: 22,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    alignSelf: "flex-start",
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  backText: {
    color: "#FFFAF0",
    fontSize: 13,
    fontWeight: "800",
  },
  centerWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 22,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  brand: {
    color: "#F1D99D",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },
  title: {
    color: "#FFFAF0",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 35,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,250,240,0.66)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 270,
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.13)",
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 330,
    padding: 12,
    width: "88%",
  },
  authStack: {
    gap: 8,
  },
  authButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 45,
    paddingHorizontal: 11,
  },
  authButtonActive: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FFFAF0",
  },
  authIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.12)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  authIconActive: {
    backgroundColor: "#F1D99D",
  },
  authIconText: {
    color: "#FFFAF0",
    fontSize: 13,
    fontWeight: "900",
  },
  authIconTextActive: {
    color: "#071323",
  },
  authText: {
    color: "#FFFAF0",
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 10,
  },
  authTextActive: {
    color: "#071323",
  },
  detailPanel: {
    backgroundColor: "rgba(7,19,35,0.58)",
    borderRadius: 19,
    marginTop: 11,
    minHeight: 96,
    padding: 13,
  },
  detailLabel: {
    color: "#F1D99D",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailCopy: {
    color: "rgba(255,250,240,0.72)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  fields: {
    gap: 9,
    marginTop: 10,
  },
  input: {
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 15,
    borderWidth: 1,
    color: "#FFFAF0",
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: 13,
  },
  connectedPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(216,173,85,0.18)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  connectedText: {
    color: "#F1D99D",
    fontSize: 12,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 999,
    marginTop: 13,
    paddingVertical: 12,
    width: 190,
  },
  primaryButtonDisabled: {
    opacity: 0.62,
  },
  primaryButtonText: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,250,240,0.1)",
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 9,
    paddingVertical: 12,
    width: 210,
  },
  secondaryButtonText: {
    color: "#FFFAF0",
    fontSize: 12,
    fontWeight: "900",
  },
  terms: {
    color: "rgba(255,250,240,0.5)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 15,
    maxWidth: 260,
    textAlign: "center",
  },
});
