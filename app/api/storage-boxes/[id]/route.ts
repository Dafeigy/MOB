import { deleteStorageBox, updateStorageBox } from "@/lib/inventory"
import { requireSession } from "@/lib/auth/require-session"

function text(value: unknown) { return typeof value === "string" ? value.trim() : "" }

export async function PATCH(request: Request, { params }: RouteContext<"/api/storage-boxes/[id]">) {
  await requireSession()
  const { id } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const label = text(body?.label)
  const subtitle = text(body?.subtitle)
  if (!label || label.length > 80 || subtitle.length > 120) return Response.json({ message: "请填写有效的盒子名称。" }, { status: 400 })
  try {
    await updateStorageBox(id, label, subtitle)
    return Response.json({ ok: true })
  } catch (error) {
    return unavailable(error, "更新收纳盒失败，请稍后重试。")
  }
}

export async function DELETE(_: Request, { params }: RouteContext<"/api/storage-boxes/[id]">) {
  await requireSession()
  const { id } = await params
  try {
    await deleteStorageBox(id)
    return Response.json({ ok: true })
  } catch (error) {
    return unavailable(error, "删除收纳盒失败，请稍后重试。")
  }
}

function unavailable(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "D1_NOT_CONFIGURED") return Response.json({ message: "当前为演示模式，无法修改盒子信息。" }, { status: 503 })
  return Response.json({ message: fallback }, { status: 500 })
}
