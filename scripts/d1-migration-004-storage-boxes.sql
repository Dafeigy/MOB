-- Run once for existing D1 databases. New databases use d1-schema.sql.
CREATE TABLE IF NOT EXISTS storage_boxes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

INSERT OR IGNORE INTO storage_boxes (id, label, subtitle) VALUES
  ('A', '盒 01', '电阻 / 电容'),
  ('B', '盒 02', '二极管 / 连接器'),
  ('C', '盒 03', '芯片 / 模块');
