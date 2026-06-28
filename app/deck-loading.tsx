import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingBookAnimation } from "@/components/LoadingBookAnimation";
import { useAppAppearance } from "@/services/appearance";

const postQuizLoadingTime = 5000;
const returningReaderLoadingTime = 2800;

export default function DeckLoadingScreen() {
  const { colors, isDark } = useAppAppearance();
  const params = useLocalSearchParams<{ answers?: string; mode?: string }>();
  const isReturningReader = params.mode === "resume";

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/deck",
        params: {
          answers: params.answers,
          skipInitialLoading: "1",
        },
      } as never);
    }, isReturningReader ? returningReaderLoadingTime : postQuizLoadingTime);

    return () => clearTimeout(timer);
  }, [isReturningReader, params.answers]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Text style={[styles.brand, { color: colors.text }]}>BingeBook</Text>
      <LoadingBookAnimation />
      <Text style={[styles.title, { color: colors.text }]}>
        {isReturningReader ? "Freshly brewing your taste" : "Brewing your suggestions"}
      </Text>
      <Text style={[styles.copy, { color: colors.mutedText }]}>
        {isReturningReader
          ? "Pulling your saved preferences into a fresh swipe stack."
          : "Hang tight. We’re blending your quiz picks into a fresh stack made for your mood."}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 42,
    paddingHorizontal: 24,
  },
  brand: {
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
    marginTop: 22,
    textAlign: "center",
  },
  copy: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 280,
    textAlign: "center",
  },
});
