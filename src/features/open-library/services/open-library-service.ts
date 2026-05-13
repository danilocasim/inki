import type { DatabaseWriter } from "../../../lib/db";
import { nowIso } from "../../../lib/time";
import type { OpenLibraryBookDraft, OpenLibraryCacheRow } from "../types";

const cacheTtlMs = 1000 * 60 * 60 * 24 * 30;

export async function lookupOpenLibraryBookByIsbn(
  db: DatabaseWriter,
  isbn: string
): Promise<OpenLibraryBookDraft | undefined> {
  const cacheKey = `isbn:${isbn}`;
  const cached = await readCachedSearchResponse(db, cacheKey);

  if (cached) {
    return mapOpenLibrarySearchResult(isbn, cached);
  }

  const response = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`);

  if (!response.ok) {
    return undefined;
  }

  const json = await response.json();
  await writeCachedSearchResponse(db, cacheKey, JSON.stringify(json));

  return mapOpenLibrarySearchResult(isbn, json);
}

export function mapOpenLibrarySearchResult(
  isbn: string,
  value: unknown
): OpenLibraryBookDraft | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  const docs = value.docs;

  if (!Array.isArray(docs)) {
    return undefined;
  }

  const firstDoc = docs.find(isObject);

  if (!firstDoc) {
    return undefined;
  }

  const title = readString(firstDoc.title);
  const author = readStringArray(firstDoc.author_name)[0];
  const genre = readStringArray(firstDoc.subject).find((subject) => subject.length <= 32);

  if (!title && !author) {
    return undefined;
  }

  return {
    author,
    genre,
    isbn,
    title
  };
}

async function readCachedSearchResponse(
  db: DatabaseWriter,
  cacheKey: string
): Promise<unknown | undefined> {
  const row = await db.getFirstAsync<OpenLibraryCacheRow>(
    `SELECT response_json
     FROM open_library_cache
     WHERE cache_key = ? AND expires_at > ?;`,
    [cacheKey, nowIso()]
  );

  if (!row) {
    return undefined;
  }

  try {
    return JSON.parse(row.response_json);
  } catch {
    return undefined;
  }
}

async function writeCachedSearchResponse(
  db: DatabaseWriter,
  cacheKey: string,
  responseJson: string
): Promise<void> {
  const now = nowIso();
  const expiresAt = new Date(Date.now() + cacheTtlMs).toISOString();

  await db.runAsync(
    `INSERT INTO open_library_cache (cache_key, response_json, fetched_at, expires_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       response_json = excluded.response_json,
       fetched_at = excluded.fetched_at,
       expires_at = excluded.expires_at;`,
    [cacheKey, responseJson, now, expiresAt]
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = readString(item);

    return text ? [text] : [];
  });
};
