export type QuoteCaptureMethod = "manual" | "ocr";

export interface Bookmark {
  bookId: string;
  createdAt: string;
  id: string;
  label?: string | undefined;
  note?: string | undefined;
  page: number;
  updatedAt: string;
}

export interface BookmarkRow {
  book_id: string;
  created_at: string;
  id: string;
  label: string | null;
  note: string | null;
  page: number;
  updated_at: string;
}

export interface BookNote {
  body: string;
  bookId: string;
  createdAt: string;
  id: string;
  page?: number | undefined;
  title?: string | undefined;
  updatedAt: string;
}

export interface BookNoteRow {
  body: string;
  book_id: string;
  created_at: string;
  id: string;
  page: number | null;
  title: string | null;
  updated_at: string;
}

export interface Quote {
  bookId: string;
  captureMethod: QuoteCaptureMethod;
  createdAt: string;
  id: string;
  page?: number | undefined;
  sourceImagePath?: string | undefined;
  text: string;
  updatedAt: string;
}

export interface QuoteRow {
  book_id: string;
  capture_method: QuoteCaptureMethod;
  created_at: string;
  id: string;
  page: number | null;
  source_image_path: string | null;
  text: string;
  updated_at: string;
}

export interface CreateBookmarkInput {
  bookId: string;
  label?: string | undefined;
  note?: string | undefined;
  page: number;
}

export interface CreateBookNoteInput {
  body: string;
  bookId: string;
  page?: number | undefined;
  title?: string | undefined;
}

export interface CreateQuoteInput {
  bookId: string;
  captureMethod?: QuoteCaptureMethod | undefined;
  page?: number | undefined;
  sourceImagePath?: string | undefined;
  text: string;
}

export interface BookAnnotations {
  bookmarks: Bookmark[];
  notes: BookNote[];
  quotes: Quote[];
}

export const mapBookmarkRow = (row: BookmarkRow): Bookmark => ({
  bookId: row.book_id,
  createdAt: row.created_at,
  id: row.id,
  label: row.label ?? undefined,
  note: row.note ?? undefined,
  page: row.page,
  updatedAt: row.updated_at
});

export const mapBookNoteRow = (row: BookNoteRow): BookNote => ({
  body: row.body,
  bookId: row.book_id,
  createdAt: row.created_at,
  id: row.id,
  page: row.page ?? undefined,
  title: row.title ?? undefined,
  updatedAt: row.updated_at
});

export const mapQuoteRow = (row: QuoteRow): Quote => ({
  bookId: row.book_id,
  captureMethod: row.capture_method,
  createdAt: row.created_at,
  id: row.id,
  page: row.page ?? undefined,
  sourceImagePath: row.source_image_path ?? undefined,
  text: row.text,
  updatedAt: row.updated_at
});
