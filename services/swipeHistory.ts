import AsyncStorage from "@react-native-async-storage/async-storage";

const swipeHistoryKey = "bingebook.swipeHistory.v1";
const swipeCooldownDays = 14;

export type SwipeAction = "skipped" | "saved" | "superliked";

export type SwipeHistoryEntry = {
  action: SwipeAction;
  bookId: string;
  hiddenUntil: string;
  swipedAt: string;
};

export async function getActiveSwipeHistory() {
  const rawHistory = await AsyncStorage.getItem(swipeHistoryKey);

  if (!rawHistory) {
    return [];
  }

  try {
    const history = JSON.parse(rawHistory) as SwipeHistoryEntry[];
    const now = Date.now();
    const activeHistory = history.filter((entry) => new Date(entry.hiddenUntil).getTime() > now);

    if (activeHistory.length !== history.length) {
      await AsyncStorage.setItem(swipeHistoryKey, JSON.stringify(activeHistory));
    }

    return activeHistory;
  } catch {
    await AsyncStorage.removeItem(swipeHistoryKey);
    return [];
  }
}

export async function getHiddenBookIds() {
  const history = await getActiveSwipeHistory();

  return new Set(history.map((entry) => entry.bookId));
}

export async function recordBookSwipe(bookId: string, action: SwipeAction) {
  const currentHistory = await getActiveSwipeHistory();
  const now = new Date();
  const hiddenUntil = new Date(now.getTime() + swipeCooldownDays * 24 * 60 * 60 * 1000);
  const nextEntry: SwipeHistoryEntry = {
    action,
    bookId,
    hiddenUntil: hiddenUntil.toISOString(),
    swipedAt: now.toISOString(),
  };
  const nextHistory = [nextEntry, ...currentHistory.filter((entry) => entry.bookId !== bookId)];

  await AsyncStorage.setItem(swipeHistoryKey, JSON.stringify(nextHistory));
  return nextHistory;
}
