CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('reference', 'technique', 'style')),
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  recipe TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  image TEXT,
  art TEXT,
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  updated BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS deleted_cards (
  id TEXT PRIMARY KEY,
  updated BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS imports (
  digest TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  imported_at BIGINT NOT NULL
);
