import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SpeedLevel = 'slow' | 'normal' | 'fast'
export type PitchLevel = 'low' | 'mid' | 'high'

export interface AudioSettings {
  speed: SpeedLevel
  pitch: PitchLevel
}

const SPEED_MULTIPLIER: Record<SpeedLevel, number> = {
  slow: 2,
  normal: 1,
  fast: 0.5,
}

const PITCH_FREQUENCY: Record<PitchLevel, number> = {
  low: 400,
  mid: 600,
  high: 800,
}

const BASE_TIMING = {
  dot: 100,
  dash: 300,
  letterGap: 300,
  wordGap: 700,
  symbolGap: 100,
} as const

interface AudioSettingsState extends AudioSettings {
  setSpeed: (speed: SpeedLevel) => void
  setPitch: (pitch: PitchLevel) => void
}

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set) => ({
      speed: 'normal',
      pitch: 'mid',
      setSpeed: (speed) => set({ speed }),
      setPitch: (pitch) => set({ pitch }),
    }),
    { name: 'morse-audio-settings' },
  ),
)

export function getTimingFromSettings(settings: AudioSettings) {
  const mult = SPEED_MULTIPLIER[settings.speed]
  return {
    dot: Math.round(BASE_TIMING.dot * mult),
    dash: Math.round(BASE_TIMING.dash * mult),
    letterGap: Math.round(BASE_TIMING.letterGap * mult),
    wordGap: Math.round(BASE_TIMING.wordGap * mult),
    symbolGap: Math.round(BASE_TIMING.symbolGap * mult),
    frequency: PITCH_FREQUENCY[settings.pitch],
  }
}

export { SPEED_MULTIPLIER, PITCH_FREQUENCY, BASE_TIMING }
