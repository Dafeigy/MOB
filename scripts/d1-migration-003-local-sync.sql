-- Run once for an existing D1 database. New databases use d1-schema.sql.
-- Desktop synchronization and the web data layer also detect/add this column.
ALTER TABLE components ADD COLUMN deleted_at TEXT;
