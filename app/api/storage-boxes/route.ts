import { createStorageBox } from "@/lib/inventory"
import { requireSession } from "@/lib/auth/require-session"

function text(value: unknown) { return typeof value === "string" ? value.trim() : "" }

export async function POST(request: Request) {
  await requireSession()
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const id = text(body?.id)
  const label = text(body?.label)
  const subtitle = text(body?.subtitle)
  if (!id || !label || id.length > 64 || label.length > 80 || subtitle.length > 120) return Response.json({ message: "请填写有效的盒子信息。" }, { status: 400 })
  try {
    await createStorageBox(id, label, subtitle)
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "D1_NOT_CONFIGURED") return Response.json({ message: "当前为演示模式，无法修改盒子信息。" }, { status: 503 })
    return Response.json({ message: "新增收纳盒失败，请稍后重试。" }, { status: 500 })
  }
}
