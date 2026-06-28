import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const obsessionCards = [
  { title: "Anime arcs", detail: "chosen family, stakes, emotion", code: "AN" },
  { title: "Crime docs", detail: "dark motives and clues", code: "CR" },
  { title: "K-drama ache", detail: "longing, softness, payoff", code: "KD" },
  { title: "Psych reels", detail: "people, patterns, behavior", code: "PS" },
];

const characterCards = [
  { title: "Quiet overthinker", detail: "soft, observant, secretly intense" },
  { title: "Messy main character", detail: "chaotic choices, big feelings" },
  { title: "Cold detective", detail: "sharp, suspicious, emotionally locked" },
  { title: "Hopeless romantic", detail: "yearning, chemistry, vulnerability" },
];

const worldCards = [
  { title: "Rainy city", detail: "neon lights, secrets, late nights" },
  { title: "Small town", detail: "cozy places, hidden history" },
  { title: "Elite campus", detail: "friend groups, rivalry, gossip" },
  { title: "Memory lane", detail: "regret, second chances, what-ifs" },
];

const plotCards = [
  { title: "A mystery unfolds", detail: "something is off from page one" },
  { title: "Two people collide", detail: "banter, tension, emotional payoff" },
  { title: "A life gets reset", detail: "choices, regrets, new versions" },
  { title: "A friendship saves them", detail: "soft loyalty, healing, trust" },
];

