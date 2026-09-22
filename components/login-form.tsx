"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useNavigationTransition } from "@/components/navigation-progress"
import { ArrowRightIcon, LockKeyholeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import OtpInput, { type OtpStatus } from "@/components/ui/otp-input"
import { Spinner } from "@/components/ui/spinner"
import { useIsMobile } from "@/hooks/use-mobile"

export function LoginForm() {
  const router = useRouter()
  const startNavigation = useNavigationTransition()
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
        startNavigation(() => {
          router.replace("/dashboard")
          router.refresh()
        })
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
    <div className="w-full max-w-md">
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
        <LockKeyholeIcon className="size-3.5 text-foreground/65" aria-hidden="true" />
        <span>Secure access</span>
      </div>

      <div className="mt-7 space-y-3">
        <p className="font-mono text-[11px] tracking-[0.3em] text-foreground/55 uppercase">
          欢迎回来
        </p>
        <h1 className="font-heading text-3xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
          登录 Retos
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          输入 6 位访问密码，继续管理你的元件库存。
        </p>
      </div>

      <form className="mt-8" onSubmit={handleSubmit} autoComplete="off" data-1p-ignore="true" data-lpignore="true">
        <span className="mb-3 block text-sm font-medium">
          访问密码
        </span>
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
            slotClassName="border border-border bg-background shadow-xs focus-visible:border-foreground/55 focus-visible:ring-foreground/10"
          />
        </div>
        <div className="mt-3 min-h-5" aria-live="polite">
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={pin.length !== 6 || pending || status === "success"}
          className="mt-5 h-11 w-full cursor-pointer bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
        >
          {pending ? (
            <>
              <Spinner className="size-4" />
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
      <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
        仅限已授权用户访问 · 会话将通过安全 Cookie 保持
      </p>
    </div>
  )
}
