import morseData from '../mock/morse-words.json'
import { useWordLibraryStore } from '../store/wordLibraryStore'

/** 字母/数字 → 摩斯码映射表 */
export const MORSE_MAP: Record<string, string> = morseData.alphabet

/** 摩斯码 → 字母/数字反向映射表 */
export const REVERSE_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([char, code]) => [code, char]),
)

/** 练习用默认词库 */
export const PRACTICE_WORDS: string[] = morseData.words

/**
 * 获取当前生效的练习词库
 * 优先读取词库状态模块中的用户词库，若为空则回退到默认模拟数据
 */
export function getActivePracticeWords(): string[] {
  const words = useWordLibraryStore.getState().words
  return words.length > 0 ? words : PRACTICE_WORDS
}

/**
 * 将文本编码为摩斯电码
 * @param text - 原始文本
 * @returns 摩斯电码字符串，字母间空格分隔，单词间 `/` 分隔
 */
export function textToMorse(text: string): string {
  const normalized = text.trim().toUpperCase()
  if (!normalized) return ''

  return normalized
    .split(/\s+/)
    .map((word) =>
      word
        .split('')
        .map((char) => {
          const code = MORSE_MAP[char]
          if (!code) {
            throw new Error(`不支持的字符: ${char}`)
          }
          return code
        })
        .join(' '),
    )
    .join(' / ')
}

/**
 * 将摩斯电码解码为文本
 * @param morse - 摩斯电码字符串
 * @returns 解码后的文本
 */
export function morseToText(morse: string): string {
  const trimmed = morse.trim()
  if (!trimmed) return ''

  return trimmed
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((code) => {
          const char = REVERSE_MORSE_MAP[code]
          if (!char) {
            throw new Error(`无效的摩斯码: ${code}`)
          }
          return char
        })
        .join(''),
    )
    .join(' ')
}

/**
 * 校验摩斯电码格式是否合法
 * @param morse - 待校验摩斯电码
 */
export function isValidMorse(morse: string): boolean {
  if (!morse.trim()) return true

  const tokens = morse.trim().split(/\s+/)
  return tokens.every((token) => token === '/' || /^[.-]+$/.test(token))
}

/**
 * 将摩斯码解析为符号序列（用于动画与播放）
 * @param morse - 摩斯电码字符串
 */
export function parseDotDashString(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const tokens = trimmed.split(/\s+/)
  const result: string[] = []

  for (const token of tokens) {
    if (!/^[.-]+$/.test(token)) {
      throw new Error(`无效的点划序列: ${token}`)
    }
    const char = REVERSE_MORSE_MAP[token]
    if (!char) {
      throw new Error(`无法识别的摩斯码: ${token}`)
    }
    result.push(char)
  }

  return result.join('')
}

export function parseMorseSymbols(morse: string): Array<'dot' | 'dash' | 'letterGap' | 'wordGap'> {
  const symbols: Array<'dot' | 'dash' | 'letterGap' | 'wordGap'> = []
  const parts = morse.trim().split(/\s+/)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part === '/') {
      symbols.push('wordGap')
      continue
    }

    for (const ch of part) {
      if (ch === '.') symbols.push('dot')
      else if (ch === '-') symbols.push('dash')
    }

    const next = parts[i + 1]
    if (next && next !== '/') {
      symbols.push('letterGap')
    }
  }

  return symbols
}

/**
 * 贪心解析无分隔符的连续点划串为文本
 * 从左到右按最长优先策略匹配所有字母 A-Z 和数字 0-9
 * 例：...---... → V(...) + O(---) + S(...) → VOS
 * @param input - 仅含 . 和 - 的连续字符串
 * @returns 解码后的文本
 */
export function greedyMorseToText(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  if (!/^[.-]+$/.test(trimmed)) {
    throw new Error('格式错误：仅允许使用点（.）和划（-）')
  }

  const maxLen = Math.max(...Object.keys(REVERSE_MORSE_MAP).map((k) => k.length))
  const result: string[] = []
  let pos = 0

  while (pos < trimmed.length) {
    let matched = false
    for (let len = Math.min(maxLen, trimmed.length - pos); len >= 1; len--) {
      const fragment = trimmed.slice(pos, pos + len)
      const char = REVERSE_MORSE_MAP[fragment]
      if (char) {
        result.push(char)
        pos += len
        matched = true
        break
      }
    }
    if (!matched) {
      const remaining = trimmed.slice(pos)
      throw new Error(
        `无法识别的序列：从位置 ${pos + 1} 起「${remaining.slice(0, maxLen)}」无法匹配任何字符`,
      )
    }
  }

  return result.join('')
}
