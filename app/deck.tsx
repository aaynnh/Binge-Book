import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "@/components/AppBottomNav";
import { LoadingBookAnimation } from "@/components/LoadingBookAnimation";
import { useAppAppearance } from "@/services/appearance";
import { findBookDescription, searchOpenLibrary, type OpenLibraryBook } from "@/services/booksApi";
import { saveBookToReadingList } from "@/services/readingList";
import { getHiddenBookIds, recordBookSwipe, type SwipeAction } from "@/services/swipeHistory";
import { getRecommendations, type QuizAnswers, type RecommendedBook } from "@/utils/recommendations";

const defaultAnswers: QuizAnswers = {
  obsessions: ["Anime arcs", "Psych reels"],
  character: "Quiet overthinker",
  mood: "Easy 10-min read",
  world: "Memory lane",
  plot: "A friendship saves them",
};

const maxDeckSize = 2000;
const preloadWindowSize = 8;
const warmCoverLimit = 80;
const deckBuiltKey = "bingebook.deckBuilt.v1";
const discoverFiltersKey = "bingebook.discoverFilters.v1";
const metadataTimeout = 3600;
const coverPreloadTimeout = 2600;
const initialDeckLoadingTime = 5000;
const swipeThreshold = 105;
const upSwipeThreshold = -115;
const screenSize = Dimensions.get("window");

type BookMetadata = Record<string, OpenLibraryBook | undefined>;
type SwipeDirection = "left" | "right" | "up";
type DiscoverFilters = {
  genres: string[];
  mood: string;
  pace: string;
};
type FilterOption = {
  label: string;
  tags: string[];
  value: string;
};
type ReadLink = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
};

const defaultDiscoverFilters: DiscoverFilters = {
  genres: [],
  mood: "any",
  pace: "any",
};

const genreFilterOptions: FilterOption[] = [
  { label: "Romance", value: "romance", tags: ["Romantic", "Romance drama", "Hopeless romantic", "Two people collide"] },
  { label: "Mystery", value: "mystery", tags: ["Thrilling", "Crime docs", "A mystery unfolds", "Cold detective"] },
  { label: "Fantasy", value: "fantasy", tags: ["magic systems", "Anime arcs", "found family"] },
  { label: "Contemporary", value: "contemporary", tags: ["real-life brain", "campus tension", "Quiet overthinker"] },
  { label: "Cozy", value: "cozy", tags: ["Cozy", "witty comfort", "Easy snack"] },
  { label: "Young adult", value: "young-adult", tags: ["YA"] },
];

const moodFilterOptions: FilterOption[] = [
  { label: "Anything", value: "any", tags: [] },
  { label: "Feel-good", value: "feel-good", tags: ["Cozy", "witty comfort", "Easy snack"] },
  { label: "Emotional", value: "emotional", tags: ["Emotional", "soft ache"] },
  { label: "Suspenseful", value: "suspenseful", tags: ["Thrilling", "Crime docs", "A mystery unfolds"] },
  { label: "Romantic", value: "romantic", tags: ["Romantic", "Romance drama", "Two people collide"] },
  { label: "Magical", value: "magical", tags: ["magic systems", "Anime arcs"] },
];

const paceFilterOptions: FilterOption[] = [
  { label: "Any pace", value: "any", tags: [] },
  { label: "Quick hooks", value: "quick", tags: ["fast hooks", "short chapters", "Easy snack"] },
  { label: "Slow burn", value: "slow", tags: ["soft ache", "real-life brain", "dark academia"] },
];

