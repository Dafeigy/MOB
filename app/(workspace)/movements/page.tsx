import { MovementsView } from "@/components/views/movements-view"
import { getComponents, getRecentMovements } from "@/lib/inventory"

export const metadata = { title: "出入库" }

export default async function Page() {
  const [items, movements] = await Promise.all([
    getComponents(),
    getRecentMovements(50),
  ])
  return <MovementsView items={items} movements={movements} />
}
