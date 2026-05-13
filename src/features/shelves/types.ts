import type { Book } from "../books/types";

export type ShelfKind = "system" | "custom";
export type ShelfView = "grid" | "list" | "spine";

export interface Shelf {
  accent: string;
  books?: Book[];
  count: number;
  id: string;
  kind: ShelfKind;
  subtitle: string;
  title: string;
}

export interface CreateShelfInput {
  name: string;
  description?: string | undefined;
}

export interface ShelfRow {
  accent: string;
  book_count: number;
  description: string | null;
  id: string;
  kind: ShelfKind;
  name: string;
  sort_order: number;
}

export const isShelfView = (value: string | undefined): value is ShelfView =>
  value === "grid" || value === "list" || value === "spine";

export const mapShelfRow = (row: ShelfRow): Shelf => ({
  accent: row.accent,
  count: row.book_count,
  id: row.id,
  kind: row.kind,
  subtitle: row.description ?? "private shelf",
  title: row.name
});
