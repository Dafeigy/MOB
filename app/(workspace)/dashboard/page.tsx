import { DashboardView } from "@/components/views/dashboard-view"
import { getInventoryOverview } from "@/lib/inventory"

export const metadata = { title: "库存总览" }

export default async function Page() {
  const overview = await getInventoryOverview()
  return <DashboardView overview={overview} />
}
