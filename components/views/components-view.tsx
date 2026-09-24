"use client"

import { AddComponentDialog } from "@/components/add-component-dialog"
import { InventoryTable } from "@/components/inventory-table"
import { Card } from "@/components/ui/card"
import type { ComponentItem } from "@/lib/inventory-types"


export function ComponentsView({ items, actions }: { items: ComponentItem[]; actions?: React.ReactNode }) {
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
        <div className="flex flex-wrap items-center gap-2">{actions}<AddComponentDialog categories={categories} items={items} /></div>
      </section>
      <Card className="overflow-hidden border-border py-0 shadow-xs">
        <InventoryTable items={items} />
      </Card>
    </div>
  )
}