export default function TasteQuizScreen() {
  const [step, setStep] = useState(0);
  const [reelPicks, setReelPicks] = useState(["Anime arcs", "Psych reels"]);
  const [reelText, setReelText] = useState("");
  const [character, setCharacter] = useState("Quiet overthinker");
  const [world, setWorld] = useState("Memory lane");
  const [plot, setPlot] = useState("A friendship saves them");

  function toggleValue(value: string, current: string[], setter: (next: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function goBack() {
    if (step === 0) router.back();
    else setStep((current) => current - 1);
  }

  function goNext() {
    if (step < 4) setStep((current) => current + 1);
    else {
      router.push({
        pathname: "/mood-mode",
        params: {
          answers: JSON.stringify({
            obsessions: reelPicks,
            character,
            world,
            plot,
          }),
        },
      } as never);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}>
        <TouchableOpacity activeOpacity={0.8} onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>{step === 0 ? "Back" : "Previous"}</Text>
        </TouchableOpacity>

        <View style={styles.centerWrap}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanLabel}>Taste scan</Text>
            <View style={styles.progressRow}>
              {[0, 1, 2, 3, 4].map((item) => (
                <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            {step === 0 ? (
              <View>
                <View style={styles.questionTopline}>
                  <Text style={styles.kicker}>From Reel to Read</Text>
                  <Text style={styles.stepCount}>01</Text>
                </View>
                <Text style={styles.title}>What have you been obsessed with lately?</Text>
                <Text style={styles.subtitle}>Think shows, reels, characters, sports, creators, or tropes.</Text>

                <View style={styles.reelGrid}>
                  {obsessionCards.map((item) => {
                    const isActive = reelPicks.includes(item.title);
                    return (
                      <TouchableOpacity
                        activeOpacity={0.86}
                        key={item.title}
                        onPress={() => toggleValue(item.title, reelPicks, setReelPicks)}
                        style={[styles.reelCard, isActive && styles.reelCardActive]}>
                        <View style={[styles.codePill, isActive && styles.codePillActive]}>
                          <Text style={[styles.codeText, isActive && styles.codeTextActive]}>{item.code}</Text>
                        </View>
                        <Text style={[styles.reelTitle, isActive && styles.reelTitleActive]}>{item.title}</Text>
                        <Text style={[styles.reelDetail, isActive && styles.reelDetailActive]}>{item.detail}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  placeholder="Add a show, creator, sport, or vibe"
                  placeholderTextColor="rgba(255,250,240,0.42)"
                  onChangeText={setReelText}
                  style={styles.input}
                  value={reelText}
                />

                <View style={styles.signalPanel}>
                  <View>
                    <Text style={styles.signalLabel}>Signal strength</Text>
                    <Text style={styles.signalText}>
                      {reelPicks.length} signals locked{reelText ? " + custom clue" : ""}
                    </Text>
                  </View>
                  <View style={styles.signalBars}>
                    {[0, 1, 2].map((item) => (
                      <View
                        key={item}
                        style={[styles.signalBar, item < Math.min(reelPicks.length, 3) && styles.signalBarActive]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {step === 1 ? (
              <View>
                <View style={styles.questionTopline}>
                <Text style={styles.kicker}>Character energy</Text>
                  <Text style={styles.stepCount}>02</Text>
                </View>
                <Text style={styles.title}>Who do you want to follow?</Text>
                <View style={styles.optionStack}>
                  {characterCards.map((item) => (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={item.title}
                      onPress={() => setCharacter(item.title)}
                      style={[styles.optionCard, character === item.title && styles.optionCardActive]}>
                      <Text style={[styles.optionText, character === item.title && styles.optionTextActive]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.optionDetail, character === item.title && styles.optionDetailActive]}>
                        {item.detail}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View>
                <View style={styles.questionTopline}>
                <Text style={styles.kicker}>World pick</Text>
                <Text style={styles.stepCount}>03</Text>
              </View>
                <Text style={styles.title}>Where should the book drop you?</Text>
                <Text style={styles.subtitle}>Setting tells us the flavor of your next binge.</Text>
                <View style={styles.optionStack}>
                  {worldCards.map((item) => (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={item.title}
                      onPress={() => setWorld(item.title)}
                      style={[styles.optionCard, world === item.title && styles.optionCardActive]}>
                      <Text style={[styles.optionText, world === item.title && styles.optionTextActive]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.optionDetail, world === item.title && styles.optionDetailActive]}>
                        {item.detail}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {step === 3 ? (
              <View>
                <View style={styles.questionTopline}>
                <Text style={styles.kicker}>Plot craving</Text>
                  <Text style={styles.stepCount}>04</Text>
                </View>
                <Text style={styles.title}>What should happen by chapter three?</Text>
                <Text style={styles.subtitle}>This helps us avoid slow starts and random recommendations.</Text>
                <View style={styles.optionStack}>
                  {plotCards.map((item) => (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={item.title}
                      onPress={() => setPlot(item.title)}
                      style={[styles.optionCard, plot === item.title && styles.optionCardActive]}>
                      <Text style={[styles.optionText, plot === item.title && styles.optionTextActive]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.optionDetail, plot === item.title && styles.optionDetailActive]}>
                        {item.detail}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.filterReceipt}>
                  <Text style={styles.signalLabel}>Binge filter</Text>
                  <Text style={styles.signalText}>
                    We will prioritize fast starts, clean language, and books that feel addictive early.
                  </Text>
                </View>
              </View>
            ) : null}

            {step === 4 ? (
              <View style={styles.resultWrap}>
                <Text style={styles.kicker}>Reader profile</Text>
                <Text style={styles.resultTitle}>Soft Thriller Binger</Text>
                <Text style={styles.subtitle}>
                  You want a {character.toLowerCase()}, a {world.toLowerCase()} setting, and a plot where
                  {` ${plot.toLowerCase()}`}.
                </Text>
                <View style={styles.profileTags}>
                  <Text style={styles.profileTag}>fast hooks</Text>
                  <Text style={styles.profileTag}>emotional payoff</Text>
                  <Text style={styles.profileTag}>short chapters</Text>
                </View>
                <View style={styles.brewCard}>
                  <View style={styles.brewLabelRow}>
                    <View style={styles.brewDot} />
                    <Text style={styles.brewLabel}>Taste profile ready</Text>
                  </View>
                  <Text style={styles.brewTitle}>Your book stack is about to brew.</Text>
                  <Text style={styles.brewCopy}>
                    Tap below, then hang tight while we turn these signals into fresh suggestions.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <TouchableOpacity activeOpacity={0.88} onPress={goNext} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{step === 4 ? "Build my deck" : "Continue"}</Text>
          </TouchableOpacity>
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
  scanHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  scanLabel: {
    color: "rgba(255,250,240,0.6)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  progressRow: {
    flexDirection: "row",
    gap: 7,
  },
  progressDot: {
    backgroundColor: "rgba(255,250,240,0.16)",
    borderRadius: 999,
    height: 6,
    width: 24,
  },
  progressDotActive: {
    backgroundColor: "#F1D99D",
  },
  card: {
    backgroundColor: "#102036",
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 30,
    borderWidth: 1,
    maxWidth: 318,
    minHeight: 454,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    width: "84%",
  },
  questionTopline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kicker: {
    color: "#F1D99D",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  stepCount: {
    color: "rgba(255,250,240,0.3)",
    fontSize: 12,
    fontWeight: "900",
  },
  title: {
    color: "#FFFAF0",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 31,
    marginTop: 11,
  },
  subtitle: {
    color: "rgba(255,250,240,0.66)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },
  reelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 19,
  },
  reelCard: {
    backgroundColor: "rgba(255,250,240,0.07)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 19,
    borderWidth: 1,
    minHeight: 96,
    padding: 11,
    width: "48%",
  },
  reelCardActive: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FFFAF0",
  },
  codePill: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.12)",
    borderRadius: 12,
    height: 28,
    justifyContent: "center",
    marginBottom: 10,
    width: 34,
  },
  codePillActive: {
    backgroundColor: "#F1D99D",
  },
  codeText: {
    color: "#FFFAF0",
    fontSize: 11,
    fontWeight: "900",
  },
  codeTextActive: {
    color: "#071323",
  },
  reelTitle: {
    color: "#FFFAF0",
    fontSize: 13,
    fontWeight: "900",
  },
  reelTitleActive: {
    color: "#071323",
  },
  reelDetail: {
    color: "rgba(255,250,240,0.54)",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 5,
  },
  reelDetailActive: {
    color: "rgba(7,19,35,0.62)",
  },
  input: {
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 17,
    borderWidth: 1,
    color: "#FFFAF0",
    fontSize: 13,
    marginTop: 13,
    minHeight: 43,
    paddingHorizontal: 13,
  },
  signalPanel: {
    alignItems: "center",
    backgroundColor: "rgba(7,19,35,0.5)",
    borderRadius: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 12,
  },
  signalLabel: {
    color: "#F1D99D",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  signalText: {
    color: "rgba(255,250,240,0.64)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  signalBars: {
    flexDirection: "row",
    gap: 5,
  },
  signalBar: {
    backgroundColor: "rgba(255,250,240,0.16)",
    borderRadius: 999,
    height: 28,
    width: 7,
  },
  signalBarActive: {
    backgroundColor: "#F1D99D",
  },
  optionStack: {
    gap: 10,
    marginTop: 24,
  },
  optionCard: {
    backgroundColor: "rgba(255,250,240,0.07)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 19,
    borderWidth: 1,
    minHeight: 66,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  optionCardActive: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FFFAF0",
  },
  optionText: {
    color: "#FFFAF0",
    fontSize: 16,
    fontWeight: "900",
  },
  optionTextActive: {
    color: "#071323",
  },
  optionDetail: {
    color: "rgba(255,250,240,0.58)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  optionDetailActive: {
    color: "rgba(7,19,35,0.62)",
  },
  avoidGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  avoidChip: {
    backgroundColor: "rgba(255,250,240,0.07)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  avoidChipActive: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FFFAF0",
  },
  avoidText: {
    color: "#FFFAF0",
    fontSize: 13,
    fontWeight: "900",
  },
  avoidTextActive: {
    color: "#071323",
  },
  filterReceipt: {
    backgroundColor: "rgba(216,173,85,0.13)",
    borderColor: "rgba(216,173,85,0.2)",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
    padding: 14,
  },
  resultWrap: {
    justifyContent: "center",
    minHeight: 414,
  },
  resultTitle: {
    color: "#FFFAF0",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 35,
    marginTop: 10,
  },
  profileTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  profileTag: {
    backgroundColor: "rgba(255,250,240,0.1)",
    borderRadius: 999,
    color: "#FFFAF0",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  brewCard: {
    backgroundColor: "#FFFAF0",
    borderRadius: 22,
    marginTop: 22,
    padding: 16,
  },
  brewLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  brewDot: {
    backgroundColor: "#D8AD55",
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  brewLabel: {
    color: "#D8AD55",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  brewTitle: {
    color: "#071323",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 8,
  },
  brewCopy: {
    color: "rgba(7,19,35,0.62)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 999,
    marginTop: 16,
    paddingVertical: 13,
    width: 198,
  },
  primaryButtonText: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
  },
});
