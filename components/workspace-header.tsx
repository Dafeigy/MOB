"use client"

import { usePathname } from "next/navigation"
import { DatabaseIcon } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "库存总览", description: "掌握元件库存的整体状态" },
  "/components": { title: "元件库存", description: "查找、录入与维护所有元件" },
  "/movements": { title: "出入库", description: "记录每一次库存变化" },
  "/alerts": { title: "库存提醒", description: "及时处理低于安全线的元件" },
  "/settings": { title: "系统设置", description: "检查登录与数据库连接状态" },
}

export function WorkspaceHeader({ demoMode }: { demoMode: boolean }) {
  const pathname = usePathname()
  const page = pageTitles[pathname] ?? pageTitles["/dashboard"]

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/88 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator orientation="vertical" className="data-vertical:h-5" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{page.title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {page.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
        <DatabaseIcon className="size-3.5" />
        <span className={demoMode ? "text-amber-700" : "text-emerald-700"}>
          {demoMode ? "演示数据" : "D1 已连接"}
        </span>
      </div>
    </header>
  )
}
