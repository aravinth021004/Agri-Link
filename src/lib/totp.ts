import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'

const ISSUER = 'AgriLink'

export function generateTotpSecret(): string {
  return generateSecret()
}

export async function generateQrCodeDataUrl(email: string, secret: string): Promise<string> {
  const otpauth = generateURI({
    secret,
    issuer: ISSUER,
    label: email,
  })
  return QRCode.toDataURL(otpauth)
}

export function verifyTotpCode(secret: string, token: string): boolean {
  const result = verifySync({ secret, token })
  return result.valid
}
