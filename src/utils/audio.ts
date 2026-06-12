import { parseMorseSymbols, MORSE_MAP } from './morse'
import { getTimingFromSettings, type AudioSettings } from '../store/audioSettingsStore'

const DEFAULT_SETTINGS: AudioSettings = { speed: 'normal', pitch: 'mid' }

const DEFAULT_TIMING = getTimingFromSettings(DEFAULT_SETTINGS)

let audioContext: AudioContext | null = null
let playCancelled = false
let currentOscillator: OscillatorNode | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function playTone(durationMs: number, frequency: number): Promise<void> {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gainNode.gain.value = 0.3

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  const now = ctx.currentTime
  const durationSec = durationMs / 1000

  oscillator.start(now)
  oscillator.stop(now + durationSec)
  currentOscillator = oscillator

  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

export interface MorseTiming {
  dot: number
  dash: number
  letterGap: number
  wordGap: number
  symbolGap: number
  frequency: number
}

export async function playMorse(
  morse: string,
  onSymbol?: (symbol: 'dot' | 'dash' | 'letterGap' | 'wordGap', index: number) => void,
  settings?: AudioSettings,
): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  const timing = settings ? getTimingFromSettings(settings) : DEFAULT_TIMING
  const symbols = parseMorseSymbols(morse)
  playCancelled = false

  for (let i = 0; i < symbols.length; i++) {
    if (playCancelled) break

    const symbol = symbols[i]

    onSymbol?.(symbol, i)

    switch (symbol) {
      case 'dot':
        await playTone(timing.dot, timing.frequency)
        await delay(timing.symbolGap)
        break
      case 'dash':
        await playTone(timing.dash, timing.frequency)
        await delay(timing.symbolGap)
        break
      case 'letterGap':
        await delay(timing.letterGap)
        break
      case 'wordGap':
        await delay(timing.wordGap)
        break
    }
  }
}

export function stopPlay(): void {
  playCancelled = true
  if (currentOscillator) {
    try {
      currentOscillator.stop()
    } catch {
      // ignore if already stopped
    }
    currentOscillator = null
  }
}

export async function playSingleSymbol(
  type: 'dot' | 'dash',
  settings?: AudioSettings,
): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  const timing = settings ? getTimingFromSettings(settings) : DEFAULT_TIMING
  await playTone(type === 'dot' ? timing.dot : timing.dash, timing.frequency)
}

export async function playChar(
  char: string,
  onSymbol?: (symbol: 'dot' | 'dash' | 'letterGap' | 'wordGap', index: number) => void,
  settings?: AudioSettings,
): Promise<void> {
  const morse = MORSE_MAP[char.toUpperCase()]
  if (!morse) return
  await playMorse(morse, onSymbol, settings)
}

export function getTiming(settings?: AudioSettings): MorseTiming {
  return settings ? getTimingFromSettings(settings) : DEFAULT_TIMING
}

export { DEFAULT_TIMING as TIMING }

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