export default function DeckScreen() {
  const { colors, isDark, setAppearanceMode } = useAppAppearance();
  const params = useLocalSearchParams<{ answers?: string; skipInitialLoading?: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [metadata, setMetadata] = useState<BookMetadata>({});
  const [isDeckReady, setIsDeckReady] = useState(false);
  const [isFiltersReady, setIsFiltersReady] = useState(false);
  const [isSwipeHistoryReady, setIsSwipeHistoryReady] = useState(false);
  const [hiddenBookIds, setHiddenBookIds] = useState<Set<string>>(new Set());
  const [showSuperlikeAnimation, setShowSuperlikeAnimation] = useState(false);
  const [isCoverFlipped, setIsCoverFlipped] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(defaultDiscoverFilters);
  const [draftFilters, setDraftFilters] = useState<DiscoverFilters>(defaultDiscoverFilters);
  const [toast, setToast] = useState("Fresh suggestions, brewed from your quiz");

  const answers = useMemo(() => parseAnswers(params.answers), [params.answers]);
  const recommendations = useMemo(() => diversifyTopRecommendations(getRecommendations(answers)), [answers]);
  const discoverableBooks = useMemo(
    () => recommendations.filter((book) => !hiddenBookIds.has(book.id)),
    [hiddenBookIds, recommendations]
  );
  const deckBooks = useMemo(() => {
    if (!isSwipeHistoryReady || !isFiltersReady) {
      return [];
    }

    return discoverableBooks.filter((book) => matchesDiscoverFilters(book, filters)).slice(0, maxDeckSize);
  }, [discoverableBooks, filters, isFiltersReady, isSwipeHistoryReady]);
  const draftResultCount = useMemo(
    () => discoverableBooks.filter((book) => matchesDiscoverFilters(book, draftFilters)).length,
    [discoverableBooks, draftFilters]
  );
  const activeFilterCount = filters.genres.length + (filters.mood === "any" ? 0 : 1) + (filters.pace === "any" ? 0 : 1);
  const activeBook = deckBooks[currentIndex];
  const activeMeta = activeBook ? metadata[activeBook.id] : undefined;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const flipProgress = useRef(new Animated.Value(0)).current;

  const cardAnimatedStyle = {
    opacity: translateX.interpolate({
      extrapolate: "clamp" as const,
      inputRange: [-360, 0, 360],
      outputRange: [0.86, 1, 0.86],
    }),
    transform: [
      { translateX },
      { translateY },
      {
        rotateZ: translateX.interpolate({
          inputRange: [-screenSize.width, 0, screenSize.width],
          outputRange: ["-14deg", "0deg", "14deg"],
        }),
      },
      {
        scale: translateX.interpolate({
          extrapolate: "clamp" as const,
          inputRange: [-240, 0, 240],
          outputRange: [0.96, 1, 0.96],
        }),
      },
    ],
  };

  const saveBadgeStyle = {
    opacity: translateX.interpolate({
      extrapolate: "clamp" as const,
      inputRange: [30, swipeThreshold],
      outputRange: [0, 1],
    }),
    transform: [{ rotateZ: "-10deg" }],
  };

  const rejectBadgeStyle = {
    opacity: translateX.interpolate({
      extrapolate: "clamp" as const,
      inputRange: [-swipeThreshold, -30],
      outputRange: [1, 0],
    }),
    transform: [{ rotateZ: "10deg" }],
  };

  const superBadgeStyle = {
    opacity: translateY.interpolate({
      extrapolate: "clamp" as const,
      inputRange: [upSwipeThreshold, -30],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateY: translateY.interpolate({
          extrapolate: "clamp" as const,
          inputRange: [upSwipeThreshold, 0],
          outputRange: [0, 18],
        }),
      },
    ],
  };

  const frontCoverStyle = {
    opacity: flipProgress.interpolate({
      inputRange: [0, 0.48, 0.52, 1],
      outputRange: [1, 1, 0, 0],
    }),
    transform: [
      { perspective: 900 },
      { rotateY: flipProgress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
    ],
  };

  const backCoverStyle = {
    opacity: flipProgress.interpolate({
      inputRange: [0, 0.48, 0.52, 1],
      outputRange: [0, 0, 1, 1],
    }),
    transform: [
      { perspective: 900 },
      { rotateY: flipProgress.interpolate({ inputRange: [0, 1], outputRange: ["-180deg", "0deg"] }) },
    ],
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSwipeHistory() {
      const hiddenIds = await getHiddenBookIds();

      if (isMounted) {
        setHiddenBookIds(hiddenIds);
        setIsSwipeHistoryReady(true);
      }
    }

    loadSwipeHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDiscoverFilters() {
      const savedFilters = await AsyncStorage.getItem(discoverFiltersKey);
      const nextFilters = parseDiscoverFilters(savedFilters);

      if (isMounted) {
        setFilters(nextFilters);
        setDraftFilters(nextFilters);
        setIsFiltersReady(true);
      }
    }

    loadDiscoverFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMetadata() {
      if (!isSwipeHistoryReady) {
        return;
      }

      const shouldSkipInitialLoading = params.skipInitialLoading === "1";
      const hasBuiltDeckBefore = shouldSkipInitialLoading || (await AsyncStorage.getItem(deckBuiltKey)) === "true";

      if (!isMounted) {
        return;
      }

      setCurrentIndex(0);

      if (deckBooks.length === 0) {
        setMetadata({});
        setIsDeckReady(true);
        return;
      }

      if (hasBuiltDeckBefore) {
        setIsDeckReady(true);
      } else {
        setIsDeckReady(false);
      }

      const minimumLoadingTime = hasBuiltDeckBefore ? Promise.resolve() : wait(initialDeckLoadingTime);
      const starterBooks = deckBooks.slice(0, preloadWindowSize);

      const entries = await Promise.all(starterBooks.map(resolveBookMetadataWithTimeout));
      const nextMetadata = Object.fromEntries(entries);
      const coverUrls = starterBooks
        .map((book) => book.fallbackCoverUrl ?? nextMetadata[book.id]?.coverUrl)
        .filter((coverUrl): coverUrl is string => Boolean(coverUrl));

      await Promise.all([minimumLoadingTime, preloadCoversWithTimeout(coverUrls)]);

      if (isMounted) {
        setMetadata(nextMetadata);
        setIsDeckReady(true);
        await AsyncStorage.setItem(deckBuiltKey, "true");
      }
    }

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [deckBooks, isSwipeHistoryReady, params.skipInitialLoading]);

  useEffect(() => {
    if (!isDeckReady) {
      return;
    }

    let isCancelled = false;
    const fallbackCoverUrls = deckBooks
      .map((book) => book.fallbackCoverUrl)
      .filter((coverUrl): coverUrl is string => Boolean(coverUrl));
    const warmCoverUrls = fallbackCoverUrls.slice(preloadWindowSize, warmCoverLimit);

    async function warmFullCoverDeck() {
      for (let index = 0; index < warmCoverUrls.length; index += preloadWindowSize) {
        if (isCancelled) {
          return;
        }

        await preloadCoversWithTimeout(warmCoverUrls.slice(index, index + preloadWindowSize));
      }
    }

    warmFullCoverDeck();

    return () => {
      isCancelled = true;
    };
  }, [deckBooks, isDeckReady]);

  useEffect(() => {
    if (!isDeckReady) {
      return;
    }

    let isMounted = true;
    const upcomingBooks = deckBooks
      .slice(currentIndex, currentIndex + preloadWindowSize)
      .filter((book) => !(book.id in metadata));

    async function loadUpcomingBooks() {
      if (upcomingBooks.length === 0) {
        return;
      }

      const entries = await Promise.all(upcomingBooks.map(resolveBookMetadataWithTimeout));
      const nextMetadata = Object.fromEntries(entries);
      const coverUrls = upcomingBooks
        .map((book) => book.fallbackCoverUrl ?? nextMetadata[book.id]?.coverUrl)
        .filter((coverUrl): coverUrl is string => Boolean(coverUrl));

      await preloadCoversWithTimeout(coverUrls);

      if (isMounted) {
        setMetadata((currentMetadata) => ({ ...currentMetadata, ...nextMetadata }));
      }
    }

    loadUpcomingBooks();

    return () => {
      isMounted = false;
    };
  }, [currentIndex, deckBooks, isDeckReady, metadata]);

  useEffect(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    flipProgress.setValue(0);
    setIsCoverFlipped(false);
  }, [currentIndex, flipProgress, translateX, translateY]);

  function nextBook(message: string) {
    setToast(message);
    setCurrentIndex((current) => Math.min(current + 1, deckBooks.length));
  }

  function toggleCoverFlip() {
    const nextValue = isCoverFlipped ? 0 : 1;

    setIsCoverFlipped(!isCoverFlipped);
    Animated.timing(flipProgress, {
      duration: 420,
      toValue: nextValue,
      useNativeDriver: true,
    }).start();
  }

  function finishSwipe(direction: SwipeDirection) {
    const messages = {
      left: "Skipped. Tuning your taste.",
      right: "Saved to your future reading list.",
      up: "Superliked. We will find more like this.",
    };

    translateX.setValue(0);
    translateY.setValue(0);

    if (direction === "right") {
      saveActiveBook(messages.right);
      return;
    }

    if (direction === "up") {
      playSuperlikeAnimation();
      return;
    }

    rememberSwipe("skipped");
    nextBook(messages[direction]);
  }

  async function saveActiveBook(message = "Saved to your future reading list.") {
    if (!activeBook) {
      return;
    }

    try {
      await saveBookToReadingList(activeBook, coverUrl);
      await recordBookSwipe(activeBook.id, "saved");
      nextBook(message);
    } catch {
      setToast("Could not save this book. Try again.");
    }
  }

  function playSuperlikeAnimation() {
    rememberSwipe("superliked");
    setShowSuperlikeAnimation(true);
    setToast("Superliked. Finding more books with this vibe.");
    springCardBack();

    setTimeout(() => {
      setShowSuperlikeAnimation(false);
      nextBook("Superlike saved to your taste profile.");
    }, 3000);
  }

  function rememberSwipe(action: SwipeAction) {
    if (!activeBook) {
      return;
    }

    recordBookSwipe(activeBook.id, action).catch(() => undefined);
  }

  function animateSwipe(direction: SwipeDirection) {
    if (showSuperlikeAnimation) {
      return;
    }

    if (direction === "left") {
      animateCardOffscreen(-screenSize.width * 1.15, 24, "left");
      return;
    }

    if (direction === "right") {
      animateCardOffscreen(screenSize.width * 1.15, 24, "right");
      return;
    }

    playSuperlikeAnimation();
  }

  function animateCardOffscreen(x: number, y: number, direction: SwipeDirection) {
    Animated.parallel([
      Animated.timing(translateX, { duration: 220, toValue: x, useNativeDriver: true }),
      Animated.timing(translateY, { duration: 220, toValue: y, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        finishSwipe(direction);
      }
    });
  }

  function springCardBack(onComplete?: () => void) {
    Animated.parallel([
      Animated.spring(translateX, { damping: 16, stiffness: 170, toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { damping: 16, stiffness: 170, toValue: 0, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) =>
      Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderMove: (_event, gesture) => {
      translateX.setValue(gesture.dx);
      translateY.setValue(0);
    },
    onPanResponderRelease: (_event, gesture) => {
      const isRightSwipe = gesture.dx > swipeThreshold || gesture.vx > 0.85;
      const isLeftSwipe = gesture.dx < -swipeThreshold || gesture.vx < -0.85;

      if (isRightSwipe) {
        animateCardOffscreen(screenSize.width * 1.15, 0, "right");
        return;
      }

      if (isLeftSwipe) {
        animateCardOffscreen(-screenSize.width * 1.15, 0, "left");
        return;
      }

      springCardBack();
    },
    onPanResponderTerminate: () => springCardBack(),
  });

  const coverUrl = activeBook ? activeBook.fallbackCoverUrl ?? activeMeta?.coverUrl : undefined;
  const headerIconColor = isDark ? "#FFFAF0" : "#111723";
  const themeToggleLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  function openDiscoverFilters() {
    setDraftFilters(filters);
    setIsFilterOpen(true);
  }

  function toggleGenreFilter(value: string) {
    setDraftFilters((current) => ({
      ...current,
      genres: current.genres.includes(value)
        ? current.genres.filter((genre) => genre !== value)
        : [...current.genres, value],
    }));
  }

  async function applyDiscoverFilters() {
    setFilters(draftFilters);
    setCurrentIndex(0);
    setToast(activeFilterCountFor(draftFilters) > 0 ? "Discovery preferences applied." : "Showing your full personalized deck.");
    setIsFilterOpen(false);
    await AsyncStorage.setItem(discoverFiltersKey, JSON.stringify(draftFilters));
  }

  function renderFilterChip(option: FilterOption, selected: boolean, onPress: () => void) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected }}
        activeOpacity={0.82}
        key={option.value}
        onPress={onPress}
        style={[
          styles.filterChip,
          {
            backgroundColor: selected ? colors.accent : colors.chip,
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}>
        {selected ? <Ionicons name="checkmark" size={15} color="#071323" /> : null}
        <Text style={[styles.filterChipText, { color: selected ? "#071323" : colors.text }]}>{option.label}</Text>
      </TouchableOpacity>
    );
  }

  function renderFilterModal() {
    return (
      <Modal
        animationType="slide"
        onRequestClose={() => setIsFilterOpen(false)}
        statusBarTranslucent
        transparent
        visible={isFilterOpen}>
        <View style={styles.filterOverlay}>
          <Pressable
            accessibilityLabel="Close Discover filters"
            accessibilityRole="button"
            onPress={() => setIsFilterOpen(false)}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.filterSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.filterHandle, { backgroundColor: colors.border }]} />
            <View style={styles.filterSheetHeader}>
              <View>
                <Text style={[styles.filterSheetTitle, { color: colors.text }]}>Discovery settings</Text>
                <Text style={[styles.filterSheetSubtitle, { color: colors.mutedText }]}>Choose the books you want in your deck.</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Close filters"
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() => setIsFilterOpen(false)}
                style={[styles.filterCloseButton, { backgroundColor: colors.chip }]}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.filterScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Genres</Text>
                <Text style={[styles.filterSectionHint, { color: colors.mutedText }]}>Pick as many as you like</Text>
                <View style={styles.filterChipRow}>
                  {genreFilterOptions.map((option) =>
                    renderFilterChip(option, draftFilters.genres.includes(option.value), () => toggleGenreFilter(option.value))
                  )}
                </View>
              </View>

              <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Current mood</Text>
                <View style={styles.filterChipRow}>
                  {moodFilterOptions.map((option) =>
                    renderFilterChip(option, draftFilters.mood === option.value, () =>
                      setDraftFilters((current) => ({ ...current, mood: option.value }))
                    )
                  )}
                </View>
              </View>

              <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Reading pace</Text>
                <View style={styles.filterChipRow}>
                  {paceFilterOptions.map((option) =>
                    renderFilterChip(option, draftFilters.pace === option.value, () =>
                      setDraftFilters((current) => ({ ...current, pace: option.value }))
                    )
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.filterFooter, { borderTopColor: colors.border }]}>
              <View>
                <Text style={[styles.filterResultCount, { color: colors.text }]}>{draftResultCount.toLocaleString()} books fit</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.8}
                  onPress={() => setDraftFilters(defaultDiscoverFilters)}>
                  <Text style={[styles.filterResetText, { color: colors.mutedText }]}>Reset all</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.86}
                disabled={draftResultCount === 0}
                onPress={() => void applyDiscoverFilters()}
                style={[styles.filterApplyButton, draftResultCount === 0 && styles.filterApplyButtonDisabled]}>
                <Text style={styles.filterApplyButtonText}>Show books</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFAF0" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderThemeSwitch() {
    return (
      <TouchableOpacity
        accessibilityLabel={themeToggleLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: isDark }}
        activeOpacity={0.82}
        onPress={() => {
          void setAppearanceMode(isDark ? "light" : "dark");
        }}
        style={styles.themeToggle}>
        <View
          style={[
            styles.themeSwitchTrack,
            {
              backgroundColor: isDark ? colors.accent : "rgba(7,19,35,0.08)",
              borderColor: isDark ? colors.accent : "rgba(7,19,35,0.13)",
            },
          ]}>
          <View style={[styles.themeSwitchKnob, isDark && styles.themeSwitchKnobActive]}>
            <Ionicons name={isDark ? "moon" : "sunny-outline"} size={13} color="#071323" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderFilterButton() {
    return (
      <TouchableOpacity
        accessibilityLabel="Open Discover filters"
        accessibilityRole="button"
        activeOpacity={0.82}
        onPress={openDiscoverFilters}
        style={[
          styles.filterButton,
          {
            backgroundColor: isDark ? "rgba(255,250,240,0.1)" : "rgba(7,19,35,0.06)",
            borderColor: isDark ? "rgba(255,250,240,0.16)" : "rgba(7,19,35,0.1)",
          },
        ]}>
        <Ionicons name="options-outline" size={22} color={headerIconColor} />
        {activeFilterCount > 0 ? (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {!isSwipeHistoryReady || !isFiltersReady || !isDeckReady ? (
        <View style={styles.loadingPage}>
          <Text style={[styles.loadingBrand, { color: colors.text }]}>BingeBook</Text>
          <LoadingBookAnimation />
          <Text style={[styles.loadingTitle, { color: colors.text }]}>Brewing your suggestions</Text>
          <Text style={[styles.loadingCopy, { color: colors.mutedText }]}>Hang tight while we blend your taste into a fresh stack.</Text>
        </View>
      ) : !activeBook ? (
        <>
          <View style={styles.header}>
            {renderFilterButton()}
            <Text style={[styles.headerBrand, { color: colors.text }]}>BingeBook</Text>
            {renderThemeSwitch()}
          </View>

          <View style={styles.caughtUpPage}>
            <View style={styles.caughtUpIcon}>
              <Ionicons name="sparkles" size={34} color="#071323" />
            </View>
            <Text style={[styles.caughtUpTitle, { color: colors.text }]}>
              {discoverableBooks.length > 0 ? "No matches yet." : "You’re caught up."}
            </Text>
            <Text style={[styles.caughtUpCopy, { color: colors.mutedText }]}> 
              {discoverableBooks.length > 0
                ? "Try widening your Discovery settings to bring more books into your deck."
                : "We have hidden the books you skipped, saved, or superliked for now, so Discover stays fresh."}
            </Text>
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={discoverableBooks.length > 0 ? openDiscoverFilters : () => router.push("/taste-quiz" as never)}
              style={styles.caughtUpButton}>
              <Text style={styles.caughtUpButtonText}>
                {discoverableBooks.length > 0 ? "Adjust filters" : "Retune my taste"}
              </Text>
            </TouchableOpacity>
          </View>

          <AppBottomNav active="discover" />
        </>
      ) : (
        <>
          <View style={styles.header}>
            {renderFilterButton()}
            <Text style={[styles.headerBrand, { color: colors.text }]}>BingeBook</Text>
            {renderThemeSwitch()}
          </View>

          <View style={styles.cardFrame}>
            <Animated.View {...panResponder.panHandlers} style={[styles.cardShell, cardAnimatedStyle]}>
              {coverUrl ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={{ uri: coverUrl }}
                  style={styles.cardBackdrop}
                  transition={120}
                />
              ) : (
                <View style={styles.cardBackdropFallback} />
              )}
              {coverUrl ? (
                <Image
                  blurRadius={24}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={{ uri: coverUrl }}
                  style={styles.blurLayer}
                />
              ) : null}
              <View style={styles.cardTint} />
              <Animated.View style={[styles.swipeBadge, styles.saveBadge, saveBadgeStyle]}>
                <Text style={styles.saveBadgeText}>SAVE</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeBadge, styles.rejectBadge, rejectBadgeStyle]}>
                <Text style={styles.rejectBadgeText}>SKIP</Text>
              </Animated.View>
              <Animated.View style={[styles.superBadge, superBadgeStyle]}>
                <Ionicons name="star" size={18} color="#071323" />
                <Text style={styles.superBadgeText}>SUPERLIKE</Text>
              </Animated.View>

              <ScrollView
                contentContainerStyle={styles.profileContent}
                showsVerticalScrollIndicator={false}
                style={styles.profileScroll}>
                <View style={styles.profileHero}>
                  <View style={styles.topCardRow}>
                    <View style={styles.matchPill}>
                      <Ionicons name="sparkles" size={13} color="#071323" />
                      <Text style={styles.matchText}>{activeBook.match}% match</Text>
                    </View>
                  </View>

                  <View style={styles.posterStage}>
                    <Pressable
                      accessibilityLabel={`Flip ${activeBook.title} cover`}
                      accessibilityRole="button"
                      onPress={toggleCoverFlip}
                      style={styles.posterShadow}>
                      <Animated.View style={[styles.posterFace, frontCoverStyle]}>
                        {coverUrl ? (
                          <Image
                            cachePolicy="memory-disk"
                            contentFit="cover"
                            source={{ uri: coverUrl }}
                            style={styles.posterImage}
                            transition={120}
                          />
                        ) : (
                          <View style={styles.coverFallback}>
                            <Text style={styles.coverFallbackText}>BB</Text>
                          </View>
                        )}
                        <View style={styles.flipHint}>
                          <Ionicons name="sync" size={12} color="#071323" />
                          <Text style={styles.flipHintText}>Tap to flip</Text>
                        </View>
                      </Animated.View>

                      <Animated.View style={[styles.posterFace, styles.posterBack, backCoverStyle]}>
                        <View style={styles.posterBackInner}>
                          <Text style={styles.backCoverLabel}>Back cover</Text>
                          <Text numberOfLines={3} style={styles.backCoverTitle}>
                            {activeBook.title}
                          </Text>
                          <Text style={styles.backCoverAuthor}>{activeBook.author}</Text>
                          <View style={styles.backCoverRule} />
                          <Text style={styles.backCoverSynopsis}>{buildSynopsis(activeBook, activeMeta)}</Text>
                          <View style={styles.backCoverChips}>
                            {activeBook.matchedTags.slice(0, 2).map((tag) => (
                              <Text key={tag} style={styles.backCoverChip}>
                                {tag}
                              </Text>
                            ))}
                          </View>
                          <Text style={styles.backCoverHint}>Tap again for front cover</Text>
                        </View>
                      </Animated.View>
                    </Pressable>
                  </View>

                  <View style={styles.heroInfoPanel}>
                    <View style={styles.verifiedRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#F1D99D" />
                      <Text style={styles.verifiedText}>Taste verified</Text>
                    </View>

                    <Text style={styles.bookTitle}>{activeBook.title}</Text>
                    <Text style={styles.author}>by {activeMeta?.author ?? activeBook.author}</Text>
                    {activeMeta?.year ? <Text style={styles.year}>First published {activeMeta.year}</Text> : null}

                    <View style={styles.tagRow}>
                      {activeBook.matchedTags.slice(0, 3).map((tag) => (
                        <Text key={tag} style={styles.tag}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.whiteSection}>
                  <Text style={styles.sectionTitle}>Synopsis</Text>
                  <Text style={styles.sectionCopy}>{buildSynopsis(activeBook, activeMeta)}</Text>
                  <Text style={styles.sourceText}>{buildSynopsisSource(activeMeta)}</Text>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    onPress={() =>
                      router.push({
                        pathname: "/book-detail",
                        params: {
                          coverUrl,
                          id: activeBook.id,
                          match: String(activeBook.match),
                        },
                      } as never)
                    }
                    style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>Open book page</Text>
                    <Ionicons name="chevron-forward" size={15} color="#071323" />
                  </TouchableOpacity>
                </View>

                <View style={styles.whiteSection}>
                  <Text style={styles.sectionTitle}>Book profile</Text>
                  <View style={styles.lightChipGrid}>
                    {buildBookProfile(activeBook, activeMeta).map((fact) => (
                      <Text key={fact} style={styles.lightChip}>
                        {fact}
                      </Text>
                    ))}
                  </View>
                </View>

                <View style={styles.whiteSection}>
                  <Text style={styles.sectionTitle}>Why this matches you</Text>
                  <Text style={styles.sectionCopy}>{buildWhyLine(activeBook)}</Text>
                  <View style={styles.lightChipGrid}>
                    {activeBook.tags.slice(0, 5).map((tag) => (
                      <Text key={tag} style={styles.lightChip}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>

                <View style={styles.whiteSection}>
                  <Text style={styles.sectionTitle}>Where to read</Text>
                  <View style={styles.readLinks}>
                    {buildReadLinks(activeBook).map((link) => (
                      <TouchableOpacity
                        activeOpacity={0.82}
                        key={link.label}
                        onPress={() => {
                          void Linking.openURL(link.url).catch(() => setToast("Could not open that reading link."));
                        }}
                        style={styles.readLinkButton}>
                        <Ionicons name={link.icon} size={15} color="#071323" />
                        <Text style={styles.readLinkText}>{link.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.whiteSection}>
                  <Text style={styles.sectionTitle}>Starter prompt</Text>
                  <Text style={styles.sectionCopy}>
                    Save this if you want a book that feels like {activeBook.tags.slice(0, 2).join(" and ")}.
                  </Text>
                </View>

                <View style={styles.bottomSpacer} />
              </ScrollView>
            </Animated.View>

            {showSuperlikeAnimation ? (
              <View pointerEvents="none" style={styles.superlikeOverlay}>
                <View style={styles.superlikeGlow}>
                  <Ionicons name="star" size={54} color="#071323" />
                </View>
                <Text style={styles.superlikeTitle}>Superlike</Text>
                <Text style={styles.superlikeCopy}>Training your book taste profile</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.86}
                disabled={showSuperlikeAnimation}
                onPress={() => animateSwipe("left")}
                style={[styles.smallAction, showSuperlikeAnimation && styles.actionDisabled]}>
                <Ionicons name="close" size={30} color="#F05F75" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.86}
                disabled={showSuperlikeAnimation}
                onPress={() => animateSwipe("up")}
                style={[styles.smallAction, showSuperlikeAnimation && styles.actionDisabled]}>
                <Ionicons name="star" size={27} color="#9FD0EE" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.86}
                disabled={showSuperlikeAnimation}
                onPress={() => animateSwipe("right")}
                style={[styles.saveAction, showSuperlikeAnimation && styles.actionDisabled]}>
                <Ionicons name="checkmark" size={36} color="#071323" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.toast, { color: colors.mutedText }]}>{toast}</Text>

          <AppBottomNav active="discover" />
        </>
      )}
      {renderFilterModal()}
    </SafeAreaView>
  );
}

function wait(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

async function resolveBookMetadata(book: RecommendedBook) {
  try {
    const results = await searchOpenLibrary(book.query);
    const description = await findBookDescription(book);
    const metadata = results[0] ?? {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.fallbackCoverUrl,
    };

    return [book.id, { ...metadata, ...description }] as const;
  } catch {
    return [book.id, undefined] as const;
  }
}

function resolveBookMetadataWithTimeout(book: RecommendedBook) {
  return withTimeout(resolveBookMetadata(book), metadataTimeout, [
    book.id,
    {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.fallbackCoverUrl,
    },
  ] as const);
}

function preloadCovers(coverUrls: string[]) {
  if (coverUrls.length === 0) {
    return Promise.resolve(false);
  }

  return Image.prefetch(coverUrls, "memory-disk").catch(() => false);
}

function preloadCoversWithTimeout(coverUrls: string[]) {
  return withTimeout(preloadCovers(coverUrls), coverPreloadTimeout, false);
}

function withTimeout<T>(promise: Promise<T>, duration: number, fallback: T) {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), duration);

    promise
      .then((result) => resolve(result))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timer));
  });
}

function parseAnswers(rawAnswers: string | string[] | undefined): QuizAnswers {
  const raw = Array.isArray(rawAnswers) ? rawAnswers[0] : rawAnswers;

  if (!raw) {
    return defaultAnswers;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuizAnswers>;

      return {
        obsessions: Array.isArray(parsed.obsessions) ? parsed.obsessions : defaultAnswers.obsessions,
        character: parsed.character ?? defaultAnswers.character,
        mood: parsed.mood ?? defaultAnswers.mood,
        world: parsed.world ?? defaultAnswers.world,
        plot: parsed.plot ?? defaultAnswers.plot,
      };
  } catch {
    return defaultAnswers;
  }
}

function parseDiscoverFilters(rawFilters: string | null): DiscoverFilters {
  if (!rawFilters) {
    return defaultDiscoverFilters;
  }

  try {
    const parsed = JSON.parse(rawFilters) as Partial<DiscoverFilters>;
    const validGenres = new Set(genreFilterOptions.map((option) => option.value));
    const validMoods = new Set(moodFilterOptions.map((option) => option.value));
    const validPaces = new Set(paceFilterOptions.map((option) => option.value));

    return {
      genres: Array.isArray(parsed.genres) ? parsed.genres.filter((genre) => validGenres.has(genre)) : [],
      mood: parsed.mood && validMoods.has(parsed.mood) ? parsed.mood : "any",
      pace: parsed.pace && validPaces.has(parsed.pace) ? parsed.pace : "any",
    };
  } catch {
    return defaultDiscoverFilters;
  }
}

function diversifyTopRecommendations(books: RecommendedBook[]) {
  if (books.length < 2) {
    return books;
  }

  const topScore = books[0].match;
  const topBooks = books.filter((book) => book.match === topScore);

  if (topBooks.length < 2) {
    return books;
  }

  const shuffledTopBooks = [...topBooks];

  for (let index = shuffledTopBooks.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledTopBooks[index], shuffledTopBooks[swapIndex]] = [shuffledTopBooks[swapIndex], shuffledTopBooks[index]];
  }

  if (shuffledTopBooks[0].id === books[0].id) {
    [shuffledTopBooks[0], shuffledTopBooks[1]] = [shuffledTopBooks[1], shuffledTopBooks[0]];
  }

  const topBookIds = new Set(topBooks.map((book) => book.id));
  return [...shuffledTopBooks, ...books.filter((book) => !topBookIds.has(book.id))];
}

