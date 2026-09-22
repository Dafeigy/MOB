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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
            <Select
              name="componentId"
              required
              defaultValue=""
            >
              <SelectTrigger id="componentId" className="w-full">
                <SelectValue placeholder="请选择元件" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.value}（现有 {item.quantity}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">操作类型</Label>
              <Select
                name="type"
                defaultValue="in"
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">入库</SelectItem>
                  <SelectItem value="out">出库</SelectItem>
                  <SelectItem value="adjustment">盘点增加</SelectItem>
                </SelectContent>
              </Select>
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
