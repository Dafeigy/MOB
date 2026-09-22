import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { LoaderCircleIcon } from "lucide-react"
import { actionError } from "@/components/inventory-actions"
import { InventoryPageSizeSetting } from "@/components/inventory-page-size-setting"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseCloudEnv, type CloudConfig } from "./api"

export function DesktopSettings({ onSaved }: { onSaved: () => Promise<void> }) {
  const [config, setConfig] = useState<CloudConfig | null>(null)
  const [account, setAccount] = useState("")
  const [database, setDatabase] = useState("")
  const [token, setToken] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [failed, setFailed] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [env, setEnv] = useState("")
  const [pasteError, setPasteError] = useState("")

  useEffect(() => {
    let active = true
    invoke<CloudConfig>("cloud_config").then((value) => {
      if (active) { setConfig(value); setAccount(value.account_id); setDatabase(value.database_id) }
    }).catch((error) => { if (active) { setMessage(actionError(error)); setFailed(true) } })
    return () => { active = false }
  }, [])

  async function save(test = false) {
    setPending(true); setMessage(""); setFailed(false)
    try {
      await invoke("save_cloud_config", { input: { account_id: account, database_id: database, api_token: token } })
      setToken("")
      setConfig(await invoke<CloudConfig>("cloud_config"))
      await onSaved()
      if (test) await invoke("test_cloud_connection")
      setMessage(test ? "连接成功" : "已保存")
    } catch (error) { setMessage(actionError(error)); setFailed(true) }
    finally { setPending(false) }
  }

  function importEnv() {
    try {
      const values = parseCloudEnv(env)
      if (values.CLOUDFLARE_ACCOUNT_ID !== undefined) setAccount(values.CLOUDFLARE_ACCOUNT_ID)
      if (values.CLOUDFLARE_D1_DATABASE_ID !== undefined) setDatabase(values.CLOUDFLARE_D1_DATABASE_ID)
      if (values.CLOUDFLARE_D1_API_TOKEN !== undefined) setToken(values.CLOUDFLARE_D1_API_TOKEN)
      setEnv(""); setPasteError(""); setPasteOpen(false)
    } catch (error) { setPasteError(actionError(error)) }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-[-0.035em]">系统设置</h2>
      <Card className="border-border shadow-xs"><CardHeader><CardTitle>库存显示</CardTitle></CardHeader><CardContent className="p-0"><InventoryPageSizeSetting /></CardContent></Card>
      <Card className="border-border shadow-xs">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>云端同步</CardTitle><Button variant="outline" size="sm" className="cursor-pointer" disabled={pending || !config} onClick={() => setPasteOpen(true)}>粘贴配置</Button></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save() }}>
            <div className="space-y-2"><Label htmlFor="cloud-account">Account ID</Label><Input id="cloud-account" autoComplete="off" value={account} onChange={(e) => setAccount(e.target.value)} required disabled={pending || !config} /></div>
            <div className="space-y-2"><Label htmlFor="cloud-database">Database ID</Label><Input id="cloud-database" autoComplete="off" value={database} onChange={(e) => setDatabase(e.target.value)} required disabled={pending || !config} /></div>
            <div className="space-y-2"><Label htmlFor="cloud-token">API Token</Label><Input id="cloud-token" type="password" autoComplete="new-password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={config?.has_token ? "已保存，留空保持不变" : ""} required={!config?.has_token} disabled={pending || !config} /></div>
            <div className="flex flex-wrap items-center gap-3"><Button type="submit" className="cursor-pointer" disabled={pending || !config}>{pending ? <LoaderCircleIcon className="animate-spin" /> : null}保存</Button><Button type="button" variant="outline" className="cursor-pointer" disabled={pending || !config} onClick={() => void save(true)}>测试连接</Button>{message ? <span role={failed ? "alert" : "status"} className={`text-sm ${failed ? "text-destructive" : "text-muted-foreground"}`}>{message}</span> : null}</div>
          </form>
        </CardContent>
      </Card>
      <Dialog open={pasteOpen} onOpenChange={(open) => { setPasteOpen(open); if (!open) { setEnv(""); setPasteError("") } }}>
        <DialogContent><DialogHeader><DialogTitle>粘贴配置</DialogTitle><DialogDescription className="sr-only">从 .env.local 导入 Cloudflare 连接配置</DialogDescription></DialogHeader><Label htmlFor="cloud-env">.env.local</Label><Textarea id="cloud-env" autoComplete="off" spellCheck={false} value={env} onChange={(e) => setEnv(e.target.value)} rows={7} />{pasteError ? <p role="alert" className="text-sm text-destructive">{pasteError}</p> : null}<DialogFooter><Button className="cursor-pointer" onClick={importEnv}>导入</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}
