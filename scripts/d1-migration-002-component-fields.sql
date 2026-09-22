-- Run this once only for databases created with the previous schema.
-- Rebuilding both tables keeps the stock_movements foreign key valid.
PRAGMA foreign_keys = OFF;

ALTER TABLE components RENAME TO components_legacy;
ALTER TABLE stock_movements RENAME TO stock_movements_legacy;

CREATE TABLE components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  package TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER CHECK (min_quantity >= 0),
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  unit_price REAL CHECK (unit_price >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

INSERT INTO components (
  id, name, category, package, value, quantity, min_quantity, location,
  notes, unit_price, created_at, updated_at
)
SELECT
  id, name, category, package, value, quantity, min_quantity, location,
  manufacturer, unit_price, created_at, updated_at
FROM components_legacy;

INSERT INTO stock_movements (id, component_id, type, quantity, note, created_at)
SELECT id, component_id, type, quantity, note, created_at
FROM stock_movements_legacy;

DROP TABLE stock_movements_legacy;
DROP TABLE components_legacy;

CREATE INDEX idx_components_category ON components(category);
CREATE INDEX idx_components_location ON components(location);
CREATE INDEX idx_movements_component ON stock_movements(component_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at DESC);

PRAGMA foreign_keys = ON;
