import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { QuizAnswers } from "@/utils/recommendations";

const moods = [
  {
    accent: "#F1D99D",
    icon: "flash-outline" as const,
    title: "Need suspense",
    detail: "Mystery, danger, and fast hooks.",
  },
  {
    accent: "#F4A7B9",
    icon: "heart-outline" as const,
    title: "Want romance",
    detail: "Chemistry, tension, and payoff.",
  },
  {
    accent: "#9FD0EE",
    icon: "timer-outline" as const,
    title: "Easy 10-min read",
    detail: "Beginner-friendly and not heavy.",
  },
  {
    accent: "#C7B7FF",
    icon: "rainy-outline" as const,
    title: "Emotionally wreck me",
    detail: "Soft pain, healing, and big feelings.",
  },
  {
    accent: "#BFE7C8",
    icon: "cafe-outline" as const,
    title: "Cozy reset",
    detail: "Warm, magical, and low-stress.",
  },
];

export default function MoodModeScreen() {
  const params = useLocalSearchParams<{ answers?: string }>();
  const baseAnswers = useMemo(() => parseAnswers(params.answers), [params.answers]);
  const [selectedMood, setSelectedMood] = useState("Easy 10-min read");

  function buildDeck() {
    router.push({
      pathname: "/deck-loading",
      params: {
        answers: JSON.stringify({
          ...baseAnswers,
          mood: selectedMood,
        }),
      },
    } as never);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TouchableOpacity activeOpacity={0.82} onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.wrap}>
        <Text style={styles.brand}>BingeBook</Text>
        <Text style={styles.title}>What kind of book do you need right now?</Text>
        <Text style={styles.subtitle}>This changes your deck ranking for today.</Text>

        <View style={styles.moodStack}>
          {moods.map((mood) => {
            const isActive = mood.title === selectedMood;

            return (
              <TouchableOpacity
                activeOpacity={0.86}
                key={mood.title}
                onPress={() => setSelectedMood(mood.title)}
                style={[styles.moodCard, isActive && styles.moodCardActive]}>
                <View style={[styles.iconBubble, { backgroundColor: mood.accent }]}>
                  <Ionicons name={mood.icon} size={18} color="#071323" />
                </View>
                <View style={styles.moodTextBlock}>
                  <Text style={[styles.moodTitle, isActive && styles.moodTitleActive]}>{mood.title}</Text>
                  <Text style={[styles.moodDetail, isActive && styles.moodDetailActive]}>{mood.detail}</Text>
                </View>
                {isActive ? <Ionicons name="checkmark-circle" size={24} color="#F1D99D" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity activeOpacity={0.88} onPress={buildDeck} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Build my mood deck</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function parseAnswers(rawAnswers: string | string[] | undefined): QuizAnswers {
  const raw = Array.isArray(rawAnswers) ? rawAnswers[0] : rawAnswers;

  if (!raw) {
    return {
      obsessions: ["Anime arcs", "Psych reels"],
      character: "Quiet overthinker",
      world: "Memory lane",
      plot: "A friendship saves them",
    };
  }

  try {
    return JSON.parse(raw) as QuizAnswers;
  } catch {
    return {
      obsessions: ["Anime arcs", "Psych reels"],
      character: "Quiet overthinker",
      world: "Memory lane",
      plot: "A friendship saves them",
    };
  }
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#071323",
    flex: 1,
    paddingHorizontal: 22,
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
  wrap: {
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: 390,
    paddingBottom: 26,
    width: "100%",
  },
  brand: {
    color: "#F1D99D",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  title: {
    color: "#FFFAF0",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,250,240,0.62)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 9,
    textAlign: "center",
  },
  moodStack: {
    gap: 10,
    marginTop: 28,
  },
  moodCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.07)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 78,
    padding: 13,
  },
  moodCardActive: {
    backgroundColor: "rgba(255,250,240,0.14)",
    borderColor: "#F1D99D",
  },
  iconBubble: {
    alignItems: "center",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  moodTextBlock: {
    flex: 1,
  },
  moodTitle: {
    color: "#FFFAF0",
    fontSize: 16,
    fontWeight: "900",
  },
  moodTitleActive: {
    color: "#F1D99D",
  },
  moodDetail: {
    color: "rgba(255,250,240,0.56)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 4,
  },
  moodDetailActive: {
    color: "rgba(255,250,240,0.78)",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 999,
    marginTop: 24,
    paddingVertical: 15,
    width: 260,
  },
  primaryButtonText: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
  },
});
