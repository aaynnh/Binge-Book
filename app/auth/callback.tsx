import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { completeOAuthSession } from "@/services/authService";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  const callbackUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }

    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, String(item)));
        return;
      }

      if (value != null) {
        query.set(key, String(value));
      }
    });

    const queryString = query.toString();
    return `https://bingebook.app/auth/callback${queryString ? `?${queryString}` : ""}`;
  }, [params]);

  useEffect(() => {
    let isMounted = true;

    async function finishAuth() {
      try {
        await completeOAuthSession(callbackUrl);

        if (isMounted) {
          router.replace("/profile-setup");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not complete sign in.");
        }
      }
    }

    void finishAuth();

    return () => {
      isMounted = false;
    };
  }, [callbackUrl]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.brand}>BingeBook</Text>
      <View style={styles.card}>
        {errorMessage ? (
          <>
            <Text style={styles.title}>Sign in needs one more try</Text>
            <Text style={styles.copy}>{errorMessage}</Text>
            <TouchableOpacity activeOpacity={0.86} onPress={() => router.replace("/sign-in")} style={styles.button}>
              <Text style={styles.buttonText}>Back to sign in</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator color="#F1D99D" size="small" />
            <Text style={styles.title}>Finishing sign in</Text>
            <Text style={styles.copy}>Opening your reading deck...</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: "#071323",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    color: "#FFFAF0",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 22,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#101D2D",
    borderColor: "rgba(241,217,157,0.22)",
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 360,
    padding: 26,
    width: "100%",
  },
  title: {
    color: "#FFFAF0",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
  copy: {
    color: "rgba(255,250,240,0.68)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  buttonText: {
    color: "#071323",
    fontSize: 14,
    fontWeight: "900",
  },
});
