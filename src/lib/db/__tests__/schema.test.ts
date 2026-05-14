import { schemaV1Sql, schemaV2Sql, schemaV3Sql } from "../schema.sql";

describe("local SQLite schema", () => {
  it("contains the offline-first tables and indexes", () => {
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS books");
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS reading_sessions");
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS shelves");
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS notifications_log");
    expect(schemaV1Sql).toContain("CREATE INDEX IF NOT EXISTS idx_books_status_updated_at");
    expect(schemaV2Sql).toContain("CREATE TABLE IF NOT EXISTS book_notes");
    expect(schemaV2Sql).toContain("CREATE TABLE IF NOT EXISTS bookmarks");
    expect(schemaV2Sql).toContain("CREATE INDEX IF NOT EXISTS idx_bookmarks_book_page");
    expect(schemaV3Sql).toContain("ALTER TABLE books ADD COLUMN is_pinned");
  });

  it("does not include destructive reset SQL", () => {
    const fullSchema = `${schemaV1Sql}\n${schemaV2Sql}\n${schemaV3Sql}`.toLowerCase();

    expect(fullSchema).not.toContain("drop table");
    expect(fullSchema).not.toContain("truncate");
  });
});
