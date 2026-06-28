import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { defaultProfile, getProfile, saveProfile, type ReaderProfile } from "@/services/profile";

const readingLevels = ["Beginner", "Casual", "Binge reader"];
const genreOptions = ["Mystery", "Romance", "Fantasy", "Psychology", "YA", "Cozy", "Sci-fi", "BookTok"];

export default function ProfileSetupScreen() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [profile, setProfile] = useState<ReaderProfile>(defaultProfile);
  const [statusMessage, setStatusMessage] = useState("Build your reader profile before the taste scan.");

  useEffect(() => {
    let isMounted = true;

    getProfile().then((savedProfile) => {
      if (isMounted) {
        setProfile(savedProfile);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateProfile(value: Partial<ReaderProfile>) {
    setProfile((currentProfile) => ({ ...currentProfile, ...value }));
  }

  async function updateAvatar(avatarUri: string) {
    const nextProfile = { ...profile, avatarUri };

    setProfile(nextProfile);
    await saveProfile(nextProfile);
  }

  function toggleGenre(genre: string) {
    const nextGenres = profile.favoriteGenres.includes(genre)
      ? profile.favoriteGenres.filter((item) => item !== genre)
      : [...profile.favoriteGenres, genre];

    updateProfile({ favoriteGenres: nextGenres });
  }

  async function continueFlow() {
    if (!profile.displayName.trim() || !profile.username.trim()) {
      setStatusMessage("Name and username are needed to continue.");
      return;
    }

    await saveProfile(profile);

    if (params.returnTo === "profile") {
      router.replace("/(tabs)/profile" as never);
      return;
    }

    router.replace("/taste-quiz");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity activeOpacity={0.82} onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.brand}>BingeBook</Text>
            <Text style={styles.title}>{params.returnTo === "profile" ? "Edit profile" : "Build your profile"}</Text>
            <Text style={styles.subtitle}>
              A few basics help us make the app feel personal before your book taste quiz.
            </Text>
          </View>

          <View style={styles.avatarCard}>
            <ProfileAvatarPicker
              initials={getInitials(profile.displayName)}
              onChange={updateAvatar}
              size={82}
              uri={profile.avatarUri}
            />
            <View style={styles.avatarCopy}>
              <Text style={styles.avatarTitle}>Your main photo</Text>
              <Text style={styles.avatarSubtitle}>Take a new photo or choose one from your gallery.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Basic info</Text>
            <TextInput
              onChangeText={(displayName) => updateProfile({ displayName })}
              placeholder="Name"
              placeholderTextColor="rgba(255,250,240,0.42)"
              style={styles.input}
              value={profile.displayName}
            />
            <TextInput
              autoCapitalize="none"
              onChangeText={(username) => updateProfile({ username })}
              placeholder="Username"
              placeholderTextColor="rgba(255,250,240,0.42)"
              style={styles.input}
              value={profile.username}
            />
            <View style={styles.splitRow}>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(age) => updateProfile({ age })}
                placeholder="Age"
                placeholderTextColor="rgba(255,250,240,0.42)"
                style={[styles.input, styles.splitInput]}
                value={profile.age}
              />
              <TextInput
                onChangeText={(pronouns) => updateProfile({ pronouns })}
                placeholder="Pronouns"
                placeholderTextColor="rgba(255,250,240,0.42)"
                style={[styles.input, styles.splitInput]}
                value={profile.pronouns}
              />
            </View>
            <TextInput
              onChangeText={(city) => updateProfile({ city })}
              placeholder="City"
              placeholderTextColor="rgba(255,250,240,0.42)"
              style={styles.input}
              value={profile.city}
            />
            <TextInput
              maxLength={180}
              multiline
              numberOfLines={4}
              onChangeText={(bio) => updateProfile({ bio })}
              placeholder="A short bio: what you read, love, or always recommend"
              placeholderTextColor="rgba(255,250,240,0.42)"
              style={[styles.input, styles.bioInput]}
              textAlignVertical="top"
              value={profile.bio}
            />
            <Text style={styles.characterCount}>{profile.bio?.length ?? 0}/180</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Social IDs</Text>
            <Text style={styles.cardHint}>Optional. Add only the accounts you want visible on your reader profile.</Text>
            <View style={styles.socialInputRow}>
              <Ionicons name="logo-instagram" size={20} color="#F1D99D" />
              <Text style={styles.handlePrefix}>@</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(instagram) => updateProfile({ instagram })}
                placeholder="Instagram"
                placeholderTextColor="rgba(255,250,240,0.42)"
                style={styles.socialInput}
                value={profile.instagram}
              />
            </View>
            <View style={styles.socialInputRow}>
              <Ionicons name="logo-snapchat" size={20} color="#F1D99D" />
              <Text style={styles.handlePrefix}>@</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(snapchat) => updateProfile({ snapchat })}
                placeholder="Snapchat"
                placeholderTextColor="rgba(255,250,240,0.42)"
                style={styles.socialInput}
                value={profile.snapchat}
              />
            </View>
            <View style={styles.socialInputRow}>
              <Ionicons name="logo-discord" size={20} color="#F1D99D" />
              <Text style={styles.handlePrefix}>@</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(discord) => updateProfile({ discord })}
                placeholder="Discord"
                placeholderTextColor="rgba(255,250,240,0.42)"
                style={styles.socialInput}
                value={profile.discord}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reader basics</Text>
            <View style={styles.segmentRow}>
              {readingLevels.map((level) => {
                const isActive = profile.readingLevel === level;

                return (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    key={level}
                    onPress={() => updateProfile({ readingLevel: level })}
                    style={[styles.segment, isActive && styles.segmentActive]}>
                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{level}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.smallLabel}>Weekly reading goal</Text>
            <View style={styles.goalRow}>
              {["2", "3", "5", "7"].map((goal) => {
                const isActive = profile.weeklyGoal === goal;

                return (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    key={goal}
                    onPress={() => updateProfile({ weeklyGoal: goal })}
                    style={[styles.goalChip, isActive && styles.goalChipActive]}>
                    <Text style={[styles.goalText, isActive && styles.goalTextActive]}>{goal} days</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Favorite shelves</Text>
            <View style={styles.genreGrid}>
              {genreOptions.map((genre) => {
                const isActive = profile.favoriteGenres.includes(genre);

                return (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    key={genre}
                    onPress={() => toggleGenre(genre)}
                    style={[styles.genreChip, isActive && styles.genreChipActive]}>
                    <Text style={[styles.genreText, isActive && styles.genreTextActive]}>{genre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.88} onPress={continueFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {params.returnTo === "profile" ? "Save profile" : "Continue to taste quiz"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#071323" />
          </TouchableOpacity>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "BB";
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#071323",
    flex: 1,
    paddingHorizontal: 18,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingBottom: 28,
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
  header: {
    alignItems: "center",
    marginTop: 18,
    maxWidth: 350,
  },
  brand: {
    color: "#F1D99D",
    fontSize: 14,
    fontWeight: "900",
  },
  title: {
    color: "#FFFAF0",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,250,240,0.64)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    textAlign: "center",
  },
  avatarCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.09)",
    borderColor: "rgba(255,250,240,0.13)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    marginTop: 22,
    maxWidth: 390,
    padding: 14,
    width: "100%",
  },
  avatarCopy: {
    flex: 1,
  },
  avatarTitle: {
    color: "#FFFAF0",
    fontSize: 17,
    fontWeight: "900",
  },
  avatarSubtitle: {
    color: "rgba(255,250,240,0.56)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  card: {
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.13)",
    borderRadius: 24,
    borderWidth: 1,
    gap: 9,
    marginTop: 13,
    maxWidth: 390,
    padding: 14,
    width: "100%",
  },
  sectionTitle: {
    color: "#F1D99D",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 17,
    borderWidth: 1,
    color: "#FFFAF0",
    fontSize: 14,
    fontWeight: "800",
    minHeight: 50,
    paddingHorizontal: 14,
    width: "100%",
  },
  bioInput: {
    minHeight: 96,
    paddingTop: 14,
  },
  characterCount: {
    alignSelf: "flex-end",
    color: "rgba(255,250,240,0.42)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: -3,
  },
  cardHint: {
    color: "rgba(255,250,240,0.54)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
    marginTop: -5,
  },
  socialInputRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 14,
  },
  handlePrefix: {
    color: "rgba(255,250,240,0.52)",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 10,
  },
  socialInput: {
    color: "#FFFAF0",
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    minHeight: 48,
    paddingHorizontal: 3,
  },
  splitRow: {
    flexDirection: "row",
    gap: 9,
  },
  splitInput: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.08)",
    borderRadius: 999,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#FFFAF0",
  },
  segmentText: {
    color: "#FFFAF0",
    fontSize: 11,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: "#071323",
  },
  smallLabel: {
    color: "rgba(255,250,240,0.58)",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 17,
  },
  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 9,
  },
  goalChip: {
    backgroundColor: "rgba(255,250,240,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  goalChipActive: {
    backgroundColor: "#F1D99D",
  },
  goalText: {
    color: "#FFFAF0",
    fontSize: 12,
    fontWeight: "900",
  },
  goalTextActive: {
    color: "#071323",
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreChip: {
    backgroundColor: "rgba(255,250,240,0.08)",
    borderColor: "rgba(255,250,240,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  genreChipActive: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FFFAF0",
  },
  genreText: {
    color: "#FFFAF0",
    fontSize: 12,
    fontWeight: "900",
  },
  genreTextActive: {
    color: "#071323",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 18,
    maxWidth: 300,
    paddingVertical: 15,
    width: "100%",
  },
  primaryButtonText: {
    color: "#071323",
    fontSize: 14,
    fontWeight: "900",
  },
  statusText: {
    color: "rgba(255,250,240,0.54)",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 12,
    maxWidth: 310,
    textAlign: "center",
  },
});
