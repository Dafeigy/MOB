"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import OtpInput, { type OtpStatus } from "@/components/ui/otp-input"
import { useIsMobile } from "@/hooks/use-mobile"

export function LoginForm() {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [status, setStatus] = useState<OtpStatus>("idle")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const requestInFlight = useRef(false)
  const isMobile = useIsMobile()

  async function tryLogin(code: string) {
    if (code.length !== 6 || requestInFlight.current) return

    requestInFlight.current = true
    setPending(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      })
      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        setStatus("error")
        setMessage(result.message ?? "验证失败，请重试。")
        setPin("")
        window.setTimeout(() => setStatus("idle"), 650)
        return
      }

      setStatus("success")
      window.setTimeout(() => {
        router.replace("/dashboard")
        router.refresh()
      }, 420)
    } catch {
      setStatus("error")
      setMessage("暂时无法连接服务器，请检查网络。")
      setPin("")
      window.setTimeout(() => setStatus("idle"), 650)
    } finally {
      requestInFlight.current = false
      setPending(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await tryLogin(pin)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-emerald-700 uppercase">
        <span>Access</span>
        <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
        <span>01 / 01</span>
      </div>

      <div className="mt-8 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
          输入访问密码
        </h1>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          请输入 6 位数字密码以进入元件库存。
        </p>
      </div>

      <form className="mt-9" onSubmit={handleSubmit} autoComplete="off" data-1p-ignore="true" data-lpignore="true">
        <span className="mb-3 block text-sm font-medium">数字密码</span>
        <div className="max-w-full overflow-visible px-0.5 py-1">
          <OtpInput
            length={6}
            value={pin}
            onChange={(value) => {
              setPin(value)
              setStatus("idle")
              setMessage("")
            }}
            onComplete={tryLogin}
            type="numbers"
            size={isMobile ? "sm" : "md"}
            status={status}
            mask
            autoFocus
            disabled={pending || status === "success"}
            aria-label="六位数字密码"
            slotClassName="border border-slate-200 bg-white shadow-xs focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
          />
        </div>
        <div className="mt-3 min-h-5" aria-live="polite">
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={pin.length !== 6 || pending || status === "success"}
          className="mt-6 w-full cursor-pointer bg-[#102019] text-white shadow-sm transition-colors hover:bg-[#1a3428]"
        >
          {pending ? (
            <>
              <LoaderCircleIcon className="animate-spin" />
              正在验证
            </>
          ) : (
            <>
              进入 Retos
              <ArrowRightIcon data-icon="inline-end" />
            </>
          )}
        </Button>
      </form>

    </div>
  )
}
