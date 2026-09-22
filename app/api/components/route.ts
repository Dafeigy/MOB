import { createComponent } from "@/lib/inventory"
import { requireSession } from "@/lib/auth/require-session"

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function asOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null
  return asNumber(value)
}

export async function POST(request: Request) {
  await requireSession()
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null

  if (!body) return Response.json({ message: "请求格式无效。" }, { status: 400 })

  const input = {
    name: asText(body.name),
    category: asText(body.category),
    package: asText(body.package),
    value: asText(body.value),
    quantity: asNumber(body.quantity),
    min_quantity: asOptionalNumber(body.minQuantity),
    location: asText(body.location),
    notes: asText(body.notes),
    unit_price: asOptionalNumber(body.unitPrice),
  }

  if (
    !input.name ||
    !input.category ||
    !input.package ||
    input.quantity < 0 ||
    (input.min_quantity !== null && input.min_quantity < 0) ||
    (input.unit_price !== null && input.unit_price < 0) ||
    Object.values(input).some((value) =>
      typeof value === "number" ? !Number.isFinite(value) : false,
    )
  ) {
    return Response.json({ message: "请填写完整且有效的元件信息。" }, { status: 400 })
  }

  try {
    const id = await createComponent(input)
    return Response.json({ id }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "D1_NOT_CONFIGURED") {
      return Response.json(
        { message: "当前为演示模式，请先在环境变量中配置 Cloudflare D1。" },
        { status: 503 },
      )
    }
    if (
      error instanceof Error &&
      /permission|not authorized|unauthorized/i.test(error.message)
    ) {
      return Response.json(
        {
          message:
            "Cloudflare D1 API Token 没有写入权限，请为该账户授予 D1 Edit 权限后重试。",
        },
        { status: 503 },
      )
    }
    return Response.json({ message: "保存元件失败，请稍后重试。" }, { status: 500 })
  }
}
