"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ComponentItem } from "@/lib/inventory"

const fields = [
  ["name", "元件名称", true], ["category", "分类", true], ["package", "封装", true], ["value", "参数 / 阻容值", false],
  ["location", "货位", false], ["quantity", "当前库存", true], ["minQuantity", "安全库存", false], ["unitPrice", "单价（元）", false],
] as const

export function EditComponentDialog({ item }: { item: ComponentItem }) {
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
      const response = await fetch(`/api/components/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) return setMessage(result.message ?? "保存失败。")
      setOpen(false)
      router.refresh()
    } catch {
      setMessage("网络连接失败，请稍后重试。")
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger render={<Button variant="ghost" size="icon" aria-label={`编辑 ${item.name}`} title={`编辑 ${item.name}`} className="cursor-pointer" />}><PencilIcon /></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>编辑元件</DrawerTitle>
          <DrawerDescription>更新基础资料、库存安全线与货位信息。</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-5 px-5 pt-5">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {fields.map(([name, label, required]) => {
              const value = name === "minQuantity" ? item.min_quantity ?? "" : name === "unitPrice" ? item.unit_price ?? "" : item[name]
              const numeric = name === "quantity" || name === "minQuantity" || name === "unitPrice"
              return <div key={name} className="space-y-2"><Label htmlFor={`edit-${name}`}>{label}{required ? <span className="text-destructive"> *</span> : null}</Label><Input id={`edit-${name}`} name={name} type={numeric ? "number" : "text"} min={numeric ? "0" : undefined} step={name === "unitPrice" ? "0.001" : numeric ? "1" : undefined} defaultValue={value} required={required} /></div>
            })}
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-notes">备注说明</Label><Input id="edit-notes" name="notes" defaultValue={item.notes} placeholder="采购渠道、替代料或使用提示" /></div>
          </div>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
          <DrawerFooter className="-mx-5 sticky bottom-0 mt-6"><DrawerClose render={<Button type="button" variant="outline" className="cursor-pointer" />}>取消</DrawerClose><Button type="submit" disabled={pending} className="cursor-pointer">{pending ? <LoaderCircleIcon className="animate-spin" /> : null}保存修改</Button></DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
