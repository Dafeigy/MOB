import type { Metadata } from "next"
import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: {
    default: "Retos · 元件库存管理",
    template: "%s · Retos",
  },
  description: "个人 PCB 焊接元件库存与出入库管理系统",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-svh antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
