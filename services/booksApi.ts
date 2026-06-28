export type OpenLibraryBook = {
  id: string;
  title: string;
  author: string;
  year?: number;
  coverUrl?: string;
  description?: string;
  descriptionSource?: "Google Books" | "Open Library";
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryDoc[];
};

type OpenLibraryWorkResponse = {
  description?: string | { value?: string };
};

type GoogleBooksVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

type GoogleBooksResponse = {
  items?: GoogleBooksVolume[];
};

export async function searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  const queries = Array.from(new Set([query, query.replace(/-/g, " ")]));

  for (const currentQuery of queries) {
    const books = await fetchOpenLibrary(currentQuery);

    if (books.length > 0) {
      return books;
    }
  }

  return [];
}

export async function findBookDescription(book: {
  author: string;
  query: string;
  title: string;
}): Promise<Pick<OpenLibraryBook, "description" | "descriptionSource">> {
  const googleDescription = await fetchGoogleBooksDescription(book);

  if (googleDescription) {
    return { description: googleDescription, descriptionSource: "Google Books" };
  }

  const openLibraryDescription = await fetchOpenLibraryDescription(book.query);

  if (openLibraryDescription) {
    return { description: openLibraryDescription, descriptionSource: "Open Library" };
  }

  return {};
}

async function fetchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Library request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenLibrarySearchResponse;

  return (data.docs ?? [])
    .sort((first, second) => Number(Boolean(second.cover_i)) - Number(Boolean(first.cover_i)))
    .map((book) => ({
      id: book.key ?? book.title ?? query,
      title: book.title ?? "Untitled",
      author: book.author_name?.[0] ?? "Unknown author",
      year: book.first_publish_year,
      coverUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : undefined,
    }));
}

async function fetchGoogleBooksDescription(book: {
  author: string;
  title: string;
}): Promise<string | undefined> {
  const query = `intitle:${book.title} inauthor:${book.author}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books&country=IN`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as GoogleBooksResponse;
    const descriptions = (data.items ?? [])
      .map((item) => item.volumeInfo?.description)
      .map(cleanDescription)
      .filter(isUsefulDescription);

    return descriptions[0];
  } catch {
    return undefined;
  }
}

async function fetchOpenLibraryDescription(query: string): Promise<string | undefined> {
  try {
    const results = await fetchOpenLibrary(query);
    const workId = results[0]?.id;

    if (!workId?.startsWith("/works/")) {
      return undefined;
    }

    const response = await fetch(`https://openlibrary.org${workId}.json`);

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as OpenLibraryWorkResponse;
    const rawDescription =
      typeof data.description === "string" ? data.description : data.description?.value;

    return isUsefulDescription(cleanDescription(rawDescription))
      ? cleanDescription(rawDescription)
      : undefined;
  } catch {
    return undefined;
  }
}

function cleanDescription(description: string | undefined) {
  return description
    ?.replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulDescription(description: string | undefined): description is string {
  if (!description) {
    return false;
  }

  return description.length >= 80 && !description.toLowerCase().includes("no description");
}
