import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { sessionConfig, verifySessionToken } from "@/lib/auth/session"

export async function requireSession() {
  const token = (await cookies()).get(sessionConfig.cookieName)?.value

  if (!(await verifySessionToken(token))) {
    redirect("/login")
  }

  return { name: "本机管理员" }
}

export async function hasSession() {
  const token = (await cookies()).get(sessionConfig.cookieName)?.value
  return verifySessionToken(token)
}
