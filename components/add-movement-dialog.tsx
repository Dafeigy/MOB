"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, PlusIcon } from "lucide-react"

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

export function AddMovementDialog({ items }: { items: ComponentItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage("")
    const data = Object.fromEntries(new FormData(event.currentTarget))

    try {
      const response = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        setMessage(result.message ?? "保存失败。")
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setMessage("网络连接失败，请稍后重试。")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="cursor-pointer" />}>
        <PlusIcon />
        记录流水
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>记录出入库</DialogTitle>
          <DialogDescription>选择元件和操作类型，库存会在保存后自动更新。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="componentId">元件</Label>
            <select
              id="componentId"
              name="componentId"
              required
              defaultValue=""
              className="h-10 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>请选择元件</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.value}（现有 {item.quantity}）
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">操作类型</Label>
              <select
                id="type"
                name="type"
                defaultValue="in"
                className="h-10 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="in">入库</option>
                <option value="out">出库</option>
                <option value="adjustment">盘点增加</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movementQuantity">数量</Label>
              <Input id="movementQuantity" name="quantity" type="number" min="1" step="1" defaultValue="1" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">备注</Label>
            <Textarea id="note" name="note" placeholder="例如：控制板 Rev.C 焊接领用" rows={3} />
          </div>
          {message ? <p className="text-sm text-destructive" role="alert">{message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">取消</Button>
            <Button type="submit" disabled={pending} className="cursor-pointer">
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              保存流水
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
