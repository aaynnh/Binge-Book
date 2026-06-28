import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "@/components/AppBottomNav";
import { useAppAppearance } from "@/services/appearance";
import {
  getReadingProgress,
  getSavedBooks,
  rateSavedBook,
  updateSavedBookStatus,
  type ReadingProgress,
  type ReadingStatus,
  type SavedBook,
} from "@/services/readingList";

const statusFilters: { label: string; value: ReadingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Want", value: "want-to-read" },
  { label: "Reading", value: "reading" },
  { label: "Finished", value: "finished" },
];

const statusOptions: { label: string; value: ReadingStatus }[] = [
  { label: "Want", value: "want-to-read" },
  { label: "Reading", value: "reading" },
  { label: "Finished", value: "finished" },
  { label: "DNF", value: "dnf" },
];

export default function ReadingListScreen() {
  const { colors, isDark } = useAppAppearance();
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [progress, setProgress] = useState<ReadingProgress>({ completedSessions: 0, streak: 0, totalMinutes: 0, xp: 0 });
  const [activeFilter, setActiveFilter] = useState<ReadingStatus | "all">("all");
  const themeStyles = useMemo(() => createThemeStyles(colors, isDark), [colors, isDark]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadSavedBooks() {
        const [books, readingProgress] = await Promise.all([getSavedBooks(), getReadingProgress()]);

        if (isMounted) {
          setSavedBooks(books);
          setProgress(readingProgress);
        }
      }

      loadSavedBooks();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const visibleBooks =
    activeFilter === "all" ? savedBooks : savedBooks.filter((book) => book.status === activeFilter);

  async function setStatus(bookId: string, status: ReadingStatus) {
    const nextBooks = await updateSavedBookStatus(bookId, status);
    setSavedBooks(nextBooks);
  }

  async function setRating(bookId: string, rating: number) {
    const nextBooks = await rateSavedBook(bookId, rating);
    setSavedBooks(nextBooks);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Text style={styles.brand}>BingeBook</Text>
        <Text style={[styles.title, { color: colors.text }]}>My List</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{savedBooks.length} saved for later</Text>
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

      <View style={styles.filterRow}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            activeOpacity={0.82}
            key={filter.value}
            onPress={() => setActiveFilter(filter.value)}
            style={[styles.filterChip, themeStyles.filterChip, activeFilter === filter.value && themeStyles.filterChipActive]}>
            <Text style={[styles.filterText, themeStyles.filterText, activeFilter === filter.value && themeStyles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {savedBooks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={44} color="#D8AD55" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved books yet</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>Swipe right or tap the tick on a book to save it here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {visibleBooks.map((book) => (
            <TouchableOpacity
              activeOpacity={0.9}
              key={book.id}
              onPress={() =>
                router.push({
                  pathname: "/book-detail",
                  params: {
                    coverUrl: book.coverUrl,
                    id: book.id,
                    match: String(book.match),
                  },
                } as never)
              }
              style={styles.bookCard}>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={(event) => {
                  event.stopPropagation();
                  router.push({
                    pathname: "/reading-mode",
                    params: { id: book.id, title: book.title },
                  } as never);
                }}
                style={styles.timerButton}>
                <Ionicons name="timer-outline" size={16} color="#071323" />
              </TouchableOpacity>
              <View style={styles.cardTop}>
                <View style={styles.coverFrame}>
                  {book.coverUrl ? (
                    <Image cachePolicy="memory-disk" contentFit="cover" source={{ uri: book.coverUrl }} style={styles.cover} />
                  ) : (
                    <View style={styles.coverFallback}>
                      <Text style={styles.coverFallbackText}>BB</Text>
                    </View>
                  )}
                </View>
                <View style={styles.bookInfo}>
                  <View style={styles.matchPill}>
                    <Text style={styles.matchText}>{book.match}% match</Text>
                  </View>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.author}>by {book.author}</Text>
                  <View style={styles.tagRow}>
                    {book.tags.slice(0, 2).map((tag) => (
                      <Text key={tag} style={styles.tag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.statusRow}>
                {statusOptions.map((option) => {
                  const isActive = book.status === option.value;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={option.value}
                      onPress={(event) => {
                        event.stopPropagation();
                        setStatus(book.id, option.value);
                      }}
                      style={[styles.statusChip, isActive && styles.statusChipActive]}>
                      <Text style={[styles.statusText, isActive && styles.statusTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    key={rating}
                    onPress={(event) => {
                      event.stopPropagation();
                      setRating(book.id, rating);
                    }}>
                    <Ionicons
                      name={(book.rating ?? 0) >= rating ? "star" : "star-outline"}
                      size={20}
                      color="#D8AD55"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <AppBottomNav active="list" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFFAF0",
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignSelf: "center",
    maxWidth: 390,
    paddingBottom: 18,
    paddingTop: 14,
    width: "100%",
  },
  brand: {
    color: "#D8AD55",
    fontSize: 14,
    fontWeight: "900",
  },
  title: {
    color: "#071323",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 43,
    marginTop: 6,
  },
  subtitle: {
    color: "rgba(7,19,35,0.58)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  statsRow: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
    maxWidth: 390,
    width: "100%",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(7,19,35,0.08)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statValue: {
    color: "#071323",
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(7,19,35,0.54)",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
    textTransform: "uppercase",
  },
  filterRow: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 13,
    maxWidth: 390,
    width: "100%",
  },
  filterChip: {
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#071323",
  },
  filterText: {
    color: "#071323",
    fontSize: 11,
    fontWeight: "900",
  },
  filterTextActive: {
    color: "#FFFAF0",
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyTitle: {
    color: "#071323",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 16,
  },
  emptyCopy: {
    color: "rgba(7,19,35,0.58)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 260,
    textAlign: "center",
  },
  listContent: {
    alignItems: "center",
    gap: 14,
    paddingBottom: 16,
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(7,19,35,0.08)",
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    position: "relative",
    shadowColor: "#071323",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    maxWidth: 390,
    width: "100%",
  },
  cardTop: {
    flexDirection: "row",
    gap: 14,
  },
  timerButton: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 34,
    zIndex: 4,
  },
  coverFrame: {
    backgroundColor: "#071323",
    borderRadius: 16,
    height: 138,
    overflow: "hidden",
    width: 92,
  },
  cover: {
    height: "100%",
    width: "100%",
  },
  coverFallback: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  coverFallbackText: {
    color: "#F1D99D",
    fontSize: 18,
    fontWeight: "900",
  },
  bookInfo: {
    flex: 1,
    justifyContent: "center",
  },
  matchPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(216,173,85,0.2)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  matchText: {
    color: "#A87928",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bookTitle: {
    color: "#071323",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 8,
  },
  author: {
    color: "rgba(7,19,35,0.58)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  tag: {
    backgroundColor: "rgba(7,19,35,0.06)",
    borderRadius: 999,
    color: "#071323",
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  statusChip: {
    backgroundColor: "rgba(7,19,35,0.06)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusChipActive: {
    backgroundColor: "#071323",
  },
  statusText: {
    color: "#071323",
    fontSize: 10,
    fontWeight: "900",
  },
  statusTextActive: {
    color: "#FFFAF0",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 7,
  },
});

function createThemeStyles(colors: ReturnType<typeof useAppAppearance>["colors"], isDark: boolean) {
  return StyleSheet.create({
    filterChip: {
      backgroundColor: colors.chip,
    },
    filterChipActive: {
      backgroundColor: isDark ? colors.accent : colors.primary,
    },
    filterText: {
      color: isDark ? colors.text : colors.primary,
    },
    filterTextActive: {
      color: isDark ? colors.accentText : "#FFFAF0",
    },
  });
}
