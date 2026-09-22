import { cookies } from "next/headers"

import { createSessionToken, sessionConfig } from "@/lib/auth/session"

function safeEqual(left: string, right: string) {
  const encoder = new TextEncoder()
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  const length = Math.max(leftBytes.length, rightBytes.length)
  let difference = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return difference === 0
}

export async function POST(request: Request) {
  const configuredPin = process.env.APP_PIN

  if (!configuredPin) {
    return Response.json(
      { message: "服务器尚未配置 APP_PIN。" },
      { status: 503 },
    )
  }

  const body = (await request.json().catch(() => null)) as
    | { pin?: unknown }
    | null
  const pin = typeof body?.pin === "string" ? body.pin : ""

  if (!/^\d{6}$/.test(pin) || !safeEqual(pin, configuredPin)) {
    return Response.json({ message: "访问密码不正确，请重试。" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(sessionConfig.cookieName, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionConfig.maxAge,
  })

  return Response.json({ ok: true })
}
