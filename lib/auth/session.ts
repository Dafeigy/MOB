const SESSION_COOKIE = "retos_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

type SessionPayload = {
  sub: "owner"
  exp: number
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured")
  }

  return secret
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function createSessionToken() {
  const payload: SessionPayload = {
    sub: "owner",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    new TextEncoder().encode(encodedPayload),
  )

  return `${encodedPayload}.${Buffer.from(signature).toString("base64url")}`
}

export async function verifySessionToken(token?: string) {
  if (!token) return false

  const [encodedPayload, encodedSignature] = token.split(".")
  if (!encodedPayload || !encodedSignature) return false

  try {
    const isValid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      Buffer.from(encodedSignature, "base64url"),
      new TextEncoder().encode(encodedPayload),
    )

    if (!isValid) return false

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload
    return payload.sub === "owner" && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export const sessionConfig = {
  cookieName: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE,
}
