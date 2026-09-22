import { redirect } from "next/navigation"

import { hasSession } from "@/lib/auth/require-session"

export default async function Home() {
  redirect((await hasSession()) ? "/dashboard" : "/login")
}
