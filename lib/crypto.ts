import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12

function integrationSecretKey(): Buffer {
  const raw = process.env.INTEGRATION_SECRET_KEY
  if (!raw) {
    throw new Error(
      "INTEGRATION_SECRET_KEY is required to store integration secrets"
    )
  }

  const decoded = Buffer.from(raw, "base64")
  if (decoded.length === 32) return decoded

  return createHash("sha256").update(raw).digest()
}

export function encryptSecret(secret: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, integrationSecretKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [iv, encrypted, tag]
    .map((part) => part.toString("base64url"))
    .join(".")
}

export function decryptSecret(payload: string): string {
  const [ivText, encryptedText, tagText] = payload.split(".")
  if (!ivText || !encryptedText || !tagText) {
    throw new Error("Invalid encrypted secret payload")
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    integrationSecretKey(),
    Buffer.from(ivText, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagText, "base64url"))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function secretPreview(secret: string): string {
  const trimmed = secret.trim()
  if (trimmed.length <= 8) return "••••"
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`
}
