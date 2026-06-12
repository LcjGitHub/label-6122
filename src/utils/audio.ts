import { parseMorseSymbols } from './morse'

/** 摩斯播放时序配置（毫秒） */
const TIMING = {
  dot: 100,
  dash: 300,
  letterGap: 300,
  wordGap: 700,
  symbolGap: 100,
  frequency: 600,
} as const

let audioContext: AudioContext | null = null

/**
 * 获取或创建 AudioContext 实例
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

/**
 * 播放指定时长的单音
 * @param durationMs - 持续时间（毫秒）
 */
function playTone(durationMs: number): Promise<void> {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = TIMING.frequency
  gainNode.gain.value = 0.3

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  const now = ctx.currentTime
  const durationSec = durationMs / 1000

  oscillator.start(now)
  oscillator.stop(now + durationSec)

  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

/**
 * 播放完整摩斯电码序列
 * @param morse - 摩斯电码字符串
 * @param onSymbol - 每播放一个符号时的回调
 */
export async function playMorse(
  morse: string,
  onSymbol?: (symbol: 'dot' | 'dash' | 'letterGap' | 'wordGap', index: number) => void,
): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  const symbols = parseMorseSymbols(morse)

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]

    onSymbol?.(symbol, i)

    switch (symbol) {
      case 'dot':
        await playTone(TIMING.dot)
        await delay(TIMING.symbolGap)
        break
      case 'dash':
        await playTone(TIMING.dash)
        await delay(TIMING.symbolGap)
        break
      case 'letterGap':
        await delay(TIMING.letterGap)
        break
      case 'wordGap':
        await delay(TIMING.wordGap)
        break
    }
  }
}

/**
 * 播放单个点或划
 * @param type - 符号类型
 */
export async function playSingleSymbol(type: 'dot' | 'dash'): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  await playTone(type === 'dot' ? TIMING.dot : TIMING.dash)
}

/** 导出时序常量供动画组件使用 */
export { TIMING }

/**
 * 延迟指定毫秒
 * @param ms - 毫秒数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
