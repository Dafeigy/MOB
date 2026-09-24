import { requireSession } from "@/lib/auth/require-session"
import { setStockQuantity } from "@/lib/inventory"

export async function PATCH(request: Request, { params }: RouteContext<"/api/components/[id]/stock">) {
  await requireSession()
  const { id } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const quantity = Number(body?.quantity)
  const note = typeof body?.note === "string" ? body.note.trim() : ""
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    return Response.json({ message: "请填写有效的库存数量。" }, { status: 400 })
  }

  try {
    await setStockQuantity(id, quantity, note)
    return Response.json({ ok: true })
  } catch (error) {
    const code = error instanceof Error ? error.message : ""
    if (code === "D1_NOT_CONFIGURED") {
      return Response.json({ message: "当前为演示模式，无法修改演示数据。" }, { status: 503 })
    }
    if (code === "COMPONENT_NOT_FOUND") {
      return Response.json({ message: "没有找到该元件。" }, { status: 404 })
    }
    return Response.json({ message: "修改库存失败，请稍后重试。" }, { status: 500 })
  }
}
