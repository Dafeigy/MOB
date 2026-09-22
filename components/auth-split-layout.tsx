import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AuthSplitLayoutProps = {
  visual: ReactNode
  children: ReactNode
  className?: string
}

export function AuthSplitLayout({
  visual,
  children,
  className,
}: AuthSplitLayoutProps) {
  return (
    <main
      className={cn(
        "relative min-h-svh overflow-hidden bg-background text-foreground 2xl:flex 2xl:items-center 2xl:justify-center 2xl:p-6",
        className,
      )}
    >
      <div className="relative mx-auto flex min-h-svh w-full max-w-[1600px] bg-background 2xl:min-h-0 2xl:w-[min(94vw,calc(92svh*16/9))] 2xl:aspect-[16/9] 2xl:overflow-hidden 2xl:rounded-2xl 2xl:border 2xl:border-border/70 2xl:shadow-[0_25px_80px_-28px_rgba(15,23,42,0.28)]">
        <section className="relative hidden flex-1 overflow-hidden border-r border-border/60 bg-[#f8f8f6] dark:bg-muted/30 lg:block">
          {visual}
        </section>
        <section className="relative flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:w-[620px] lg:px-16">
          {children}
        </section>
      </div>
    </main>
  )
}
