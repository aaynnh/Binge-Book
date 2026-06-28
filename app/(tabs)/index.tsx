import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.topGlow} />

      <View style={styles.topBrand}>
        <View style={styles.logoMark}>
          <View style={styles.logoPageLeft} />
          <View style={styles.logoPageRight} />
        </View>
        <Text style={styles.brandName}>BingeBook</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.bookStack}>
          <View style={styles.backBook} />
          <View style={styles.bookToken}>
            <Text style={styles.tokenLabel}>94% match</Text>
            <Text style={styles.tokenTitle}>The Midnight Library</Text>
            <View style={styles.tokenLine} />
          </View>
        </View>

        <Text style={styles.title}>Find books that match your vibe.</Text>
        <Text style={styles.subtitle}>Swipe less. Read more.</Text>
      </View>

      <View style={styles.bottomPanel}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/create-account")}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/sign-in")}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to BingeBook Terms and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071323",
    overflow: "hidden",
    paddingHorizontal: 26,
  },
  topGlow: {
    backgroundColor: "rgba(216,173,85,0.12)",
    borderRadius: 180,
    height: 280,
    left: 46,
    position: "absolute",
    top: -170,
    width: 280,
  },
  topBrand: {
    alignItems: "center",
    gap: 10,
    paddingTop: 16,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 18,
    flexDirection: "row",
    height: 54,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    width: 54,
  },
  logoPageLeft: {
    backgroundColor: "#0B1F3A",
    borderRadius: 6,
    height: 27,
    marginRight: 3,
    transform: [{ skewY: "-9deg" }],
    width: 11,
  },
  logoPageRight: {
    backgroundColor: "#173C69",
    borderRadius: 6,
    height: 27,
    transform: [{ skewY: "9deg" }],
    width: 11,
  },
  brandName: {
    color: "#FFFAF0",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 0,
  },
  hero: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 6,
  },
  bookStack: {
    alignItems: "center",
    height: 190,
    justifyContent: "center",
    marginBottom: 18,
    position: "relative",
    width: 220,
  },
  backBook: {
    backgroundColor: "rgba(159,208,238,0.18)",
    borderColor: "rgba(159,208,238,0.2)",
    borderRadius: 24,
    borderWidth: 1,
    height: 138,
    position: "absolute",
    transform: [{ rotate: "6deg" }],
    width: 132,
  },
  bookToken: {
    alignItems: "flex-start",
    backgroundColor: "#FFFAF0",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    transform: [{ rotate: "-3deg" }],
    width: 166,
  },
  tokenLabel: {
    color: "#D8AD55",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 11,
    textTransform: "uppercase",
  },
  tokenTitle: {
    color: "#0B1F3A",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 23,
  },
  tokenLine: {
    backgroundColor: "rgba(11,31,58,0.16)",
    borderRadius: 999,
    height: 6,
    marginTop: 16,
    width: 96,
  },
  title: {
    color: "#FFFAF0",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 42,
    maxWidth: 318,
    textAlign: "center",
  },
  subtitle: {
    color: "#F1D99D",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 13,
    textAlign: "center",
  },
  bottomPanel: {
    alignItems: "center",
    paddingBottom: 18,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 999,
    paddingVertical: 14,
    shadowColor: "#D8AD55",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    width: 250,
  },
  primaryButtonText: {
    color: "#0B1F3A",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.1)",
    borderColor: "rgba(255,250,240,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 14,
    width: 250,
  },
  secondaryButtonText: {
    color: "#FFFAF0",
    fontSize: 15,
    fontWeight: "900",
  },
  terms: {
    color: "rgba(255,250,240,0.55)",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 18,
    paddingHorizontal: 18,
    textAlign: "center",
  },
});
