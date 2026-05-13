import type { DatabaseWriter } from "./types";
import { figmaBooks, figmaShelves } from "../../features/dashboard/fixtures";

/** Seeds screenshot reference data in development without duplicating user rows. */
export async function seedDevelopmentDataAsync(db: DatabaseWriter): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM books;");

  if ((existing?.count ?? 0) > 0) {
    return;
  }

  const now = new Date("2026-05-14T00:00:00.000Z").toISOString();

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const book of figmaBooks) {
      const totalPages = totalPagesByBookId[book.id] ?? null;
      const currentPage = totalPages === null ? 0 : Math.round((totalPages * (book.progress ?? 0)) / 100);

      await txn.runAsync(
        `INSERT INTO books (
          id, title, author, status, total_pages, current_page, cover_color, spine_color,
          genre, source, is_changed_you, started_at, finished_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          book.id,
          book.title,
          book.author,
          book.status,
          totalPages,
          currentPage,
          book.palette.cover,
          book.palette.spine,
          book.genre,
          "fixture",
          changedYouBookIds.has(book.id) ? 1 : 0,
          book.status === "reading" ? "2026-03-12T09:00:00.000Z" : null,
          book.status === "finished" || book.status === "recent" ? "2026-05-01T20:00:00.000Z" : null,
          now,
          now
        ]
      );
    }

    for (const shelf of figmaShelves) {
      await txn.runAsync(
        `INSERT INTO shelves (id, name, description, accent, kind, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [shelf.id, shelf.title, shelf.subtitle, shelf.accent, "custom", 10, now, now]
      );

      for (const [index, bookId] of shelf.bookIds.entries()) {
        await txn.runAsync(
          `INSERT INTO shelf_books (shelf_id, book_id, sort_order, added_at)
           VALUES (?, ?, ?, ?);`,
          [shelf.id, bookId, index, now]
        );
      }
    }

    for (const shelf of systemShelves) {
      await txn.runAsync(
        `INSERT INTO shelves (id, name, description, accent, kind, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [shelf.id, shelf.name, shelf.description, shelf.accent, "system", shelf.sortOrder, now, now]
      );
    }

    await seedSessionsAsync(txn, now);
    await seedQuotesAsync(txn, now);
    await seedAnnotationsAsync(txn, now);
    await seedSettingsAsync(txn, now);
    await seedNotificationsAsync(txn, now);
  });
}

async function seedSessionsAsync(txn: DatabaseWriter, now: string): Promise<void> {
  const sessions = [
    ["session-piranesi-1", "piranesi", 42, 0, 42, 35, "2026-05-14T08:30:00.000Z"],
    ["session-overstory-1", "overstory", 11, 81, 92, 25, "2026-05-13T20:00:00.000Z"],
    ["session-normal-people-1", "normal-people", 32, 164, 196, 40, "2026-05-12T21:00:00.000Z"],
    ["session-crossroads-1", "crossroads", 18, 304, 322, 30, "2026-05-10T21:30:00.000Z"]
  ] as const;

  for (const session of sessions) {
    await txn.runAsync(
      `INSERT INTO reading_sessions (
        id, book_id, pages_read, started_page, ended_page, duration_minutes, read_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [...session, now]
    );
  }
}

async function seedQuotesAsync(txn: DatabaseWriter, now: string): Promise<void> {
  await txn.runAsync(
    `INSERT INTO quotes (id, book_id, text, page, capture_method, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      "quote-piranesi-kindness",
      "piranesi",
      "The house was not the labyrinth. The labyrinth was the kindness.",
      112,
      "manual",
      now,
      now
    ]
  );
}

async function seedAnnotationsAsync(txn: DatabaseWriter, now: string): Promise<void> {
  await txn.runAsync(
    `INSERT INTO book_notes (id, book_id, title, body, page, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      "note-piranesi-house",
      "piranesi",
      "House as comfort",
      "This is where the book turns from puzzle box into something tender.",
      112,
      now,
      now
    ]
  );

  await txn.runAsync(
    `INSERT INTO bookmarks (id, book_id, page, label, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    ["bookmark-piranesi-112", "piranesi", 112, "kindness line", null, now, now]
  );
}

async function seedSettingsAsync(txn: DatabaseWriter, now: string): Promise<void> {
  const settings = [
    ["dailyShareStreakEnabled", "true"],
    ["dailyShareStreakTime", "21:00"],
    ["iCloudSyncEnabled", "false"],
    ["readReminderEnabled", "false"],
    ["shelfView.midnight-reads", "grid"]
  ] as const;

  for (const [key, value] of settings) {
    await txn.runAsync("INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?);", [
      key,
      value,
      now
    ]);
  }
}

async function seedNotificationsAsync(txn: DatabaseWriter, now: string): Promise<void> {
  const notifications = [
    ["notification-share-streak", "share-streak", "12 day share streak", "Tap to share today's read and keep the streak alive.", "2026-05-14T21:00:00.000Z"],
    ["notification-memory", "memory", "6 months ago, you wrote", "The voice felt like someone finally told the truth about being poor.", "2026-05-14T08:00:00.000Z"],
    ["notification-reading-window", "read-reminder", "Your 8:30 reading window", "Klara and the Sun • 127/303", "2026-05-14T08:30:00.000Z"],
    ["notification-wrapped", "wrapped", "May wrapped is ready", "4 books • 1,021 pages • 12 day streak", "2026-05-13T12:00:00.000Z"]
  ] as const;

  for (const notification of notifications) {
    await txn.runAsync(
      `INSERT INTO notifications_log (id, type, title, body, scheduled_for, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [...notification, notification[4], now]
    );
  }
}

const totalPagesByBookId: Record<string, number> = {
  babel: 560,
  bewilderment: 278,
  crossroads: 580,
  demon: 560,
  klara: 303,
  "normal-people": 273,
  overstory: 502,
  pachinko: 496,
  piranesi: 248,
  remains: 245,
  tomb: 739
};

const changedYouBookIds = new Set(["piranesi", "normal-people", "demon", "remains", "pachinko"]);

const systemShelves = [
  {
    accent: "#65785C",
    description: "books currently in progress",
    id: "system-reading",
    name: "currently reading",
    sortOrder: 0
  },
  {
    accent: "#C69A45",
    description: "books finished locally",
    id: "system-finished",
    name: "finished",
    sortOrder: 1
  },
  {
    accent: "#7D3F26",
    description: "books that changed me",
    id: "system-changed-me",
    name: "books that changed me",
    sortOrder: 2
  },
  {
    accent: "#4F5B74",
    description: "books set aside for later",
    id: "system-not-yet",
    name: "not yet",
    sortOrder: 3
  }
] as const;
