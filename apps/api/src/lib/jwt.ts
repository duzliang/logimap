import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const expires = process.env.JWT_EXPIRES_IN || '7d'

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload
}
