export type BookStatus = "reading" | "recent" | "want-to-read" | "finished" | "not-yet";

export interface BookPalette {
  cover: string;
  spine: string;
  text: string;
}

export interface Book {
  author: string;
  coverPath?: string | undefined;
  genre?: string | undefined;
  id: string;
  isbn?: string | undefined;
  isChangedYou: boolean;
  moodTag?: string | undefined;
  palette: BookPalette;
  progress?: number | undefined;
  source?: string | undefined;
  status: BookStatus;
  title: string;
  totalPages?: number | undefined;
  currentPage: number;
  year: string;
}

export interface BookRow {
  author: string;
  cover_color: string;
  cover_path: string | null;
  created_at: string;
  current_page: number;
  finished_at: string | null;
  genre: string | null;
  id: string;
  isbn: string | null;
  is_changed_you: number;
  mood_tag: string | null;
  source: string | null;
  spine_color: string;
  started_at: string | null;
  status: BookStatus;
  title: string;
  total_pages: number | null;
  updated_at: string;
}

export interface CreateBookInput {
  author: string;
  coverPath?: string | undefined;
  genre?: string | undefined;
  isbn?: string | undefined;
  source?: string | undefined;
  status: BookStatus;
  title: string;
  totalPages?: number | undefined;
}

export interface UpdateBookProgressInput {
  bookId: string;
  currentPage: number;
  durationMinutes?: number | undefined;
  note?: string | undefined;
  pagesRead: number;
  readAt: string;
}

export const mapBookRow = (row: BookRow): Book => {
  const progress = row.total_pages === null || row.total_pages === 0
    ? undefined
    : Math.min(100, Math.round((row.current_page / row.total_pages) * 100));

  return {
    author: row.author,
    coverPath: row.cover_path ?? undefined,
    currentPage: row.current_page,
    genre: row.genre ?? undefined,
    id: row.id,
    isbn: row.isbn ?? undefined,
    isChangedYou: row.is_changed_you === 1,
    moodTag: row.mood_tag ?? undefined,
    palette: { cover: row.cover_color, spine: row.spine_color, text: "#FFF9F0" },
    progress,
    source: row.source ?? undefined,
    status: row.status,
    title: row.title,
    totalPages: row.total_pages ?? undefined,
    year: new Date(row.created_at).getFullYear().toString()
  };
};
