import { curatedBooks, type CuratedBook } from "@/data/curatedBooks";

export type QuizAnswers = {
  obsessions: string[];
  character: string;
  mood?: string;
  world: string;
  plot: string;
};

export type RecommendedBook = CuratedBook & {
  match: number;
  matchedTags: string[];
};

export function getRecommendations(answers: QuizAnswers): RecommendedBook[] {
  return curatedBooks
    .map((book) => scoreBook(book, answers))
    .sort((a, b) => b.match - a.match);
}

function scoreBook(book: CuratedBook, answers: QuizAnswers): RecommendedBook {
  let score = 48;
  const matchedTags = new Set<string>();

  for (const obsession of answers.obsessions) {
    if (book.tags.includes(obsession)) {
      score += 10;
      matchedTags.add(obsession);
    }
  }

  const weightedAnswers = [
    { value: answers.character, weight: 16 },
    { value: moodToTag(answers.mood), weight: 16 },
    { value: answers.world, weight: 14 },
    { value: answers.plot, weight: 18 },
  ].filter((answer): answer is { value: string; weight: number } => Boolean(answer.value));

  for (const answer of weightedAnswers) {
    if (book.tags.includes(answer.value)) {
      score += answer.weight;
      matchedTags.add(answer.value);
    }
  }

  if (book.tags.includes("fast hooks")) score += 5;
  if (book.tags.includes("Easy snack")) score += 4;
  if (book.tags.includes("short chapters")) score += 4;

  return {
    ...book,
    match: Math.min(score, 98),
    matchedTags: Array.from(matchedTags),
  };
}

function moodToTag(mood: string | undefined) {
  const moodTags: Record<string, string> = {
    "Need suspense": "Thrilling",
    "Want romance": "Romantic",
    "Easy 10-min read": "Easy snack",
    "Emotionally wreck me": "Emotional",
    "Cozy reset": "Cozy",
  };

  return mood ? moodTags[mood] : undefined;
}
