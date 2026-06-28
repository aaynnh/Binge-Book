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

import { signInWithEmail, signInWithOAuth, type OAuthProvider } from "@/services/authService";

type SignInMode = "apple" | "google" | "password";

export default function SignInScreen() {
  const [mode, setMode] = useState<SignInMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Choose a real sign-in method.");

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

  async function handleEmailSignin() {
    setIsLoading(true);
    setStatusMessage("Signing you in...");

    try {
      await signInWithEmail(email, password);
      router.replace("/profile-setup");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Email sign in failed.");
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Choose a sign-in method to continue.</Text>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={() => {
                setMode("apple");
                setStatusMessage("Apple selected. Tap the sign-in button to continue.");
              }}
              style={[styles.providerButton, mode === "apple" && styles.providerButtonActive]}>
              <View style={[styles.providerIcon, mode === "apple" && styles.providerIconActive]}>
                <Text style={[styles.providerIconText, mode === "apple" && styles.providerIconTextActive]}>
                  A
                </Text>
              </View>
              <Text style={[styles.providerText, mode === "apple" && styles.providerTextActive]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={() => {
                setMode("google");
                setStatusMessage("Google selected. Tap the sign-in button to continue.");
              }}
              style={[styles.providerButton, mode === "google" && styles.providerButtonActive]}>
              <View style={[styles.providerIcon, mode === "google" && styles.providerIconActive]}>
                <Text style={[styles.providerIconText, mode === "google" && styles.providerIconTextActive]}>
                  G
                </Text>
              </View>
              <Text style={[styles.providerText, mode === "google" && styles.providerTextActive]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={() => {
                setMode("password");
                setStatusMessage("Email selected. Enter your details to continue.");
              }}
              style={[styles.providerButton, mode === "password" && styles.providerButtonActive]}>
              <View style={[styles.providerIcon, mode === "password" && styles.providerIconActive]}>
                <Text
                  style={[styles.providerIconText, mode === "password" && styles.providerIconTextActive]}>
                  @
                </Text>
              </View>
              <Text style={[styles.providerText, mode === "password" && styles.providerTextActive]}>
                Email
              </Text>
            </TouchableOpacity>

            {mode === "password" ? (
              <View style={styles.formPanel}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="maya@bingebook.app"
                  placeholderTextColor="rgba(255,250,240,0.44)"
                  style={styles.input}
                  value={email}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,250,240,0.44)"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
            ) : (
              <View style={styles.readyPanel}>
                <Text style={styles.readyLabel}>{mode} sign-in selected</Text>
                <Text style={styles.readyCopy}>
                  {isLoading ? "Opening secure OAuth..." : "Tap the sign-in button once when you are ready."}
                </Text>
                {isLoading ? <ActivityIndicator color="#F1D99D" style={styles.panelLoader} /> : null}
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={mode === "password" ? handleEmailSignin : () => handleProvider(mode)}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Working..." : mode === "password" ? "Sign in" : `Sign in with ${mode}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={() => router.push("/create-account")}
              style={[styles.secondaryButton, isLoading && styles.primaryButtonDisabled]}>
              <Text style={styles.secondaryButtonText}>Create account instead</Text>
            </TouchableOpacity>

            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
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
    paddingBottom: 26,
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
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,250,240,0.66)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
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
  providerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    minHeight: 45,
    paddingHorizontal: 11,
  },
  providerButtonActive: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FFFAF0",
  },
  providerIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.12)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  providerIconActive: {
    backgroundColor: "#F1D99D",
  },
  providerIconText: {
    color: "#FFFAF0",
    fontSize: 13,
    fontWeight: "900",
  },
  providerIconTextActive: {
    color: "#071323",
  },
  providerText: {
    color: "#FFFAF0",
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 10,
  },
  providerTextActive: {
    color: "#071323",
  },
  formPanel: {
    backgroundColor: "rgba(7,19,35,0.58)",
    borderRadius: 19,
    marginTop: 4,
    padding: 13,
  },
  label: {
    color: "rgba(255,250,240,0.68)",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 7,
    marginTop: 8,
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
  readyPanel: {
    backgroundColor: "rgba(7,19,35,0.58)",
    borderRadius: 19,
    marginTop: 4,
    minHeight: 86,
    padding: 13,
  },
  readyLabel: {
    color: "#F1D99D",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  readyCopy: {
    color: "rgba(255,250,240,0.72)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  panelLoader: {
    alignSelf: "flex-start",
    marginTop: 10,
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
    fontSize: 13,
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
    width: 190,
  },
  secondaryButtonText: {
    color: "#FFFAF0",
    fontSize: 12,
    fontWeight: "900",
  },
  statusText: {
    color: "rgba(255,250,240,0.58)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    textAlign: "center",
  },
});
