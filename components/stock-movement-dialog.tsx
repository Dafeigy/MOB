"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImportIcon, ArrowUpRight, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ComponentItem } from "@/lib/inventory"

type MovementType = "in" | "out"

export function StockMovementDialog({ item, type }: { item: ComponentItem; type: MovementType }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const inbound = type === "in"
  const label = inbound ? "入库" : "出库"
  const Icon = inbound ? ImportIcon : ArrowUpRight

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setMessage("")
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage("")
    const data = Object.fromEntries(new FormData(event.currentTarget))

    try {
      const response = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, componentId: item.id, type }),
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        setMessage(result.message ?? `${label}失败，请稍后重试。`)
        return
      }
      changeOpen(false)
      router.refresh()
    } catch {
      setMessage("网络连接失败，请稍后重试。")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label={`${item.name}${label}`} title={label} className="cursor-pointer" />}>
        <Icon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}元件</DialogTitle>
          <DialogDescription>
            {item.name} · {item.value}（当前库存 {item.quantity}）
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`${type}-${item.id}-quantity`}>{label}数量</Label>
            <Input id={`${type}-${item.id}-quantity`} name="quantity" type="number" min="1" step="1" defaultValue="1" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${type}-${item.id}-note`}>备注</Label>
            <Textarea id={`${type}-${item.id}-note`} name="note" placeholder={inbound ? "例如：采购补货" : "例如：项目领用"} rows={3} />
          </div>
          {message ? <p className="text-sm text-destructive" role="alert">{message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => changeOpen(false)} className="cursor-pointer">取消</Button>
            <Button type="submit" disabled={pending} className="cursor-pointer">
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              确认{label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
