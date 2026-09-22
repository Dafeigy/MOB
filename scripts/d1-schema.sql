PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  package TEXT NOT NULL,
  value TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER CHECK (min_quantity >= 0),
  location TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  unit_price REAL CHECK (unit_price >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_location ON components(location);
CREATE INDEX IF NOT EXISTS idx_movements_component ON stock_movements(component_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON stock_movements(created_at DESC);
