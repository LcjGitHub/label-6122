import morseData from '../mock/morse-words.json'

/** 字母/数字 → 摩斯码映射表 */
export const MORSE_MAP: Record<string, string> = morseData.alphabet

/** 摩斯码 → 字母/数字反向映射表 */
export const REVERSE_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([char, code]) => [code, char]),
)

/** 练习用词库 */
export const PRACTICE_WORDS: string[] = morseData.words

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
    if (!/^[.\-]+$/.test(token)) {
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
 * 校验斜杠敲码格式是否合法
 * 规则：仅允许 . - 两种符号，字母间用单斜杠 / 分隔，单词间用双斜杠 // 分隔
 * @param input - 斜杠敲码字符串
 */
export function isValidSlashMorse(input: string): boolean {
  if (!input.trim()) return true
  return /^[.\-\/]+$/.test(input.trim())
}

/**
 * 将斜杠敲码（连续点划串 + 斜杠分隔）解析为文本
 * 规则：
 *   - . 和 - 组成字母的点划序列
 *   - 单斜杠 / 分隔字母
 *   - 双斜杠 // 分隔单词
 *   例：...././.-../.-../---//.--/---/.-./.-../-..  →  HELLO WORLD
 * @param input - 斜杠敲码字符串
 * @returns 解码后的文本
 */
export function slashMorseToText(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  if (!isValidSlashMorse(trimmed)) {
    throw new Error('格式错误：仅允许使用 . - / 三种字符')
  }

  const words = trimmed.split(/\/{2,}/)

  return words
    .map((word) => {
      const letterCodes = word.split('/').filter((code) => code.length > 0)
      return letterCodes
        .map((code) => {
          if (!/^[.\-]+$/.test(code)) {
            throw new Error(`格式错误：无效的点划序列 "${code}"`)
          }
          const char = REVERSE_MORSE_MAP[code]
          if (!char) {
            throw new Error(`无法识别的摩斯码：${code}`)
          }
          return char
        })
        .join('')
    })
    .join(' ')
}
