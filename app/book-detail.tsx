import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "@/components/AppBottomNav";
import { curatedBooks } from "@/data/curatedBooks";
import { useAppAppearance } from "@/services/appearance";
import { findBookDescription, searchOpenLibrary, type OpenLibraryBook } from "@/services/booksApi";
import {
  getSavedBooks,
  rateSavedBook,
  saveBookToReadingList,
  updateSavedBookStatus,
  type ReadingStatus,
  type SavedBook,
} from "@/services/readingList";
import type { RecommendedBook } from "@/utils/recommendations";

const statusOptions: { label: string; value: ReadingStatus }[] = [
  { label: "Want", value: "want-to-read" },
  { label: "Reading", value: "reading" },
  { label: "Finished", value: "finished" },
  { label: "DNF", value: "dnf" },
];

export default function BookDetailScreen() {
  const { colors, isDark } = useAppAppearance();
  const params = useLocalSearchParams<{ coverUrl?: string; id?: string; match?: string }>();
  const book = useMemo(() => curatedBooks.find((item) => item.id === params.id) ?? curatedBooks[0], [params.id]);
  const [metadata, setMetadata] = useState<OpenLibraryBook | undefined>();
  const [savedBook, setSavedBook] = useState<SavedBook | undefined>();
  const coverUrl = params.coverUrl ?? book.fallbackCoverUrl ?? metadata?.coverUrl;
  const match = Number(params.match ?? savedBook?.match ?? 88);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      const [books, openLibraryResults, description] = await Promise.all([
        getSavedBooks(),
        searchOpenLibrary(book.query).catch(() => []),
        findBookDescription(book).catch(() => ({})),
      ]);

      if (isMounted) {
        setSavedBook(books.find((item) => item.id === book.id));
        setMetadata({ ...(openLibraryResults[0] ?? {}), ...description } as OpenLibraryBook);
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [book]);

  async function saveBook() {
    const nextBooks = await saveBookToReadingList({ ...book, match, matchedTags: book.tags.slice(0, 3) }, coverUrl);
    setSavedBook(nextBooks.find((item) => item.id === book.id));
  }

  async function changeStatus(status: ReadingStatus) {
    if (!savedBook) {
      await saveBook();
    }

    const nextBooks = await updateSavedBookStatus(book.id, status);
    setSavedBook(nextBooks.find((item) => item.id === book.id));
  }

  async function setRating(rating: number) {
    if (!savedBook) {
      await saveBook();
    }

    const nextBooks = await rateSavedBook(book.id, rating);
    setSavedBook(nextBooks.find((item) => item.id === book.id));
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.82} onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.brand, { color: colors.brand }]}>BingeBook</Text>
        <TouchableOpacity activeOpacity={0.82} onPress={saveBook} style={styles.headerIcon}>
          <Ionicons name={savedBook ? "bookmark" : "bookmark-outline"} size={23} color="#F1D99D" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.coverFrame}>
            {coverUrl ? (
              <Image cachePolicy="memory-disk" contentFit="cover" source={{ uri: coverUrl }} style={styles.cover} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>BB</Text>
              </View>
            )}
          </View>
          <View style={styles.heroText}>
            <Text style={styles.match}>{match}% match</Text>
            <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
            <Text style={[styles.author, { color: colors.mutedText }]}>by {metadata?.author ?? book.author}</Text>
            {metadata?.year ? <Text style={[styles.year, { color: colors.mutedText }]}>First published {metadata.year}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.copy}>{metadata?.description ?? book.synopsis}</Text>
          <Text style={styles.sourceText}>
            Synopsis source: {metadata?.descriptionSource ?? "BingeBook curated fallback"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading status</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((option) => {
              const isActive = (savedBook?.status ?? "want-to-read") === option.value;

              return (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={option.value}
                  onPress={() => changeStatus(option.value)}
                  style={[styles.statusChip, isActive && styles.statusChipActive]}>
                  <Text style={[styles.statusText, isActive && styles.statusTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity activeOpacity={0.8} key={rating} onPress={() => setRating(rating)}>
                <Ionicons
                  name={(savedBook?.rating ?? 0) >= rating ? "star" : "star-outline"}
                  size={25}
                  color="#D8AD55"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() =>
            router.push({
              pathname: "/reading-mode",
              params: { id: book.id, title: book.title },
            } as never)
          }
          style={styles.readingModeButton}>
          <Ionicons name="timer-outline" size={20} color="#071323" />
          <Text style={styles.readingModeText}>Start 10-minute reading mode</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where to read in India</Text>
          <View style={styles.linkGrid}>
            {buildReadLinks(book).map((link) => (
              <TouchableOpacity
                activeOpacity={0.82}
                key={link.label}
                onPress={() => void Linking.openURL(link.url).catch(() => undefined)}
                style={styles.readLink}>
                <Ionicons name={link.icon} size={16} color="#071323" />
                <Text style={styles.readLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why this fits</Text>
          <View style={styles.tagRow}>
            {book.tags.slice(0, 8).map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <AppBottomNav active="list" />
    </SafeAreaView>
  );
}

function buildReadLinks(book: Pick<RecommendedBook, "author" | "title">) {
  const query = encodeURIComponent(`${book.title} ${book.author}`);

  return [
    { icon: "bag-outline" as const, label: "Amazon IN", url: `https://www.amazon.in/s?k=${query}&i=stripbooks` },
    { icon: "logo-google" as const, label: "Google Books IN", url: `https://books.google.co.in/books?q=${query}&hl=en&gl=IN` },
    { icon: "cart-outline" as const, label: "Flipkart", url: `https://www.flipkart.com/search?q=${query}` },
    { icon: "storefront-outline" as const, label: "Bookswagon", url: `https://www.bookswagon.com/search-books/${query}` },
    { icon: "library-outline" as const, label: "Open Library", url: `https://openlibrary.org/search?q=${query}` },
    { icon: "book-outline" as const, label: "Goodreads", url: `https://www.goodreads.com/search?q=${query}` },
  ];
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#071323",
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerIcon: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  brand: {
    color: "#FFFAF0",
    fontSize: 25,
    fontWeight: "900",
  },
  content: {
    alignItems: "center",
    gap: 14,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    maxWidth: 390,
    width: "100%",
  },
  coverFrame: {
    aspectRatio: 0.68,
    backgroundColor: "#FFFAF0",
    borderRadius: 20,
    overflow: "hidden",
    width: 128,
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
    color: "#D8AD55",
    fontSize: 22,
    fontWeight: "900",
  },
  heroText: {
    flex: 1,
  },
  match: {
    color: "#F1D99D",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFAF0",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 33,
    marginTop: 8,
  },
  author: {
    color: "rgba(255,250,240,0.78)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
  year: {
    color: "rgba(255,250,240,0.54)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#FFFAF0",
    borderRadius: 22,
    maxWidth: 390,
    padding: 17,
    width: "100%",
  },
  sectionTitle: {
    color: "#071323",
    fontSize: 19,
    fontWeight: "900",
  },
  copy: {
    color: "rgba(7,19,35,0.72)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  sourceText: {
    color: "rgba(7,19,35,0.42)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  statusChip: {
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusChipActive: {
    backgroundColor: "#071323",
  },
  statusText: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
  },
  statusTextActive: {
    color: "#FFFAF0",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  readingModeButton: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    maxWidth: 390,
    paddingVertical: 15,
    width: "100%",
  },
  readingModeText: {
    color: "#071323",
    fontSize: 14,
    fontWeight: "900",
  },
  linkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 14,
  },
  readLink: {
    alignItems: "center",
    backgroundColor: "rgba(241,217,157,0.58)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  readLinkText: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  tag: {
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    color: "#071323",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
});
