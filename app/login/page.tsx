import { redirect } from "next/navigation"

import { AuthSplitLayout } from "@/components/auth-split-layout"
import { LoginForm } from "@/components/login-form"
import { ParticleField } from "@/components/ui/particle-fields"
import { hasSession } from "@/lib/auth/require-session"

export default async function LoginPage() {
  if (await hasSession()) redirect("/dashboard")

  return (
    <AuthSplitLayout
      visual={
        <>
          <ParticleField
            src="/auth-particle-source.png"
            sampleStep={3}
            threshold={24}
            renderScale={1.035}
            align="center"
            mouseForce={12}
            mouseRadius={32}
            denseParticles
            className="absolute inset-0 size-full opacity-90"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_52%_42%,transparent_42%,rgba(248,248,246,0.46)_72%,rgba(248,248,246,0.94)_100%)] dark:bg-[radial-gradient(ellipse_at_52%_42%,transparent_42%,rgba(38,38,38,0.4)_72%,rgba(25,25,25,0.92)_100%)]" />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-10 xl:p-12">
            <div className="flex items-center gap-2 font-mono text-xs tracking-[0.22em] uppercase">
              <span className="size-2 rounded-full bg-foreground" aria-hidden="true" />
              <span>Retos / Inventory OS</span>
            </div>

            <div className="max-w-md">
              <p className="font-mono text-[11px] tracking-[0.3em] text-foreground/55 uppercase">
                PCB Component Inventory
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] xl:text-4xl">
                每一颗元件，
                <br />
                都在正确的位置。
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                统一记录数量、封装、货位和每一次出入库，让下一次焊接从容开始。
              </p>
            </div>
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthSplitLayout>
  )
}
