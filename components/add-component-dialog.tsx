"use client"

import { useMemo, useState } from "react"
import { useInventoryActions, actionError } from "@/components/inventory-actions"
import { LoaderCircleIcon, PlusIcon, TagIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const defaultCategories = ["电容", "电阻", "电感", "芯片", "其他"]
const fields = [
  ["name", "元件名称", "例如：贴片电阻", true],
  ["package", "封装", "例如：0603", true],
  ["value", "参数 / 阻容值", "例如：10 kΩ ±1%", false],
  ["location", "货位", "例如：A-01-03", false],
] as const

export function AddComponentDialog({ categories }: { categories: string[] }) {
  const actions = useInventoryActions()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState("")
  const [categoryInput, setCategoryInput] = useState("")
  const options = useMemo(() => Array.from(new Set([...defaultCategories, ...categories])).filter(Boolean), [categories])

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory)
    setCategoryInput("")
    setMessage("")
  }

  function addTypedCategory() {
    const nextCategory = categoryInput.trim()
    if (nextCategory) selectCategory(nextCategory)
  }

  function closeDialog(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setMessage("")
      setCategory("")
      setCategoryInput("")
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!category) {
      setMessage("请选择分类，或输入新分类后按回车确认。")
      return
    }
    setPending(true)
    setMessage("")
    const data = Object.fromEntries(new FormData(event.currentTarget))
    data.category = category
    try {
      await actions.createComponent(data)
      closeDialog(false)
    } catch (error) {
      setMessage(actionError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={closeDialog} swipeDirection="right">
      <DrawerTrigger render={<Button className="cursor-pointer" />}><PlusIcon />新增元件</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>新增元件</DrawerTitle>
          <DrawerDescription>名称可重复；以分类、封装与参数区分不同器件。</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-5 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-input">分类 <span className="text-destructive">*</span></Label>
              <div className="rounded-2xl border bg-input/20 p-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <Button key={option} type="button" variant={category === option ? "default" : "outline"} size="xs" onClick={() => selectCategory(option)} className="cursor-pointer">
                      {option}
                    </Button>
                  ))}
                  {category && !options.includes(category) ? <Badge variant="secondary"><TagIcon />{category}</Badge> : null}
                </div>
                <Input
                  id="category-input"
                  value={categoryInput}
                  onChange={(event) => setCategoryInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTypedCategory() } }}
                  placeholder="没有合适的分类？输入后按回车新增"
                  className="mt-3 border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
                  aria-describedby="category-help"
                />
              </div>
              <p id="category-help" className="text-xs text-muted-foreground">单选。可选已有 Tag，或输入新 Tag 后按回车。</p>
            </div>
            {fields.map(([name, label, placeholder, required]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label} {required ? <span className="text-destructive">*</span> : null}</Label>
                <Input id={name} name={name} placeholder={placeholder} required={required} />
              </div>
            ))}
            <div className="space-y-2"><Label htmlFor="quantity">初始库存</Label><Input id="quantity" name="quantity" type="number" min="0" step="1" defaultValue="0" required /></div>
            <div className="space-y-2"><Label htmlFor="minQuantity">安全库存</Label><Input id="minQuantity" name="minQuantity" type="number" min="0" step="1" placeholder="可留空" /></div>
            <div className="space-y-2"><Label htmlFor="unitPrice">单价（元）</Label><Input id="unitPrice" name="unitPrice" type="number" min="0" step="0.001" placeholder="可留空" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">备注说明</Label><Input id="notes" name="notes" placeholder="例如：采购渠道、替代料或使用提示" /></div>
          </div>
          {message ? <p className="text-sm text-destructive" role="alert">{message}</p> : null}
          <DrawerFooter className="-mx-5 sticky bottom-0 mt-6">
            <DrawerClose render={<Button type="button" variant="outline" className="cursor-pointer" />}>取消</DrawerClose>
            <Button type="submit" disabled={pending} className="cursor-pointer">{pending ? <LoaderCircleIcon className="animate-spin" /> : null}保存元件</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
