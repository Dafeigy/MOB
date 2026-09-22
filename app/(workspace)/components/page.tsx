import { ComponentsView } from "@/components/views/components-view"
import { getComponents } from "@/lib/inventory"

export const metadata = { title: "元件库存" }

export default async function Page() {
  const items = await getComponents()
  return <ComponentsView items={items} />
}
