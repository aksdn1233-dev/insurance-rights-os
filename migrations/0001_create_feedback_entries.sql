CREATE TABLE IF NOT EXISTS feedback_entries (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('review', 'improvement', 'bug')),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 1000),
  source_path TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'archived')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_entries_created_at
  ON feedback_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_entries_status_created_at
  ON feedback_entries(status, created_at DESC);
