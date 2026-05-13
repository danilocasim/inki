import { schemaV1Sql } from "../schema.sql";

describe("local SQLite schema", () => {
  it("contains the offline-first tables and indexes", () => {
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS books");
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS reading_sessions");
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS shelves");
    expect(schemaV1Sql).toContain("CREATE TABLE IF NOT EXISTS notifications_log");
    expect(schemaV1Sql).toContain("CREATE INDEX IF NOT EXISTS idx_books_status_updated_at");
  });

  it("does not include destructive reset SQL", () => {
    expect(schemaV1Sql.toLowerCase()).not.toContain("drop table");
    expect(schemaV1Sql.toLowerCase()).not.toContain("truncate");
  });
});
