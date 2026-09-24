import { DashboardView } from "@/components/views/dashboard-view"
import { getComponents, getInventoryOverview, getStorageBoxes } from "@/lib/inventory"

export const metadata = { title: "库存总览" }

export default async function Page() {
  const [overview, items, boxes] = await Promise.all([getInventoryOverview(), getComponents(), getStorageBoxes()])
  return <DashboardView overview={overview} items={items} boxes={boxes} />
}
