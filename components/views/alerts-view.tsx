"use client"

import { NavigationLink as Link } from "@/components/navigation-link"
import { AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ComponentItem } from "@/lib/inventory-types"


export function AlertsView({ items }: { items: ComponentItem[] }) {
  const lowStock = items
    .filter((item) => item.min_quantity !== null && item.quantity <= item.min_quantity)
    .sort(
      (a, b) =>
        a.quantity / Math.max(a.min_quantity ?? 1, 1) -
        b.quantity / Math.max(b.min_quantity ?? 1, 1),
    )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-[-0.035em]">库存提醒</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          库存量低于或等于安全线时会出现在这里。
        </p>
      </section>

      {lowStock.length ? (
        <div className="space-y-3">
          {lowStock.map((item) => {
            const minimum = item.min_quantity ?? 0
            const ratio = Math.min((item.quantity / Math.max(minimum, 1)) * 100, 100)
            return (
              <Card key={item.id} className="border-border py-0 shadow-xs">
                <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                    <AlertTriangleIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{item.name} · {item.value}</h3>
                      <Badge variant="secondary">{item.package}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={ratio} className="max-w-sm flex-1 gap-0 [&_[data-slot=progress-indicator]]:bg-amber-500 [&_[data-slot=progress-track]]:h-2" />
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {item.quantity} / {minimum}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      货位 {item.location || "未设置"} · 建议补充至少 {Math.max(minimum * 2 - item.quantity, minimum)} pcs
                    </p>
                  </div>
                  <Button nativeButton={false} variant="outline" size="sm" render={<Link href="/movements" />} className="cursor-pointer">
                    去入库
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border shadow-xs">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-foreground">
              <CheckCircle2Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-medium">库存状态良好</h3>
            <p className="mt-2 text-sm text-muted-foreground">当前没有低于安全线的元件。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
