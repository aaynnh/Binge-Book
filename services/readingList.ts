import AsyncStorage from "@react-native-async-storage/async-storage";

import type { RecommendedBook } from "@/utils/recommendations";

const savedBooksKey = "bingebook.savedBooks.v1";
const readingProgressKey = "bingebook.readingProgress.v1";

export type ReadingStatus = "want-to-read" | "reading" | "finished" | "dnf";

export type SavedBook = {
  author: string;
  coverUrl?: string;
  id: string;
  match: number;
  rating?: number;
  savedAt: string;
  status: ReadingStatus;
  tags: string[];
  title: string;
  updatedAt?: string;
};

export type ReadingProgress = {
  completedSessions: number;
  lastReadDate?: string;
  streak: number;
  totalMinutes: number;
  xp: number;
};

export async function getSavedBooks() {
  const rawBooks = await AsyncStorage.getItem(savedBooksKey);

  if (!rawBooks) {
    return [];
  }

  try {
    return JSON.parse(rawBooks) as SavedBook[];
  } catch {
    return [];
  }
}

export async function saveBookToReadingList(book: RecommendedBook, coverUrl?: string) {
  const currentBooks = await getSavedBooks();
  const existingBook = currentBooks.find((savedBook) => savedBook.id === book.id);
  const nextBook: SavedBook = {
    author: book.author,
    coverUrl: coverUrl ?? existingBook?.coverUrl,
    id: book.id,
    match: book.match,
    rating: existingBook?.rating,
    savedAt: new Date().toISOString(),
    status: existingBook?.status ?? "want-to-read",
    tags: book.tags,
    title: book.title,
    updatedAt: new Date().toISOString(),
  };

  const nextBooks = [nextBook, ...currentBooks.filter((savedBook) => savedBook.id !== book.id)];
  await AsyncStorage.setItem(savedBooksKey, JSON.stringify(nextBooks));

  return nextBooks;
}

export async function updateSavedBookStatus(bookId: string, status: ReadingStatus) {
  const books = await getSavedBooks();
  const nextBooks = books.map((book) =>
    book.id === bookId ? { ...book, status, updatedAt: new Date().toISOString() } : book
  );

  await AsyncStorage.setItem(savedBooksKey, JSON.stringify(nextBooks));
  return nextBooks;
}

export async function rateSavedBook(bookId: string, rating: number) {
  const books = await getSavedBooks();
  const nextBooks = books.map((book) =>
    book.id === bookId ? { ...book, rating, updatedAt: new Date().toISOString() } : book
  );

  await AsyncStorage.setItem(savedBooksKey, JSON.stringify(nextBooks));
  return nextBooks;
}

export async function getReadingProgress(): Promise<ReadingProgress> {
  const rawProgress = await AsyncStorage.getItem(readingProgressKey);

  if (!rawProgress) {
    return { completedSessions: 0, streak: 0, totalMinutes: 0, xp: 0 };
  }

  try {
    return JSON.parse(rawProgress) as ReadingProgress;
  } catch {
    return { completedSessions: 0, streak: 0, totalMinutes: 0, xp: 0 };
  }
}

export async function completeReadingSession(minutes = 10) {
  const currentProgress = await getReadingProgress();
  const today = getDateKey(new Date());
  const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const alreadyReadToday = currentProgress.lastReadDate === today;
  const nextStreak = alreadyReadToday
    ? currentProgress.streak
    : currentProgress.lastReadDate === yesterday
      ? currentProgress.streak + 1
      : 1;

  const nextProgress: ReadingProgress = {
    completedSessions: currentProgress.completedSessions + 1,
    lastReadDate: today,
    streak: nextStreak,
    totalMinutes: currentProgress.totalMinutes + minutes,
    xp: currentProgress.xp + minutes * 10,
  };

  await AsyncStorage.setItem(readingProgressKey, JSON.stringify(nextProgress));
  return nextProgress;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
