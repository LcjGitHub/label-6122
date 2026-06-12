import { parseMorseSymbols, MORSE_MAP } from './morse'
import { getTimingFromSettings, type AudioSettings } from '../store/audioSettingsStore'

const DEFAULT_SETTINGS: AudioSettings = { speed: 'normal', pitch: 'mid' }

const DEFAULT_TIMING = getTimingFromSettings(DEFAULT_SETTINGS)

let audioContext: AudioContext | null = null
let currentOscillator: OscillatorNode | null = null
let currentGainNode: GainNode | null = null
let activeSession: MorsePlaySession | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function stopCurrentTone(): void {
  if (currentOscillator) {
    try {
      currentOscillator.stop()
    } catch {
      // ignore if already stopped
    }
    currentOscillator = null
  }
  if (currentGainNode) {
    try {
      currentGainNode.disconnect()
    } catch {
      // ignore
    }
    currentGainNode = null
  }
}

export type PlaybackState = 'idle' | 'playing' | 'paused'

export interface MorseTiming {
  dot: number
  dash: number
  letterGap: number
  wordGap: number
  symbolGap: number
  frequency: number
}

export type MorseSymbol = 'dot' | 'dash' | 'letterGap' | 'wordGap'

export class MorsePlaySession {
  private symbols: MorseSymbol[]
  private timing: MorseTiming
  private onSymbol?: (symbol: MorseSymbol, index: number) => void
  private onStateChange?: (state: PlaybackState) => void
  private onComplete?: () => void

  private state: PlaybackState = 'idle'
  private currentSymbolIndex: number = 0
  private symbolProgressMs: number = 0
  private shouldStop: boolean = false
  private tickTimer: ReturnType<typeof setTimeout> | null = null
  private resolve: (() => void) | null = null

  constructor(
    morse: string,
    onSymbol?: (symbol: MorseSymbol, index: number) => void,
    settings?: AudioSettings,
    onStateChange?: (state: PlaybackState) => void,
    onComplete?: () => void,
  ) {
    this.symbols = parseMorseSymbols(morse)
    this.timing = settings ? getTimingFromSettings(settings) : DEFAULT_TIMING
    this.onSymbol = onSymbol
    this.onStateChange = onStateChange
    this.onComplete = onComplete
  }

  getState(): PlaybackState {
    return this.state
  }

  getCurrentIndex(): number {
    return this.currentSymbolIndex
  }

  getSymbols(): MorseSymbol[] {
    return this.symbols
  }

  private getSymbolDuration(symbol: MorseSymbol): number {
    switch (symbol) {
      case 'dot':
        return this.timing.dot + this.timing.symbolGap
      case 'dash':
        return this.timing.dash + this.timing.symbolGap
      case 'letterGap':
        return this.timing.letterGap
      case 'wordGap':
        return this.timing.wordGap
    }
  }

  private getToneDuration(symbol: MorseSymbol): number {
    switch (symbol) {
      case 'dot':
        return this.timing.dot
      case 'dash':
        return this.timing.dash
      default:
        return 0
    }
  }

  private clearTickTimer(): void {
    if (this.tickTimer) {
      clearTimeout(this.tickTimer)
      this.tickTimer = null
    }
  }

  private setState(state: PlaybackState): void {
    this.state = state
    this.onStateChange?.(state)
  }

  private playToneSegment(durationMs: number): void {
    stopCurrentTone()
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = this.timing.frequency
    gainNode.gain.value = 0.3

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    const now = ctx.currentTime
    const durationSec = durationMs / 1000

    oscillator.start(now)
    oscillator.stop(now + durationSec)
    currentOscillator = oscillator
    currentGainNode = gainNode
  }

