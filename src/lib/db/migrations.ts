import type { SQLiteDatabase } from "expo-sqlite";

import { seedDevelopmentDataAsync } from "./dev-seed";
import { schemaV1Sql } from "./schema.sql";
import type { DatabaseWriter, UserVersionRow } from "./types";

export const DATABASE_NAME = "inki.db";

/** Runs additive local SQLite migrations without destructive reset behavior. */
export async function initializeDatabaseAsync(db: SQLiteDatabase): Promise<void> {
  await migrateDatabaseAsync(db);

  if (__DEV__) {
    await seedDevelopmentDataAsync(db);
  }
}

export async function migrateDatabaseAsync(db: DatabaseWriter): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await db.execAsync("PRAGMA journal_mode = WAL;");

  const versionRow = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version;");
  const userVersion = versionRow?.user_version ?? 0;

  if (userVersion < 1) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(schemaV1Sql);
      await txn.execAsync("PRAGMA user_version = 1;");
    });
  }
}
