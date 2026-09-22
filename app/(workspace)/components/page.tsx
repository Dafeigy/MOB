import { AddComponentDialog } from "@/components/add-component-dialog"
import { InventoryTable } from "@/components/inventory-table"
import { Card } from "@/components/ui/card"
import { getComponents } from "@/lib/inventory"

export const metadata = { title: "元件库存" }

export default async function ComponentsPage() {
  const items = await getComponents()
  const categories = Array.from(new Set(items.map((item) => item.category)))

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em]">元件库存</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            共 {items.length} 种元件，按名称、参数、备注或货位快速检索。
          </p>
        </div>
        <AddComponentDialog categories={categories} />
      </section>
      <Card className="overflow-hidden border-slate-200/80 py-0 shadow-xs">
        <InventoryTable items={items} />
      </Card>
    </div>
  )
}
