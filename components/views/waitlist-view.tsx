"use client"

import { useEffect, useRef } from "react"
import { ArrowLeftIcon, SparklesIcon } from "lucide-react"

import { NavigationLink as Link } from "@/components/navigation-link"
import {
  ParticleField,
  bumpParticleTypingImpulse,
} from "@/components/ui/particle-fields"

export function WaitlistView() {
  const typingImpulse = useRef(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      bumpParticleTypingImpulse(typingImpulse, event)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <section className="relative isolate -m-4 min-h-[calc(100dvh-4rem)] overflow-hidden sm:-m-6 lg:-m-8">
      <div className="absolute inset-0" aria-hidden="true">
        <ParticleField
          src="/particle-brain.png"
          sampleStep={3}
          threshold={82}
          dotSize={0.95}
          renderScale={0.7}
          align="center"
          mouseForce={12}
          mouseRadius={32}
          denseParticles
          typingImpulseRef={typingImpulse}
          className="size-full opacity-80 dark:opacity-90"
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_32%,color-mix(in_srgb,var(--background)_74%,transparent)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-b from-transparent via-background/75 to-background"
      />

      <div className="absolute items-center bottom-[40vh] justify-center inset-x-0 z-10 flex flex-col  px-6 pb-10 text-center sm:pb-14">
        {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/65 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground shadow-sm backdrop-blur-md">
          <CircleDashedIcon className="size-3.5 animate-[spin_8s_linear_infinite]" aria-hidden="true" />
          Building in public
        </div> */}

        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
          一些新功能仍在开发中。
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          我们正在把库存数据变成更聪明、更有生命力的工作流。这个空间会优先展示仍在实验中的功能。
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background shadow-sm transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            回到库存总览
          </Link>
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border/80 bg-background/70 px-4 text-sm text-muted-foreground backdrop-blur-md">
            <SparklesIcon className="size-4" aria-hidden="true" />
            近期开放
          </span>
        </div>
      </div>
    </section>
  )
}
export default WaitlistView
