import { redirect } from "next/navigation"

import { AuthParticleField } from "@/components/auth-particle-field"
import { LoginForm } from "@/components/login-form"
import { hasSession } from "@/lib/auth/require-session"

export default async function LoginPage() {
  if (await hasSession()) redirect("/dashboard")

  return (
    <main className="relative grid min-h-svh overflow-hidden bg-[#f7f8f6] lg:grid-cols-[minmax(420px,0.82fr)_1.18fr]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.09),transparent_26%),radial-gradient(circle_at_43%_88%,rgba(15,23,42,0.045),transparent_25%)]" />
      <section className="relative z-10 flex min-h-svh items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <AuthParticleField className="pointer-events-none absolute inset-0 size-full opacity-90" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_12%,#f7f8f6_74%)]" />
        <LoginForm />
      </section>

      <section className="relative hidden overflow-hidden bg-[#101914] p-10 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(110,231,183,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(110,231,183,0.14)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute -right-40 -top-40 size-[34rem] rounded-full border border-emerald-300/10 bg-emerald-400/5 blur-2xl" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center space-y-9 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.3em] text-emerald-300/80 uppercase">
              <span>PCB Component Inventory</span>
              <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
            </div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-white/40 uppercase">
              Retos / Inventory OS
            </p>
            <h2 className="text-5xl leading-[1.05] font-semibold tracking-[-0.045em]">
              每一颗元件，
              <br />
              都在正确的位置。
            </h2>
            <p className="mx-auto max-w-md text-base leading-7 text-white/55">
              从阻容到 MCU，统一记录数量、封装、货位和每一次出入库。
            </p>
          </div>

          <div className="grid w-full max-w-lg grid-cols-3 gap-3">
            {[
              ["1,648", "在库数量"],
              ["06", "元件种类"],
              ["03", "库存提醒"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur"
              >
                <p className="font-mono text-xl font-semibold text-emerald-300">
                  {value}
                </p>
                <p className="mt-1 text-xs text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-10 bottom-10 flex items-center justify-between text-xs text-white/35">
          <span>RETOS / INVENTORY OS</span>
          <span>v0.1</span>
        </div>
      </section>
    </main>
  )
}
