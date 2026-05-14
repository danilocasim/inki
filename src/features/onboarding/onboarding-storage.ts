import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inki_prefs.db");

function ensureTable() {
  db.execSync("CREATE TABLE IF NOT EXISTS prefs (key TEXT PRIMARY KEY, value TEXT)");
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  ensureTable();
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM prefs WHERE key = 'onboarded'"
  );
  return row !== null;
}

export async function markOnboardingComplete(): Promise<void> {
  ensureTable();
  db.runSync("INSERT OR REPLACE INTO prefs (key, value) VALUES ('onboarded', '1')");
}

export async function resetOnboarding(): Promise<void> {
  ensureTable();
  db.runSync("DELETE FROM prefs WHERE key = 'onboarded'");
}
