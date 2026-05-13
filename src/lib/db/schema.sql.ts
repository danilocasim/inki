export const schemaV1Sql = `
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reading', 'recent', 'want-to-read', 'finished', 'not-yet')),
  total_pages INTEGER,
  current_page INTEGER NOT NULL DEFAULT 0,
  cover_path TEXT,
  cover_color TEXT NOT NULL DEFAULT '#D6C6A3',
  spine_color TEXT NOT NULL DEFAULT '#8A5C36',
  isbn TEXT,
  genre TEXT,
  source TEXT,
  mood_tag TEXT,
  is_changed_you INTEGER NOT NULL DEFAULT 0 CHECK (is_changed_you IN (0, 1)),
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (total_pages IS NULL OR total_pages >= 0),
  CHECK (current_page >= 0),
  CHECK (total_pages IS NULL OR current_page <= total_pages)
);

CREATE TABLE IF NOT EXISTS shelves (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  accent TEXT NOT NULL DEFAULT '#7D3F26',
  kind TEXT NOT NULL CHECK (kind IN ('system', 'custom')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shelf_books (
  shelf_id TEXT NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  pinned_at TEXT,
  added_at TEXT NOT NULL,
  PRIMARY KEY (shelf_id, book_id)
);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  pages_read INTEGER NOT NULL CHECK (pages_read >= 0),
  started_page INTEGER,
  ended_page INTEGER,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  note TEXT,
  read_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  page INTEGER CHECK (page IS NULL OR page >= 0),
  source_image_path TEXT,
  capture_method TEXT NOT NULL DEFAULT 'manual' CHECK (capture_method IN ('manual', 'ocr')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS book_tags (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TEXT,
  sent_at TEXT,
  tapped_at TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  local_notification_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS share_events (
  id TEXT PRIMARY KEY NOT NULL,
  card_type TEXT NOT NULL,
  source_id TEXT,
  output_path TEXT,
  used_for_streak INTEGER NOT NULL DEFAULT 0 CHECK (used_for_streak IN (0, 1)),
  shared_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS open_library_cache (
  cache_key TEXT PRIMARY KEY NOT NULL,
  response_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_status_updated_at ON books(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_books_finished_at ON books(finished_at);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_read_at ON reading_sessions(read_at);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_read_at ON reading_sessions(book_id, read_at);
CREATE INDEX IF NOT EXISTS idx_shelf_books_shelf_sort ON shelf_books(shelf_id, sort_order, added_at);
CREATE INDEX IF NOT EXISTS idx_quotes_book_created_at ON quotes(book_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_log_type_sent_at ON notifications_log(type, sent_at);
`;
