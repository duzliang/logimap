import { nanoid } from 'nanoid'

/**
 * 生成安全的唯一 ID
 * 使用 nanoid 生成 21 字符长度的 URL 安全唯一 ID
 * 比 Date.now() + Math.random() 更可靠，避免高并发下的冲突
 */
export function generateId(): string {
  return nanoid()
}

/**
 * 生成指定长度的唯一 ID
 * @param length ID 长度（默认 10）
 */
export function generateShortId(length: number = 10): string {
  return nanoid(length)
}
