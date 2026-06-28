import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "@/components/AppBottomNav";
import { completeReadingSession, getReadingProgress, type ReadingProgress } from "@/services/readingList";

const sessionSeconds = 10 * 60;

export default function ReadingModeScreen() {
  const params = useLocalSearchParams<{ title?: string }>();
  const [secondsLeft, setSecondsLeft] = useState(sessionSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState<ReadingProgress>({ completedSessions: 0, streak: 0, totalMinutes: 0, xp: 0 });
  const completion = 1 - secondsLeft / sessionSeconds;
  const ringSize = useMemo(() => Math.max(0.08, completion), [completion]);

  useEffect(() => {
    let isMounted = true;

    getReadingProgress().then((readingProgress) => {
      if (isMounted) {
        setProgress(readingProgress);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      finishSession();
    }
  }, [isRunning, secondsLeft]);

  async function finishSession() {
    setIsRunning(false);
    setIsComplete(true);
    const nextProgress = await completeReadingSession(10);
    setProgress(nextProgress);
  }

  function resetSession() {
    setSecondsLeft(sessionSeconds);
    setIsComplete(false);
    setIsRunning(false);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TouchableOpacity activeOpacity={0.82} onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={25} color="#FFFAF0" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.brand}>10-minute mode</Text>
        <Text numberOfLines={2} style={styles.title}>
          {params.title ?? "Your current book"}
        </Text>
        <Text style={styles.subtitle}>No pressure. Just one focused session.</Text>

        <View style={styles.timerWrap}>
          <View style={styles.timerRing}>
            <View
              style={[
                styles.timerFill,
                {
                  opacity: ringSize,
                  transform: [{ scale: 0.62 + ringSize * 0.38 }],
                },
              ]}
            />
            <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.timerLabel}>{isComplete ? "session complete" : isRunning ? "reading" : "ready"}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.totalMinutes}</Text>
            <Text style={styles.statLabel}>minutes</Text>
          </View>
        </View>

        {isComplete ? (
          <View style={styles.rewardCard}>
            <Ionicons name="sparkles" size={22} color="#071323" />
            <Text style={styles.rewardTitle}>Daily chest unlocked</Text>
            <Text style={styles.rewardCopy}>+100 XP added. Your streak is updated.</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => (isComplete ? resetSession() : setIsRunning((current) => !current))}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {isComplete ? "Start another session" : isRunning ? "Pause session" : "Start reading"}
          </Text>
        </TouchableOpacity>

        {!isComplete ? (
          <TouchableOpacity activeOpacity={0.82} onPress={finishSession} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Finish now for demo</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <AppBottomNav active="reading" />
    </SafeAreaView>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#071323",
    flex: 1,
    paddingHorizontal: 22,
  },
  backButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    marginTop: 12,
    width: 42,
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: 390,
    paddingBottom: 40,
    width: "100%",
  },
  brand: {
    color: "#F1D99D",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFAF0",
    fontSize: 33,
    fontWeight: "900",
    lineHeight: 37,
    marginTop: 11,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,250,240,0.62)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  timerWrap: {
    marginTop: 34,
  },
  timerRing: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(241,217,157,0.45)",
    borderRadius: 999,
    borderWidth: 2,
    height: 228,
    justifyContent: "center",
    overflow: "hidden",
    width: 228,
  },
  timerFill: {
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 228,
    position: "absolute",
    width: 228,
  },
  timerText: {
    color: "#FFFAF0",
    fontSize: 54,
    fontWeight: "900",
  },
  timerLabel: {
    color: "rgba(255,250,240,0.64)",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 30,
    width: "100%",
  },
  statCard: {
    backgroundColor: "rgba(255,250,240,0.1)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 13,
  },
  statValue: {
    color: "#FFFAF0",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  statLabel: {
    color: "rgba(255,250,240,0.56)",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center",
    textTransform: "uppercase",
  },
  rewardCard: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 22,
    marginTop: 18,
    padding: 16,
    width: "100%",
  },
  rewardTitle: {
    color: "#071323",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  rewardCopy: {
    color: "rgba(7,19,35,0.68)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  primaryButton: {
    alignItems: "center",
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
  secondaryButton: {
    alignItems: "center",
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 13,
    width: 220,
  },
  secondaryButtonText: {
    color: "#FFFAF0",
    fontSize: 13,
    fontWeight: "900",
  },
});
