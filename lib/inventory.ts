import { d1Batch, d1Query, isD1Configured, ensureSyncSchema } from "@/lib/d1"

import { inventoryOverview, type ComponentItem, type StockMovement, type NewComponent, type StorageBox } from "@/lib/inventory-types"
export type { ComponentItem, StockMovement, NewComponent, StorageBox } from "@/lib/inventory-types"

const defaultStorageBoxes: StorageBox[] = [
  { id: "A", label: "盒 01", subtitle: "电阻 / 电容", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
  { id: "B", label: "盒 02", subtitle: "二极管 / 连接器", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
  { id: "C", label: "盒 03", subtitle: "芯片 / 模块", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
]

const demoComponents: ComponentItem[] = [
  {
    id: "demo-1",
    name: "贴片电阻",
    category: "电阻",
    package: "0603",
    value: "10 kΩ ±1%",
    quantity: 1240,
    min_quantity: 300,
    location: "A-01-03",
    notes: "常用阻值，Yageo",
    unit_price: 0.008,
    updated_at: "2026-09-22 09:42:00",
  },
  {
    id: "demo-2",
    name: "多层陶瓷电容",
    category: "电容",
    package: "0603",
    value: "100 nF 50 V",
    quantity: 186,
    min_quantity: 200,
    location: "A-02-01",
    notes: "常用去耦",
    unit_price: 0.012,
    updated_at: "2026-09-22 08:18:00",
  },
  {
    id: "demo-3",
    name: "肖特基二极管",
    category: "二极管",
    package: "SOD-123",
    value: "40 V / 1 A",
    quantity: 48,
    min_quantity: 80,
    location: "B-01-04",
    notes: "Diodes Inc.，备用料",
    unit_price: 0.036,
    updated_at: "2026-09-21 19:06:00",
  },
  {
    id: "demo-4",
    name: "低压差稳压器",
    category: "电源芯片",
    package: "SOT-23-5",
    value: "3.3 V / 600 mA",
    quantity: 92,
    min_quantity: 30,
    location: "C-03-02",
    notes: "TI，3.3 V 输出",
    unit_price: 0.42,
    updated_at: "2026-09-21 15:32:00",
  },
  {
    id: "demo-5",
    name: "USB-C 母座",
    category: "连接器",
    package: "16P SMD",
    value: "USB 2.0",
    quantity: 64,
    min_quantity: 40,
    location: "D-02-06",
    notes: "Korean Hroparts",
    unit_price: 0.28,
    updated_at: "2026-09-20 11:14:00",
  },
  {
    id: "demo-6",
    name: "微控制器",
    category: "MCU",
    package: "LQFP-48",
    value: "ARM Cortex-M0+",
    quantity: 18,
    min_quantity: 20,
    location: "C-01-01",
    notes: "STMicroelectronics",
    unit_price: 1.34,
    updated_at: "2026-09-19 17:28:00",
  },
]

const demoMovements: StockMovement[] = [
  {
    id: "movement-1",
    component_id: "demo-1",
    component_name: "贴片电阻 · 10 kΩ",
    type: "in",
    quantity: 500,
    note: "采购补货",
    created_at: "2026-09-22 09:42:00",
  },
  {
    id: "movement-2",
    component_id: "demo-2",
    component_name: "多层陶瓷电容 · 100 nF",
    type: "out",
    quantity: 120,
    note: "控制板 Rev.C 焊接",
    created_at: "2026-09-22 08:18:00",
  },
  {
    id: "movement-3",
    component_id: "demo-4",
    component_name: "低压差稳压器 · 3.3 V",
    type: "in",
    quantity: 50,
    note: "样品到货",
    created_at: "2026-09-21 15:32:00",
  },
  {
    id: "movement-4",
    component_id: "demo-3",
    component_name: "肖特基二极管 · 40 V",
    type: "out",
    quantity: 32,
    note: "电源板小批量生产",
    created_at: "2026-09-21 14:05:00",
  },
]

// Keep versions monotonic even when successive writes occur in the same millisecond.
const nextVersion = "strftime('%Y-%m-%dT%H:%M:%fZ', max(julianday('now'), julianday(updated_at, '+0.001 seconds')))"

function isLegacyComponentsSchema(error: unknown) {
  return error instanceof Error && /(?:no such column|has no column named)\s*:?\s*(?:components\.)?notes/i.test(error.message)
}

export async function getComponents() {
  if (!isD1Configured()) return demoComponents
  await ensureSyncSchema()

  try {
    return await d1Query<ComponentItem>(`
      SELECT id, name, category, package, value, quantity, min_quantity,
             location, notes, unit_price, updated_at
      FROM components
      WHERE deleted_at IS NULL
      ORDER BY name COLLATE NOCASE
    `)
  } catch (error) {
    // Existing databases stay readable until the documented migration is run.
    if (!isLegacyComponentsSchema(error)) throw error
    return d1Query<ComponentItem>(`
      SELECT id, name, category, package, value, quantity, min_quantity,
             location, manufacturer AS notes, unit_price, updated_at
      FROM components
      WHERE deleted_at IS NULL
      ORDER BY name COLLATE NOCASE
    `)
  }
}

export async function getRecentMovements(limit = 10) {
  if (!isD1Configured()) return demoMovements.slice(0, limit)
  await ensureSyncSchema()

  return d1Query<StockMovement>(
    `SELECT m.id, m.component_id, c.name || ' · ' || c.value AS component_name,
            m.type, m.quantity, m.note, m.created_at
     FROM stock_movements m
     JOIN components c ON c.id = m.component_id
     WHERE c.deleted_at IS NULL
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [limit],
  )
}

export async function getStorageBoxes() {
  if (!isD1Configured()) return defaultStorageBoxes
  await ensureSyncSchema()
  return d1Query<StorageBox>("SELECT id, label, subtitle, created_at, updated_at FROM storage_boxes WHERE deleted_at IS NULL ORDER BY id")
}

export async function createStorageBox(id: string, label: string, subtitle: string) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()
  const now = new Date().toISOString()
  await d1Query("INSERT INTO storage_boxes (id, label, subtitle, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [id, label.trim(), subtitle.trim(), now, now])
}

export async function updateStorageBox(id: string, label: string, subtitle: string) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()
  await d1Query("UPDATE storage_boxes SET label = ?, subtitle = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND deleted_at IS NULL", [label.trim(), subtitle.trim(), id])
}

export async function deleteStorageBox(id: string) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()
  await d1Query("UPDATE storage_boxes SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND deleted_at IS NULL", [id])
}

export async function getInventoryOverview() {
  const components = await getComponents()
  const recentMovements = await getRecentMovements(5)
  return inventoryOverview(components, recentMovements, !isD1Configured())
}

export async function createComponent(input: NewComponent) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()

  const id = crypto.randomUUID()
  const params = [id, input.name, input.category, input.package, input.value, input.quantity, input.min_quantity, input.location, input.notes, input.unit_price]
  try {
    await d1Query(
      `INSERT INTO components (
        id, name, category, package, value, quantity, min_quantity, location,
        notes, unit_price, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      params,
    )
  } catch (error) {
    if (!isLegacyComponentsSchema(error)) throw error
    await d1Query(
      `INSERT INTO components (
        id, name, category, package, value, quantity, min_quantity, location,
        manufacturer, unit_price, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      [...params.slice(0, 8), input.notes, input.unit_price ?? 0],
    )
  }
  return id
}

export async function updateComponent(id: string, input: NewComponent) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()
  const params = [input.name, input.category, input.package, input.value, input.quantity, input.min_quantity, input.location, input.notes, input.unit_price, id]
  try {
    await d1Query(
      `UPDATE components SET name = ?, category = ?, package = ?, value = ?, quantity = ?,
       min_quantity = ?, location = ?, notes = ?, unit_price = ?, updated_at = ${nextVersion}
       WHERE id = ? AND deleted_at IS NULL`,
      params,
    )
  } catch (error) {
    if (!isLegacyComponentsSchema(error)) throw error
    await d1Query(
      `UPDATE components SET name = ?, category = ?, package = ?, value = ?, quantity = ?,
       min_quantity = ?, location = ?, manufacturer = ?, unit_price = ?, updated_at = ${nextVersion}
       WHERE id = ? AND deleted_at IS NULL`,
      params,
    )
  }
}

export async function deleteComponent(id: string) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()
  await d1Query(`UPDATE components SET deleted_at = ${nextVersion}, updated_at = ${nextVersion} WHERE id = ? AND deleted_at IS NULL`, [id])
}

export async function createMovement(input: {
  componentId: string
  type: "in" | "out" | "adjustment"
  quantity: number
  note: string
}) {
  if (!isD1Configured()) throw new Error("D1_NOT_CONFIGURED")
  await ensureSyncSchema()

  const rows = await d1Query<Pick<ComponentItem, "quantity">>(
    "SELECT quantity FROM components WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [input.componentId],
  )
  const current = rows[0]?.quantity
  if (current === undefined) throw new Error("COMPONENT_NOT_FOUND")

  const delta = input.type === "out" ? -input.quantity : input.quantity
  if (current + delta < 0) throw new Error("INSUFFICIENT_STOCK")

  await d1Batch([
    {
      sql: `UPDATE components SET quantity = quantity + ?, updated_at = ${nextVersion} WHERE id = ? AND deleted_at IS NULL`,
      params: [delta, input.componentId],
    },
    {
      sql: `INSERT INTO stock_movements
            (id, component_id, type, quantity, note, created_at)
            SELECT ?, id, ?, ?, ?, updated_at FROM components WHERE id = ? AND deleted_at IS NULL AND changes() > 0`,
      params: [
        crypto.randomUUID(),
        input.type,
        input.quantity,
        input.note,
        input.componentId,
      ],
    },
  ])
}
