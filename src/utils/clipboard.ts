export interface CopyToClipboardResult {
  success: boolean
  message: string
}

export async function copyToClipboard(text: string): Promise<CopyToClipboardResult> {
  try {
    if (!text) {
      return { success: false, message: '没有可复制的内容' }
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return { success: true, message: '已复制到剪贴板' }
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()

    try {
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (copied) {
        return { success: true, message: '已复制到剪贴板' }
      }
      return { success: false, message: '复制失败，请手动复制' }
    } catch {
      document.body.removeChild(textarea)
      return { success: false, message: '复制失败，请手动复制' }
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '复制失败，请手动复制',
    }
  }
}
