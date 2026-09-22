import { deleteComponent, updateComponent } from "@/lib/inventory"
import { requireSession } from "@/lib/auth/require-session"

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function optionalNumber(value: unknown) {
  return value === "" || value === null || value === undefined ? null : number(value)
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/components/[id]">) {
  await requireSession()
  const { id } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return Response.json({ message: "请求格式无效。" }, { status: 400 })

  const input = {
    name: text(body.name), category: text(body.category), package: text(body.package), value: text(body.value),
    quantity: number(body.quantity), min_quantity: optionalNumber(body.minQuantity), location: text(body.location),
    notes: text(body.notes), unit_price: optionalNumber(body.unitPrice),
  }
  if (!input.name || !input.category || !input.package || (!Number.isSafeInteger(input.quantity) || input.quantity < 0) || (input.min_quantity !== null && (!Number.isSafeInteger(input.min_quantity) || input.min_quantity < 0)) || (input.unit_price !== null && input.unit_price < 0) || Object.values(input).some((value) => typeof value === "number" && !Number.isFinite(value))) {
    return Response.json({ message: "请填写完整且有效的元件信息。" }, { status: 400 })
  }
  try {
    await updateComponent(id, input)
    return Response.json({ ok: true })
  } catch (error) {
    return unavailable(error, "更新元件失败，请稍后重试。")
  }
}

export async function DELETE(_: Request, { params }: RouteContext<"/api/components/[id]">) {
  await requireSession()
  const { id } = await params
  try {
    await deleteComponent(id)
    return Response.json({ ok: true })
  } catch (error) {
    return unavailable(error, "删除元件失败，请稍后重试。")
  }
}

function unavailable(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "D1_NOT_CONFIGURED") {
    return Response.json({ message: "当前为演示模式，无法修改演示数据。" }, { status: 503 })
  }
  return Response.json({ message: fallback }, { status: 500 })
}