function matchesDiscoverFilters(book: RecommendedBook, filters: DiscoverFilters) {
  const matchesGenres =
    filters.genres.length === 0 ||
    filters.genres.some((genre) => matchesFilterOption(book, genreFilterOptions, genre));
  const matchesMood = filters.mood === "any" || matchesFilterOption(book, moodFilterOptions, filters.mood);
  const matchesPace = filters.pace === "any" || matchesFilterOption(book, paceFilterOptions, filters.pace);

  return matchesGenres && matchesMood && matchesPace;
}

function matchesFilterOption(book: RecommendedBook, options: FilterOption[], value: string) {
  const option = options.find((candidate) => candidate.value === value);
  return option ? option.tags.some((tag) => book.tags.includes(tag)) : true;
}

function activeFilterCountFor(filters: DiscoverFilters) {
  return filters.genres.length + (filters.mood === "any" ? 0 : 1) + (filters.pace === "any" ? 0 : 1);
}

function buildWhyLine(book: RecommendedBook) {
  const tags = book.matchedTags.slice(0, 2).join(" + ");

  if (!tags) {
    return "A real book from the curated BingeBook catalog, ranked for beginner-friendly discovery.";
  }

  return `Recommended because it matches ${tags} from your quiz.`;
}

function buildSynopsis(book: RecommendedBook, meta?: OpenLibraryBook) {
  if (meta?.description) {
    return meta.description;
  }

  if (book.synopsis) {
    return book.synopsis;
  }

  const mood = book.matchedTags[0] ?? book.tags[0] ?? "your current vibe";
  const hook = book.tags.includes("A mystery unfolds")
    ? "A question pulls you in early, then keeps tightening with every chapter."
    : book.tags.includes("Two people collide")
      ? "Two lives cross at exactly the wrong time, which is usually when the best stories start."
      : book.tags.includes("A life gets reset")
        ? "A second chance forces the main character to look at the life they thought they understood."
        : "A character-driven story builds around emotion, choice, and the kind of moments that stay with you.";

  return `${book.title} is matched to your ${mood} taste profile. ${hook} It is a strong pick if you want a book that feels personal without making reading feel like homework.`;
}

