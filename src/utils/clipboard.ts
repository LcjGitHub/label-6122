export interface CopyToClipboardResult {
  success: boolean
  message: string
}

/**
 * 将文本复制到系统剪贴板
 * - 优先使用现代 Clipboard API（navigator.clipboard）
 * - 若现代 API 不可用或执行失败，自动回退到传统选区复制（textarea + execCommand）
 * - 统一失败提示：「复制失败，请手动复制」
 * @param text - 待复制的文本内容
 * @returns 复制结果对象，包含 success 状态与 message 提示
 */
export async function copyToClipboard(text: string): Promise<CopyToClipboardResult> {
  if (!text) {
    return { success: false, message: '没有可复制的内容' }
  }

  const fallbackCopy = (content: string): CopyToClipboardResult => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        const copied = document.execCommand('copy')
        if (copied) {
          return { success: true, message: '已复制到剪贴板' }
        }
        return { success: false, message: '复制失败，请手动复制' }
      } catch {
        return { success: false, message: '复制失败，请手动复制' }
      } finally {
        document.body.removeChild(textarea)
      }
    } catch {
      return { success: false, message: '复制失败，请手动复制' }
    }
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return { success: true, message: '已复制到剪贴板' }
      } catch {
        return fallbackCopy(text)
      }
    }
    return fallbackCopy(text)
  } catch {
    return { success: false, message: '复制失败，请手动复制' }
  }
}
