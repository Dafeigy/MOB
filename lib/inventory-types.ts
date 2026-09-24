export type ComponentItem = {
  id: string
  name: string
  category: string
  package: string
  value: string
  quantity: number
  min_quantity: number | null
  location: string
  notes: string
  unit_price: number | null
  updated_at: string
}

export type StockMovement = {
  id: string
  component_id: string
  component_name: string
  type: "in" | "out" | "adjustment"
  quantity: number
  note: string
  created_at: string
}

export type StorageBox = {
  id: string
  label: string
  subtitle: string
  created_at: string
  updated_at: string
}

export type NewComponent = Omit<ComponentItem, "id" | "updated_at">

export function inventoryOverview(components: ComponentItem[], movements: StockMovement[], demoMode = false) {
  const categories = new Map<string, number>()
  for (const item of components) categories.set(item.category, (categories.get(item.category) ?? 0) + item.quantity)
  return {
    totalKinds: components.length,
    totalUnits: components.reduce((sum, item) => sum + item.quantity, 0),
    lowStock: components.filter((item) => item.min_quantity !== null && item.quantity <= item.min_quantity),
    inventoryValue: components.reduce((sum, item) => sum + item.quantity * (item.unit_price ?? 0), 0),
    categories: Array.from(categories, ([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    recentMovements: movements.slice(0, 5),
    demoMode,
  }
}

export type InventoryOverview = ReturnType<typeof inventoryOverview>
