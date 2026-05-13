import type { SQLiteBindParams, SQLiteRunResult } from "expo-sqlite";

export interface DatabaseReader {
  getAllAsync<T>(source: string, params?: SQLiteBindParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SQLiteBindParams): Promise<T | null>;
}

export interface DatabaseWriter extends DatabaseReader {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SQLiteBindParams): Promise<SQLiteRunResult>;
  withExclusiveTransactionAsync(task: (txn: DatabaseWriter) => Promise<void>): Promise<void>;
}

export interface UserVersionRow {
  user_version: number;
}
