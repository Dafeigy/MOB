"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon, SearchIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditComponentDialog } from "@/components/edit-component-dialog"
import { Input } from "@/components/ui/input"
import { StockMovementDialog } from "@/components/stock-movement-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ComponentItem } from "@/lib/inventory"

const PAGE_SIZE_KEY = "retos-inventory-page-size"
const DEFAULT_PAGE_SIZE = 15
const PAGE_SIZES = [10, 15, 20] as const

export function InventoryTable({ items }: { items: ComponentItem[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "low">("all")
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [page, setPage] = useState(1)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesQuery =
        !normalized ||
        [item.name, item.value, item.category, item.location, item.notes]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      const matchesFilter =
        filter === "all" ||
        (item.min_quantity !== null && item.quantity <= item.min_quantity)
      return matchesQuery && matchesFilter
    })
  }, [filter, items, query])

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY))
    if (PAGE_SIZES.some((size) => size === saved)) {
      const frame = window.requestAnimationFrame(() => setPageSize(saved))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function changePageSize(value: number) {
    setPageSize(value)
    setPage(1)
    window.localStorage.setItem(PAGE_SIZE_KEY, String(value))
  }

  async function remove(item: ComponentItem) {
    setRemovingId(item.id)
    setMessage("")
    try {
      const response = await fetch(`/api/components/${item.id}`, { method: "DELETE" })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) setMessage(result.message ?? `未能删除“${item.name}”。`)
      else window.location.reload()
    } catch {
      setMessage("网络连接失败，请稍后重试。")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="搜索名称、参数、备注或货位…"
            aria-label="搜索元件"
            className="h-10 rounded-xl border-border bg-background pl-9 shadow-none focus-visible:ring-ring/30"
          />
        </div>
        <div className="flex rounded-full border bg-muted/40 p-1">
          {([
            ["all", "全部"],
            ["low", "低库存"],
          ] as const).map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => {
                setFilter(value)
                setPage(1)
              }}
              className={`min-h-8 cursor-pointer rounded-full px-3 text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[14%] text-center">元件</TableHead>
            <TableHead className="hidden w-[16%] text-center lg:table-cell">分类 / 封装</TableHead>
            <TableHead className="w-[16%] text-center">库存状态</TableHead>
            <TableHead className="hidden w-28 text-center xl:table-cell">货位</TableHead>
            <TableHead className="hidden w-40 text-center xl:table-cell">备注说明</TableHead>
            <TableHead className="hidden w-24 text-center lg:table-cell">单价</TableHead>
            <TableHead className="w-44 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleItems.map((item) => {
            const low = item.min_quantity !== null && item.quantity <= item.min_quantity
            return (
              <TableRow key={item.id} className="group transition-colors hover:bg-muted/50">
                <TableCell className="w-[14%] text-center">
                  <div className="min-w-28 max-w-48 text-center">
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.value}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden w-[16%] text-center lg:table-cell">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{item.package}</span>
                  </div>
                </TableCell>
                <TableCell className="w-[16%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-mono text-base font-semibold ${low ? "text-amber-700" : "text-foreground"}`}>
                      {item.quantity}
                    </span>
                    <span className="text-xs text-muted-foreground">pcs</span>
                  </div>
                </TableCell>
                <TableCell className="hidden w-28 text-center xl:table-cell">
                  <span className="font-mono text-xs">{item.location || "—"}</span>
                </TableCell>
                <TableCell className="hidden w-40 text-center xl:table-cell">
                  <Tooltip>
                    <TooltipTrigger
                      render={<p className="line-clamp-2 max-w-40 cursor-help whitespace-normal wrap-break-word text-center text-sm leading-5" />}
                    >
                      {item.notes || "—"}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-72 whitespace-normal wrap-break-word" side="top">
                      {item.notes || "未填写备注说明"}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="hidden w-24 text-center font-mono text-xs lg:table-cell">
                  {item.unit_price === null ? "—" : `¥${item.unit_price.toFixed(3)}`}
                </TableCell>
                <TableCell className="w-44">
                  <div className="flex items-center justify-center gap-1">
                    <EditComponentDialog item={item} />
                    <StockMovementDialog item={item} type="in" />
                    <StockMovementDialog item={item} type="out" />
                    <Dialog>
                      <DialogTrigger render={<Button variant="destructive" size="icon" aria-label={`删除 ${item.name}`} title="删除" className="cursor-pointer" />}>
                        <Trash2Icon />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>删除元件？</DialogTitle>
                          <DialogDescription>
                            将永久删除“{item.name} · {item.value}”及其关联库存流水，此操作无法撤销。
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose render={<Button variant="ghost" className="cursor-pointer" />}>取消</DialogClose>
                          <Button variant="destructive" onClick={() => void remove(item)} disabled={removingId === item.id} className="cursor-pointer">
                            {removingId === item.id ? "正在删除…" : "删除"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {removingId === item.id ? <span className="sr-only">正在删除</span> : null}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {visibleItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                没有找到匹配的元件
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>显示 {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length} 条（共 {items.length} 条）</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span>每页</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" aria-label="每页显示数量" className="cursor-pointer gap-2">
                    {pageSize}
                    <ChevronsUpDownIcon className="text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-20">
                <DropdownMenuRadioGroup
                  value={String(pageSize)}
                  onValueChange={(value) => changePageSize(Number(value))}
                >
                  {PAGE_SIZES.map((size) => (
                    <DropdownMenuRadioItem key={size} value={String(size)} className="cursor-pointer">
                      {size}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <span>条</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="上一页" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-16 text-center">{currentPage} / {pageCount}</span>
            <Button variant="outline" size="icon" aria-label="下一页" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        {message ? <span role="alert" className="text-destructive sm:ml-auto">{message}</span> : null}
      </div>
    </div>
  )
}
