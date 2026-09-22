import { requireSession } from "@/lib/auth/require-session"
import { createMovement } from "@/lib/inventory"

export async function POST(request: Request) {
  await requireSession()
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null
  const componentId = typeof body?.componentId === "string" ? body.componentId : ""
  const type = body?.type
  const quantity = Number(body?.quantity)
  const note = typeof body?.note === "string" ? body.note.trim() : ""

  if (
    !componentId ||
    !["in", "out", "adjustment"].includes(String(type)) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return Response.json({ message: "请填写有效的出入库信息。" }, { status: 400 })
  }

  try {
    await createMovement({
      componentId,
      type: type as "in" | "out" | "adjustment",
      quantity,
      note,
    })
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : ""
    if (code === "D1_NOT_CONFIGURED") {
      return Response.json(
        { message: "当前为演示模式，请先在环境变量中配置 Cloudflare D1。" },
        { status: 503 },
      )
    }
    if (code === "INSUFFICIENT_STOCK") {
      return Response.json({ message: "库存不足，无法完成出库。" }, { status: 409 })
    }
    if (code === "COMPONENT_NOT_FOUND") {
      return Response.json({ message: "没有找到该元件。" }, { status: 404 })
    }
    return Response.json({ message: "记录流水失败，请稍后重试。" }, { status: 500 })
  }
}
