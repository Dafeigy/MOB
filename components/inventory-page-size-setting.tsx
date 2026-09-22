"use client"

import { useEffect, useState } from "react"
import { ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PAGE_SIZE_KEY = "retos-inventory-page-size"
const PAGE_SIZES = [10, 15, 20] as const

export function InventoryPageSizeSetting() {
  const [pageSize, setPageSize] = useState(15)

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY))
    if (PAGE_SIZES.some((size) => size === saved)) {
      const frame = window.requestAnimationFrame(() => setPageSize(saved))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [])

  function updatePageSize(value: number) {
    setPageSize(value)
    window.localStorage.setItem(PAGE_SIZE_KEY, String(value))
  }

  return (
    <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">库存每页显示数量</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">选择元件库存列表每页显示的元件数。</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="h-10 min-w-32 cursor-pointer justify-between rounded-xl">
              {pageSize} 条
              <ChevronsUpDownIcon className="text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-32">
          <DropdownMenuRadioGroup
            value={String(pageSize)}
            onValueChange={(value) => updatePageSize(Number(value))}
          >
            {PAGE_SIZES.map((size) => (
              <DropdownMenuRadioItem key={size} value={String(size)} className="cursor-pointer">
                {size} 条
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
