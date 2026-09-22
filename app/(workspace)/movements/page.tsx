import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ClipboardCheckIcon,
} from "lucide-react"

import { AddMovementDialog } from "@/components/add-movement-dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getComponents, getRecentMovements } from "@/lib/inventory"

export const metadata = { title: "出入库" }

const movementLabel = {
  in: "入库",
  out: "出库",
  adjustment: "盘点",
}

export default async function MovementsPage() {
  const [items, movements] = await Promise.all([
    getComponents(),
    getRecentMovements(50),
  ])

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em]">出入库流水</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            保存后会同步更新元件库存，最近记录优先展示。
          </p>
        </div>
        <AddMovementDialog items={items} />
      </section>

      <Card className="overflow-hidden border-slate-200/80 py-0 shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>时间</TableHead>
              <TableHead>元件</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>数量</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => {
              const incoming = movement.type !== "out"
              const Icon = movement.type === "adjustment" ? ClipboardCheckIcon : incoming ? ArrowDownLeftIcon : ArrowUpRightIcon
              return (
                <TableRow key={movement.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {movement.created_at.slice(0, 16)}
                  </TableCell>
                  <TableCell className="font-medium">{movement.component_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={incoming ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-orange-200 bg-orange-50 text-orange-800"}>
                      <Icon data-icon="inline-start" />
                      {movementLabel[movement.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono font-semibold ${incoming ? "text-emerald-700" : "text-orange-700"}`}>
                      {incoming ? "+" : "−"}{movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground">{movement.note || "—"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