  private async run(): Promise<void> {
    const TICK_INTERVAL = 50

    while (this.currentSymbolIndex < this.symbols.length && !this.shouldStop) {
      if (this.state === 'paused') {
        await new Promise<void>((r) => {
          this.resolve = r
        })
        if (this.shouldStop) break
      }

      const symbol = this.symbols[this.currentSymbolIndex]
      const totalDuration = this.getSymbolDuration(symbol)
      const toneDuration = this.getToneDuration(symbol)
      const remainingMs = totalDuration - this.symbolProgressMs

      if (this.symbolProgressMs === 0) {
        this.onSymbol?.(symbol, this.currentSymbolIndex)
        if (toneDuration > 0) {
          this.playToneSegment(toneDuration)
        }
      } else if (this.symbolProgressMs < toneDuration) {
        const remainingTone = toneDuration - this.symbolProgressMs
        if (remainingTone > 0) {
          this.playToneSegment(remainingTone)
        }
      }

      const tickStart = Date.now()
      let elapsedInTick = 0

      while (elapsedInTick < remainingMs && !this.shouldStop && this.state === 'playing') {
        await new Promise<void>((resolve) => {
          this.tickTimer = setTimeout(() => {
            elapsedInTick = Date.now() - tickStart
            resolve()
          }, Math.min(TICK_INTERVAL, remainingMs - elapsedInTick))
        })
      }

      this.clearTickTimer()

      if (this.shouldStop) break

      if (this.state === 'paused') {
        this.symbolProgressMs += elapsedInTick
        stopCurrentTone()
        continue
      }

      this.currentSymbolIndex++
      this.symbolProgressMs = 0
    }

    stopCurrentTone()

    if (this.shouldStop) {
      this.setState('idle')
      this.onComplete?.()
      return
    }

    this.currentSymbolIndex = 0
    this.symbolProgressMs = 0
    this.setState('idle')
    this.onComplete?.()
  }

  async play(): Promise<void> {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (activeSession && activeSession !== this) {
      activeSession.stop()
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    activeSession = this

    this.shouldStop = false
    this.setState('playing')
    return this.run()
  }

  pause(): void {
    if (this.state !== 'playing') return
    this.setState('paused')
    this.clearTickTimer()
    stopCurrentTone()
  }

  resume(): void {
    if (this.state !== 'paused') return
    this.setState('playing')
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r()
    }
  }

  stop(): void {
    this.shouldStop = true
    this.clearTickTimer()
    stopCurrentTone()
    if (this.state === 'paused' && this.resolve) {
      const r = this.resolve
      this.resolve = null
      r()
    }
    if (activeSession === this) {
      activeSession = null
    }
  }
}

export function createPlaySession(
  morse: string,
  onSymbol?: (symbol: MorseSymbol, index: number) => void,
  settings?: AudioSettings,
  onStateChange?: (state: PlaybackState) => void,
  onComplete?: () => void,
): MorsePlaySession {
  return new MorsePlaySession(morse, onSymbol, settings, onStateChange, onComplete)
}

export async function playMorse(
  morse: string,
  onSymbol?: (symbol: 'dot' | 'dash' | 'letterGap' | 'wordGap', index: number) => void,
  settings?: AudioSettings,
): Promise<void> {
  const session = createPlaySession(morse, onSymbol, settings)
  await session.play()
}

export function stopPlay(): void {
  if (activeSession) {
    activeSession.stop()
    activeSession = null
  }
  stopCurrentTone()
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
  const duration = type === 'dot' ? timing.dot : timing.dash
  stopCurrentTone()

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = timing.frequency
  gainNode.gain.value = 0.3

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  const now = ctx.currentTime
  const durationSec = duration / 1000

  oscillator.start(now)
  oscillator.stop(now + durationSec)
  currentOscillator = oscillator
  currentGainNode = gainNode

  await new Promise((resolve) => setTimeout(resolve, duration))
  stopCurrentTone()
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

export function getScaledTiming(baseTiming: MorseTiming, multiplier: number): MorseTiming {
  const safeMultiplier = Math.max(0.5, Math.min(2, multiplier))
  const scale = 1 / safeMultiplier
  return {
    dot: Math.round(baseTiming.dot * scale),
    dash: Math.round(baseTiming.dash * scale),
    letterGap: Math.round(baseTiming.letterGap * scale),
    wordGap: Math.round(baseTiming.wordGap * scale),
    symbolGap: Math.round(baseTiming.symbolGap * scale),
    frequency: baseTiming.frequency,
  }
}

export { DEFAULT_TIMING as TIMING }
