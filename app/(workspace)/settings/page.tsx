import { CheckCircle2Icon, CloudIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isD1Configured } from "@/lib/d1"

export const metadata = { title: "系统设置" }

export default function SettingsPage() {
  const d1Configured = isD1Configured()
  const pinConfigured = Boolean(process.env.APP_PIN)
  const sessionConfigured = Boolean(process.env.SESSION_SECRET)

  const checks = [
    {
      label: "数字访问密码",
      description: "由 APP_PIN 提供，仅在服务器端校验。",
      ready: pinConfigured,
      icon: KeyRoundIcon,
    },
    {
      label: "会话签名密钥",
      description: "由 SESSION_SECRET 提供，用于签名 HttpOnly Cookie。",
      ready: sessionConfigured,
      icon: ShieldCheckIcon,
    },
    {
      label: "Cloudflare D1",
      description: "需要 Account ID、Database ID 和具有 D1 权限的 API Token。",
      ready: d1Configured,
      icon: CloudIcon,
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-[-0.035em]">系统设置</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Retos 从服务器环境变量加载敏感配置，浏览器不会收到密码和 D1 Token。
        </p>
      </section>

      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader>
          <CardTitle>配置检查</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {checks.map((check) => {
            const Icon = check.icon
            return (
              <div key={check.label} className="flex items-start gap-4 px-6 py-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{check.label}</p>
                    <Badge variant="outline" className={check.ready ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}>
                      {check.ready ? "已配置" : "待配置"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{check.description}</p>
                </div>
                {check.ready ? <CheckCircle2Icon className="mt-1 size-5 text-emerald-600" /> : null}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader>
          <CardTitle>初始化 D1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            先在 Cloudflare 创建 D1 数据库，再执行项目中的
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">scripts/d1-schema.sql</code>
            创建表和索引。
          </p>
          <div className="rounded-2xl border bg-slate-950 p-4 font-mono text-xs text-slate-300">
            npx wrangler d1 execute &lt;DATABASE_NAME&gt; --remote --file=./scripts/d1-schema.sql
          </div>
          <p>随后将三个 D1 凭据写入部署平台环境变量并重新部署即可。</p>
        </CardContent>
      </Card>
    </div>
  )
}
