import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "@/components/AppBottomNav";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { useAppAppearance } from "@/services/appearance";
import { signOut } from "@/services/authService";
import { getProfile, isProfileComplete, saveProfile, type ReaderProfile } from "@/services/profile";
import { getReadingProgress, getSavedBooks, type ReadingProgress, type SavedBook } from "@/services/readingList";

type SocialIdentity = {
  handle: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: "discord" | "instagram" | "snapchat";
  label: string;
  url?: string;
};

const genreIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  BookTok: "phone-portrait-outline",
  Cozy: "cafe-outline",
  Fantasy: "sparkles-outline",
  Mystery: "search-outline",
  Psychology: "bulb-outline",
  Romance: "heart-outline",
  "Sci-fi": "planet-outline",
  YA: "school-outline",
};

export default function ProfileScreen() {
  const { colors, isDark, mode, setAppearanceMode } = useAppAppearance();
  const [profile, setProfile] = useState<ReaderProfile>();
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [progress, setProgress] = useState<ReadingProgress>({ completedSessions: 0, streak: 0, totalMinutes: 0, xp: 0 });

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadProfile() {
        const [readerProfile, books, readingProgress] = await Promise.all([
          getProfile(),
          getSavedBooks(),
          getReadingProgress(),
        ]);

        if (isMounted) {
          setProfile(readerProfile);
          setSavedBooks(books);
          setProgress(readingProgress);
        }
      }

      void loadProfile();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const completedBooks = savedBooks.filter((book) => book.status === "finished").length;
  const currentlyReading = savedBooks.filter((book) => book.status === "reading");
  const wantToRead = savedBooks.filter((book) => book.status === "want-to-read").length;
  const profileReady = profile ? isProfileComplete(profile) : false;
  const socialIdentities = useMemo(() => buildSocialIdentities(profile), [profile]);
  const sectionBackground = isDark ? "#FFFAF0" : colors.card;

  async function updateAvatar(avatarUri: string) {
    if (!profile) {
      return;
    }

    const nextProfile = await saveProfile({ ...profile, avatarUri });
    setProfile(nextProfile);
  }

  function openEditProfile() {
    router.push({ pathname: "/profile-setup", params: { returnTo: "profile" } } as never);
  }

  async function performSignOut() {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      Alert.alert("Could not sign out", error instanceof Error ? error.message : "Please try again.");
    }
  }

  function confirmSignOut() {
    if (Platform.OS === "web") {
      void performSignOut();
      return;
    }

    Alert.alert("Sign out of BingeBook?", "Your account will stay saved, but you will need to sign in again on this device.", [
      { style: "cancel", text: "Cancel" },
      { onPress: () => void performSignOut(), style: "destructive", text: "Sign out" },
    ]);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.brand, { color: colors.brand }]}>BingeBook</Text>
          <TouchableOpacity
            accessibilityLabel={profileReady ? "Edit profile" : "Set up profile"}
            accessibilityRole="button"
            activeOpacity={0.86}
            onPress={openEditProfile}
            style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#071323" />
            <Text style={styles.editButtonText}>{profileReady ? "Edit" : "Set up"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <ProfileAvatarPicker
            initials={getInitials(profile?.displayName ?? "")}
            onChange={updateAvatar}
            size={112}
            uri={profile?.avatarUri}
          />
          <Text style={styles.name}>{profile?.displayName || "Build your reader profile"}</Text>
          <Text style={styles.username}>{profile?.username ? `@${profile.username}` : "@your_reader_name"}</Text>

          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={openEditProfile}>
              <Text style={styles.emptyBio}>Add a line about your reading personality</Text>
            </TouchableOpacity>
          )}

          <View style={styles.profileMetaRow}>
            {profile?.pronouns ? <Text style={styles.metaChip}>{profile.pronouns}</Text> : null}
            {profile?.age ? <Text style={styles.metaChip}>{profile.age}</Text> : null}
            {profile?.city ? (
              <View style={styles.metaChipRow}>
                <Ionicons name="location" size={11} color="#FFFAF0" />
                <Text style={styles.metaChipText}>{profile.city}</Text>
              </View>
            ) : null}
            <Text style={styles.metaChip}>{profile?.readingLevel ?? "Beginner"}</Text>
          </View>

          {socialIdentities.length > 0 ? (
            <View style={styles.socialRow}>
              {socialIdentities.map((social) => (
                <TouchableOpacity
                  accessibilityLabel={`${social.label} ${social.handle}`}
                  accessibilityRole={social.url ? "link" : "text"}
                  activeOpacity={social.url ? 0.78 : 1}
                  disabled={!social.url}
                  key={social.id}
                  onPress={() => social.url && void Linking.openURL(social.url).catch(() => undefined)}
                  style={styles.socialChip}>
                  <Ionicons name={social.icon} size={15} color="#071323" />
                  <Text numberOfLines={1} style={styles.socialHandle}>@{social.handle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={openEditProfile} style={styles.addSocialButton}>
              <Ionicons name="add-circle-outline" size={16} color="#F1D99D" />
              <Text style={styles.addSocialText}>Add your social IDs</Text>
            </TouchableOpacity>
          )}

          <View style={styles.heroDivider} />
          <View style={styles.statsRow}>
            <ProfileStat label="Saved" value={savedBooks.length} />
            <View style={styles.statDivider} />
            <ProfileStat label="Finished" value={completedBooks} />
            <View style={styles.statDivider} />
            <ProfileStat label="Min read" value={progress.totalMinutes} />
            <View style={styles.statDivider} />
            <ProfileStat label="XP" value={progress.xp} />
          </View>
        </View>

        <View style={[styles.streakBanner, { backgroundColor: sectionBackground }]}>
          <View style={[styles.streakIcon, progress.streak > 0 && styles.streakIconActive]}>
            <Ionicons name="flame" size={24} color={progress.streak > 0 ? "#D8AD55" : "rgba(7,19,35,0.34)"} />
            <Text style={styles.streakNumber}>{progress.streak}</Text>
            <Text style={styles.streakUnit}>days</Text>
          </View>
          <View style={styles.streakCopy}>
            <Text style={styles.streakTitle}>
              {progress.streak > 0 ? `${progress.streak}-day reading streak` : "Start your reading streak"}
            </Text>
            <Text style={styles.streakDetail}>
              {progress.completedSessions} sessions completed · {progress.totalMinutes} min total
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Start ten minute reading session"
            activeOpacity={0.82}
            onPress={() => router.push("/reading-mode")}
            style={styles.streakAction}>
            <Ionicons name="play" size={17} color="#071323" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: sectionBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Currently reading</Text>
            <Text style={styles.countBadge}>{currentlyReading.length}</Text>
          </View>

          {currentlyReading.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.readingShelf}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {currentlyReading.map((book) => (
                <TouchableOpacity
                  activeOpacity={0.86}
                  key={book.id}
                  onPress={() =>
                    router.push({
                      pathname: "/book-detail",
                      params: { coverUrl: book.coverUrl, id: book.id, match: String(book.match) },
                    } as never)
                  }
                  style={styles.readingBook}>
                  {book.coverUrl ? (
                    <Image contentFit="cover" source={{ uri: book.coverUrl }} style={styles.readingCover} />
                  ) : (
                    <View style={styles.readingCoverFallback}>
                      <Text style={styles.readingCoverFallbackText}>{getInitials(book.title)}</Text>
                    </View>
                  )}
                  <Text numberOfLines={2} style={styles.readingTitle}>{book.title}</Text>
                  <Text numberOfLines={1} style={styles.readingAuthor}>{book.author}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity activeOpacity={0.84} onPress={() => router.push("/(tabs)/list" as never)} style={styles.emptyShelf}>
              <View style={styles.emptyShelfIcon}>
                <Ionicons name="book-outline" size={22} color="#071323" />
              </View>
              <View style={styles.emptyShelfCopy}>
                <Text style={styles.emptyShelfTitle}>No active read yet</Text>
                <Text style={styles.emptyShelfDetail}>Move a saved book to Reading to feature it here.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(7,19,35,0.38)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: sectionBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Taste DNA</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/taste-quiz")} style={styles.retuneButton}>
              <Text style={styles.retuneText}>Retune</Text>
              <Ionicons name="arrow-up-outline" size={13} color="#071323" style={styles.retuneArrow} />
            </TouchableOpacity>
          </View>
          <View style={styles.genreGrid}>
            {(profile?.favoriteGenres.length ? profile.favoriteGenres : ["Mystery", "Romance"]).map((genre) => (
              <View key={genre} style={styles.genreChip}>
                <Ionicons name={genreIcons[genre] ?? "book-outline"} size={15} color="#D8AD55" />
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => router.push("/(tabs)/list" as never)}
          style={[styles.section, { backgroundColor: sectionBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My shelf</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(7,19,35,0.4)" />
          </View>
          <View style={styles.shelfSummary}>
            <ShelfStat label="Want" value={wantToRead} />
            <View style={styles.shelfDivider} />
            <ShelfStat label="Reading" value={currentlyReading.length} />
            <View style={styles.shelfDivider} />
            <ShelfStat label="Finished" value={completedBooks} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.88} onPress={() => router.replace("/deck")} style={styles.discoverButton}>
          <Ionicons name="sparkles" size={18} color="#071323" />
          <Text style={styles.discoverButtonText}>Discover my next book</Text>
        </TouchableOpacity>

        <View style={[styles.appearanceSection, { backgroundColor: sectionBackground }]}>
          <View style={styles.appearanceIcon}>
            <Ionicons name={isDark ? "moon" : "sunny-outline"} size={18} color="#071323" />
          </View>
          <View style={styles.appearanceCopy}>
            <Text style={styles.appearanceTitle}>Dark theme</Text>
            <Text style={styles.appearanceDetail}>Keep BingeBook comfortable for your reading mood.</Text>
          </View>
          <Switch
            ios_backgroundColor="rgba(7,19,35,0.18)"
            onValueChange={(value) => void setAppearanceMode(value ? "dark" : "light")}
            thumbColor={mode === "dark" ? "#071323" : "#FFFFFF"}
            trackColor={{ false: "rgba(7,19,35,0.18)", true: "#F1D99D" }}
            value={mode === "dark"}
          />
        </View>

        <TouchableOpacity
          accessibilityLabel="Sign out of BingeBook"
          accessibilityRole="button"
          activeOpacity={0.82}
          onPress={confirmSignOut}
          style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={18} color="#B83D50" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <AppBottomNav active="profile" profileAvatarUri={profile?.avatarUri} />
    </SafeAreaView>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.profileStat}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.profileStatValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.profileStatLabel}>{label}</Text>
    </View>
  );
}

function ShelfStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.shelfStat}>
      <Text style={styles.shelfValue}>{value}</Text>
      <Text style={styles.shelfLabel}>{label}</Text>
    </View>
  );
}

function buildSocialIdentities(profile: ReaderProfile | undefined) {
  if (!profile) {
    return [];
  }

  const identities: SocialIdentity[] = [];

  if (profile.instagram) {
    identities.push({
      handle: profile.instagram,
      icon: "logo-instagram",
      id: "instagram",
      label: "Instagram",
      url: `https://instagram.com/${encodeURIComponent(profile.instagram)}`,
    });
  }

  if (profile.snapchat) {
    identities.push({
      handle: profile.snapchat,
      icon: "logo-snapchat",
      id: "snapchat",
      label: "Snapchat",
      url: `https://www.snapchat.com/add/${encodeURIComponent(profile.snapchat)}`,
    });
  }

  if (profile.discord) {
    identities.push({ handle: profile.discord, icon: "logo-discord", id: "discord", label: "Discord" });
  }

  return identities;
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
    flex: 1,
    paddingHorizontal: 14,
  },
  content: {
    alignItems: "center",
    paddingBottom: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 390,
    paddingBottom: 10,
    paddingTop: 12,
    width: "100%",
  },
  brand: {
    fontSize: 30,
    fontWeight: "900",
  },
  editButton: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  editButtonText: {
    color: "#071323",
    fontSize: 13,
    fontWeight: "900",
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "#111F31",
    borderColor: "rgba(241,217,157,0.24)",
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 390,
    paddingBottom: 17,
    paddingHorizontal: 16,
    paddingTop: 20,
    width: "100%",
  },
  name: {
    color: "#FFFAF0",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
    marginTop: 13,
    textAlign: "center",
  },
  username: {
    color: "rgba(255,250,240,0.54)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  bio: {
    color: "rgba(255,250,240,0.84)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    maxWidth: 310,
    textAlign: "center",
  },
  emptyBio: {
    color: "#F1D99D",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 11,
    textDecorationLine: "underline",
  },
  profileMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
    marginTop: 13,
  },
  metaChip: {
    backgroundColor: "rgba(255,250,240,0.1)",
    borderRadius: 999,
    color: "#FFFAF0",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaChipRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,250,240,0.1)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaChipText: {
    color: "#FFFAF0",
    fontSize: 11,
    fontWeight: "900",
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
    marginTop: 13,
  },
  socialChip: {
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    maxWidth: 150,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  socialHandle: {
    color: "#071323",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "900",
  },
  addSocialButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 13,
  },
  addSocialText: {
    color: "#F1D99D",
    fontSize: 12,
    fontWeight: "900",
  },
  heroDivider: {
    backgroundColor: "rgba(255,250,240,0.12)",
    height: 1,
    marginTop: 18,
    width: "100%",
  },
  statsRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 66,
    width: "100%",
  },
  profileStat: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  profileStatValue: {
    color: "#FFFAF0",
    fontSize: 22,
    fontWeight: "900",
  },
  profileStatLabel: {
    color: "rgba(255,250,240,0.48)",
    fontSize: 8,
    fontWeight: "900",
    marginTop: 3,
    textTransform: "uppercase",
  },
  statDivider: {
    backgroundColor: "rgba(255,250,240,0.16)",
    height: 36,
    width: 1,
  },
  streakBanner: {
    alignItems: "center",
    borderColor: "rgba(216,173,85,0.42)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    maxWidth: 390,
    padding: 13,
    width: "100%",
  },
  streakIcon: {
    alignItems: "center",
    backgroundColor: "rgba(7,19,35,0.06)",
    borderRadius: 12,
    height: 70,
    justifyContent: "center",
    width: 64,
  },
  streakIconActive: {
    backgroundColor: "rgba(216,173,85,0.14)",
  },
  streakNumber: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 17,
  },
  streakUnit: {
    color: "rgba(7,19,35,0.5)",
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  streakCopy: {
    flex: 1,
    minWidth: 0,
  },
  streakTitle: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
  },
  streakDetail: {
    color: "rgba(7,19,35,0.54)",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 4,
  },
  streakAction: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  section: {
    borderRadius: 18,
    marginTop: 12,
    maxWidth: 390,
    padding: 16,
    width: "100%",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#071323",
    fontSize: 20,
    fontWeight: "900",
  },
  countBadge: {
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readingShelf: {
    gap: 14,
    paddingRight: 6,
    paddingTop: 14,
  },
  readingBook: {
    width: 96,
  },
  readingCover: {
    borderRadius: 8,
    height: 140,
    width: 96,
  },
  readingCoverFallback: {
    alignItems: "center",
    backgroundColor: "#071323",
    borderRadius: 8,
    height: 140,
    justifyContent: "center",
    width: 96,
  },
  readingCoverFallbackText: {
    color: "#F1D99D",
    fontSize: 18,
    fontWeight: "900",
  },
  readingTitle: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 15,
    marginTop: 7,
  },
  readingAuthor: {
    color: "rgba(7,19,35,0.52)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  emptyShelf: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    marginTop: 13,
  },
  emptyShelfIcon: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  emptyShelfCopy: {
    flex: 1,
  },
  emptyShelfTitle: {
    color: "#071323",
    fontSize: 14,
    fontWeight: "900",
  },
  emptyShelfDetail: {
    color: "rgba(7,19,35,0.54)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  retuneButton: {
    alignItems: "center",
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  retuneText: {
    color: "#071323",
    fontSize: 11,
    fontWeight: "900",
  },
  retuneArrow: {
    transform: [{ rotate: "45deg" }],
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  genreChip: {
    alignItems: "center",
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  genreText: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
  },
  shelfSummary: {
    alignItems: "center",
    backgroundColor: "rgba(7,19,35,0.04)",
    borderRadius: 12,
    flexDirection: "row",
    marginTop: 13,
    minHeight: 72,
  },
  shelfStat: {
    alignItems: "center",
    flex: 1,
  },
  shelfValue: {
    color: "#071323",
    fontSize: 22,
    fontWeight: "900",
  },
  shelfLabel: {
    color: "rgba(7,19,35,0.5)",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 3,
    textTransform: "uppercase",
  },
  shelfDivider: {
    backgroundColor: "rgba(7,19,35,0.1)",
    height: 36,
    width: 1,
  },
  discoverButton: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 12,
    maxWidth: 390,
    minHeight: 52,
    width: "100%",
  },
  discoverButtonText: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
  },
  appearanceSection: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 11,
    marginTop: 12,
    maxWidth: 390,
    padding: 14,
    width: "100%",
  },
  appearanceIcon: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  appearanceCopy: {
    flex: 1,
  },
  appearanceTitle: {
    color: "#071323",
    fontSize: 14,
    fontWeight: "900",
  },
  appearanceDetail: {
    color: "rgba(7,19,35,0.52)",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  signOutButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 12,
    maxWidth: 390,
    minHeight: 46,
    width: "100%",
  },
  signOutText: {
    color: "#B83D50",
    fontSize: 13,
    fontWeight: "900",
  },
});
