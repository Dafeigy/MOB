import Link from "next/link"
import {
  AlertTriangleIcon,
  ArrowDownLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BoxesIcon,
  Layers3Icon,
  WalletCardsIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getInventoryOverview } from "@/lib/inventory"

export const metadata = { title: "库存总览" }

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value)
}

export default async function DashboardPage() {
  const overview = await getInventoryOverview()
  const maxCategory = Math.max(...overview.categories.map((item) => item.quantity), 1)

  const stats = [
    {
      label: "元件种类",
      value: formatNumber(overview.totalKinds),
      note: "已建档的物料",
      icon: Layers3Icon,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "在库总数",
      value: formatNumber(overview.totalUnits),
      note: "所有可用元件",
      icon: BoxesIcon,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "低库存",
      value: formatNumber(overview.lowStock.length),
      note: "需要尽快补货",
      icon: AlertTriangleIcon,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "库存估值",
      value: `¥${overview.inventoryValue.toFixed(2)}`,
      note: "按录入单价估算",
      icon: WalletCardsIcon,
      tone: "bg-teal-50 text-teal-700",
    },
  ]

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs tracking-[0.16em] text-emerald-700 uppercase">
            Inventory pulse
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            下午好，工作台已就绪
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            这里是当前元件库的实时摘要和最近变动。
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/movements" />} className="cursor-pointer self-start sm:self-auto">
          记录出入库
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>

      {overview.demoMode ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            当前展示演示数据。填写 Cloudflare D1 环境变量并初始化表结构后，会自动切换为真实库存。
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="gap-5 border-slate-200/80 py-5 shadow-xs">
              <CardContent className="flex items-start justify-between px-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
                </div>
                <span className={`grid size-10 place-items-center rounded-xl ${stat.tone}`}>
                  <Icon className="size-4.5" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>分类库存分布</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">按元件数量统计前五类</p>
            </div>
            <Badge variant="outline">TOP 5</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {overview.categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{category.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatNumber(category.quantity)} pcs
                  </span>
                </div>
                <Progress value={(category.quantity / maxCategory) * 100} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>最近流水</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">最新的库存变化记录</p>
            </div>
            <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/movements" />} className="cursor-pointer">
              查看全部
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {overview.recentMovements.map((movement) => {
              const incoming = movement.type === "in"
              return (
                <div
                  key={movement.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      incoming
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {incoming ? (
                      <ArrowDownLeftIcon className="size-4" />
                    ) : (
                      <ArrowUpRightIcon className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{movement.component_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{movement.note || "无备注"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm font-semibold ${incoming ? "text-emerald-700" : "text-orange-700"}`}>
                      {incoming ? "+" : "−"}{movement.quantity}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{movement.created_at.slice(5, 16)}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
