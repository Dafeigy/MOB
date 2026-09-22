import { AlertsView } from "@/components/views/alerts-view"
import { getComponents } from "@/lib/inventory"

export const metadata = { title: "库存提醒" }

export default async function Page() {
  const items = await getComponents()
  return <AlertsView items={items} />
}