function buildSynopsisSource(meta?: OpenLibraryBook) {
  if (meta?.descriptionSource) {
    return `Synopsis source: ${meta.descriptionSource}`;
  }

  return "Synopsis source: BingeBook curated fallback";
}

function buildBookProfile(book: RecommendedBook, meta: OpenLibraryBook | undefined) {
  const facts = [`${book.match}% match`, meta?.year ? `${meta.year}` : "real book"];

  if (book.tags.includes("Easy snack")) facts.push("beginner friendly");
  if (book.tags.includes("fast hooks")) facts.push("fast hook");
  if (book.tags.includes("short chapters")) facts.push("short chapters");
  if (book.tags.includes("Thrilling")) facts.push("high suspense");
  if (book.tags.includes("Cozy")) facts.push("cozy read");
  if (book.tags.includes("Emotional")) facts.push("emotional");

  return facts.slice(0, 7);
}

function buildReadLinks(book: RecommendedBook): ReadLink[] {
  const query = encodeURIComponent(`${book.title} ${book.author}`);

  return [
    {
      icon: "bag-outline",
      label: "Amazon IN",
      url: `https://www.amazon.in/s?k=${query}&i=stripbooks`,
    },
    {
      icon: "logo-google",
      label: "Google Books IN",
      url: `https://books.google.co.in/books?q=${query}&hl=en&gl=IN`,
    },
    {
      icon: "cart-outline",
      label: "Flipkart",
      url: `https://www.flipkart.com/search?q=${query}`,
    },
    {
      icon: "storefront-outline",
      label: "Bookswagon",
      url: `https://www.bookswagon.com/search-books/${query}`,
    },
    {
      icon: "library-outline",
      label: "Open Library",
      url: `https://openlibrary.org/search?q=${query}`,
    },
    {
      icon: "book-outline",
      label: "Goodreads",
      url: `https://www.goodreads.com/search?q=${query}`,
    },
  ];
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFAF0",
    paddingHorizontal: 14,
  },
  loadingPage: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 42,
  },
  loadingBrand: {
    color: "#071323",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 20,
  },
  loadingTitle: {
    color: "#071323",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
    marginTop: 22,
    textAlign: "center",
  },
  loadingCopy: {
    color: "rgba(7,19,35,0.62)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 270,
    textAlign: "center",
  },
  caughtUpPage: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 78,
    paddingHorizontal: 24,
  },
  caughtUpIcon: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 78,
    justifyContent: "center",
    marginBottom: 22,
    shadowColor: "#D7B05E",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    width: 78,
  },
  caughtUpTitle: {
    color: "#071323",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 39,
    textAlign: "center",
  },
  caughtUpCopy: {
    color: "rgba(7,19,35,0.62)",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 310,
    textAlign: "center",
  },
  caughtUpButton: {
    backgroundColor: "#071323",
    borderRadius: 999,
    marginTop: 26,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  caughtUpButtonText: {
    color: "#FFFAF0",
    fontSize: 14,
    fontWeight: "900",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingBottom: 12,
    paddingTop: 10,
    position: "relative",
  },
  headerBrand: {
    color: "#111723",
    fontSize: 36,
    fontWeight: "900",
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
  },
  filterButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    position: "relative",
    width: 38,
    zIndex: 2,
  },
  filterBadge: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderColor: "#FFFAF0",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 17,
    justifyContent: "center",
    position: "absolute",
    right: -5,
    top: -5,
    width: 17,
  },
  filterBadgeText: {
    color: "#071323",
    fontSize: 9,
    fontWeight: "900",
  },
  themeToggle: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
    zIndex: 2,
  },
  themeSwitchTrack: {
    borderRadius: 999,
    borderWidth: 1,
    height: 27,
    justifyContent: "center",
    paddingHorizontal: 2,
    width: 42,
  },
  themeSwitchKnob: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 21,
    justifyContent: "center",
    shadowColor: "#071323",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    width: 21,
  },
  themeSwitchKnobActive: {
    transform: [{ translateX: 15 }],
  },
  filterOverlay: {
    backgroundColor: "rgba(0,0,0,0.52)",
    flex: 1,
    justifyContent: "flex-end",
  },
  filterSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    minHeight: "72%",
    overflow: "hidden",
    paddingTop: 10,
  },
  filterHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 42,
  },
  filterSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  filterSheetTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
  },
  filterSheetSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  filterCloseButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  filterScrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  filterSection: {
    paddingVertical: 5,
  },
  filterSectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  filterSectionHint: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "800",
  },
  filterDivider: {
    height: 1,
    marginVertical: 18,
  },
  filterFooter: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  filterResultCount: {
    fontSize: 15,
    fontWeight: "900",
  },
  filterResetText: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  filterApplyButton: {
    alignItems: "center",
    backgroundColor: "#071323",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 154,
    paddingHorizontal: 20,
  },
  filterApplyButtonDisabled: {
    opacity: 0.38,
  },
  filterApplyButtonText: {
    color: "#FFFAF0",
    fontSize: 14,
    fontWeight: "900",
  },
  cardFrame: {
    flex: 1,
    marginBottom: 10,
    position: "relative",
  },
  cardShell: {
    backgroundColor: "#071323",
    borderRadius: 26,
    flex: 1,
    overflow: "hidden",
  },
  cardBackdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },
  cardBackdropFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#071323",
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.75,
    transform: [{ scale: 1.08 }],
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,19,35,0.26)",
  },
  profileScroll: {
    flex: 1,
    zIndex: 2,
  },
  profileContent: {
    paddingBottom: 118,
  },
  profileHero: {
    minHeight: 590,
  },
  swipeBadge: {
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: "absolute",
    top: 74,
    zIndex: 8,
  },
  saveBadge: {
    borderColor: "#F1D99D",
    left: 24,
  },
  rejectBadge: {
    borderColor: "#F05F75",
    right: 24,
  },
  saveBadgeText: {
    color: "#F1D99D",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0,
  },
  rejectBadgeText: {
    color: "#F05F75",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0,
  },
  superBadge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: "absolute",
    top: 72,
    zIndex: 9,
  },
  superBadgeText: {
    color: "#071323",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  topCardRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    zIndex: 3,
  },
  matchPill: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchText: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  posterStage: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 360,
    paddingBottom: 78,
    paddingHorizontal: 34,
    paddingTop: 20,
  },
  posterShadow: {
    aspectRatio: 0.68,
    backgroundColor: "#FFFAF0",
    borderRadius: 26,
    elevation: 14,
    maxHeight: 350,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    width: "72%",
  },
  posterFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: "hidden",
  },
  posterImage: {
    height: "100%",
    width: "100%",
  },
  flipHint: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,250,240,0.9)",
    borderRadius: 999,
    bottom: 12,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
  },
  flipHintText: {
    color: "#071323",
    fontSize: 10,
    fontWeight: "900",
  },
  posterBack: {
    backgroundColor: "#FFFAF0",
  },
  posterBackInner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 19,
  },
  backCoverLabel: {
    color: "#B58B34",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  backCoverTitle: {
    color: "#071323",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 8,
  },
  backCoverAuthor: {
    color: "rgba(7,19,35,0.58)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  backCoverRule: {
    backgroundColor: "rgba(7,19,35,0.13)",
    height: 1,
    marginVertical: 11,
  },
  backCoverSynopsis: {
    color: "rgba(7,19,35,0.78)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  backCoverChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  backCoverChip: {
    backgroundColor: "rgba(241,217,157,0.72)",
    borderRadius: 999,
    color: "#071323",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  backCoverHint: {
    color: "rgba(7,19,35,0.42)",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  coverFallback: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  coverFallbackText: {
    color: "#F1D99D",
    fontSize: 20,
    fontWeight: "900",
  },
  infoPanel: {
    bottom: 0,
    left: 0,
    paddingBottom: 86,
    paddingHorizontal: 20,
    paddingTop: 18,
    position: "absolute",
    right: 0,
  },
  heroInfoPanel: {
    bottom: 0,
    left: 0,
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    position: "absolute",
    right: 0,
  },
  bookTitle: {
    color: "#FFFAF0",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    maxWidth: "86%",
  },
  author: {
    color: "rgba(255,250,240,0.9)",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  year: {
    color: "rgba(255,250,240,0.72)",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
  verifiedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  verifiedText: {
    color: "#FFFAF0",
    fontSize: 12,
    fontWeight: "900",
  },
  copy: {
    color: "rgba(255,250,240,0.82)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: "84%",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  tag: {
    backgroundColor: "rgba(255,250,240,0.92)",
    borderRadius: 999,
    color: "#071323",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  whiteSection: {
    backgroundColor: "#FFFAF0",
    borderRadius: 22,
    marginHorizontal: 14,
    marginTop: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  sectionTitle: {
    color: "#071323",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
  },
  sectionCopy: {
    color: "rgba(7,19,35,0.72)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  sourceText: {
    color: "rgba(7,19,35,0.42)",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: 10,
  },
  detailButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(241,217,157,0.72)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  detailButtonText: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
  },
  lightChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  lightChip: {
    backgroundColor: "rgba(7,19,35,0.07)",
    borderRadius: 999,
    color: "#071323",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  readLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 13,
  },
  readLinkButton: {
    alignItems: "center",
    backgroundColor: "rgba(241,217,157,0.58)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  readLinkText: {
    color: "#071323",
    fontSize: 12,
    fontWeight: "900",
  },
  bottomSpacer: {
    height: 88,
  },
  actions: {
    alignItems: "center",
    bottom: 22,
    elevation: 24,
    flexDirection: "row",
    gap: 14,
    position: "absolute",
    right: 18,
    zIndex: 30,
  },
  smallAction: {
    alignItems: "center",
    backgroundColor: "#162235",
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    width: 58,
  },
  saveAction: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    width: 72,
  },
  actionDisabled: {
    opacity: 0.44,
  },
  superlikeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(7,19,35,0.58)",
    borderRadius: 26,
    justifyContent: "center",
    zIndex: 22,
  },
  superlikeGlow: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 120,
    justifyContent: "center",
    shadowColor: "#F1D99D",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    width: 120,
  },
  superlikeTitle: {
    color: "#FFFAF0",
    fontSize: 36,
    fontWeight: "900",
    marginTop: 18,
  },
  superlikeCopy: {
    color: "rgba(255,250,240,0.76)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
  },
  toast: {
    color: "rgba(7,19,35,0.56)",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    marginBottom: 8,
    textAlign: "center",
  },
});
