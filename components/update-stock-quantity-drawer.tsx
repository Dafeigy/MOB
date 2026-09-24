"use client"

import { useEffect, useState } from "react"
import { LoaderCircleIcon } from "lucide-react"

import { actionError, useInventoryActions } from "@/components/inventory-actions"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ComponentItem } from "@/lib/inventory-types"

export function UpdateStockQuantityDrawer({ items, location, open, onOpenChange }: {
  items: ComponentItem[]
  location: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const actions = useInventoryActions()
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "")
  const [quantity, setQuantity] = useState(String(items[0]?.quantity ?? 0))
  const [note, setNote] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0]

  useEffect(() => {
    if (!open) return
    const first = items[0]
    setSelectedId(first?.id ?? "")
    setQuantity(String(first?.quantity ?? 0))
    setNote("")
    setMessage("")
  }, [open, items])

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      const first = items[0]
      setSelectedId(first?.id ?? "")
      setQuantity(String(first?.quantity ?? 0))
      setNote("")
    } else {
      setMessage("")
    }
    onOpenChange(nextOpen)
  }

  function selectItem(item: ComponentItem) {
    setSelectedId(item.id)
    setQuantity(String(item.quantity))
    setMessage("")
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedItem) return
    const parsedQuantity = Number(quantity)
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 0) {
      setMessage("请输入大于或等于 0 的整数。")
      return
    }

    setPending(true)
    setMessage("")
    try {
      await actions.setStockQuantity(selectedItem.id, parsedQuantity, note)
      changeOpen(false)
    } catch (error) {
      setMessage(actionError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={changeOpen} swipeDirection="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>修改库存数量</DrawerTitle>
          <DrawerDescription>{location} · 直接设置元件当前库存。</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-5 px-5 pt-5">
          {items.length > 1 ? (
            <div className="space-y-2">
              <Label>选择元件</Label>
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selectedItem?.id === item.id}
                    onClick={() => selectItem(item)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${selectedItem?.id === item.id ? "border-foreground bg-muted/60" : "hover:bg-muted/40"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.value || item.package}</span>
                    </span>
                    <span className="ml-3 shrink-0 font-mono text-xs text-muted-foreground">{item.quantity} pcs</span>
                  </button>
                ))}
              </div>
            </div>
          ) : selectedItem ? (
            <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
              <p className="font-medium">{selectedItem.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{selectedItem.value || selectedItem.package} · 当前 {selectedItem.quantity} pcs</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="updated-stock-quantity">调整后库存</Label>
            <Input
              id="updated-stock-quantity"
              name="quantity"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updated-stock-note">说明 <span className="text-muted-foreground">（可选）</span></Label>
            <Textarea id="updated-stock-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：盘点后修正、项目领用" rows={3} />
          </div>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
          <DrawerFooter className="-mx-5 sticky bottom-0 mt-6">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)} className="cursor-pointer">取消</Button>
            <Button type="submit" disabled={pending || !selectedItem} className="cursor-pointer">
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              保存库存
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
