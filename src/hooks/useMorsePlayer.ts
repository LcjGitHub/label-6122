import { useState, useCallback, useEffect, useRef } from 'react'
import { createPlaySession, type MorsePlaySession, type PlaybackState, type MorseSymbol } from '../utils/audio'
import type { AudioSettings } from '../store/audioSettingsStore'

export interface UseMorsePlayerOptions {
  morse: string
  settings: AudioSettings
  onSymbolExtra?: (symbol: MorseSymbol, index: number) => void
  onStateChangeExtra?: (state: PlaybackState) => void
  onCompleteExtra?: () => void
}

export interface UseMorsePlayerReturn {
  playbackState: PlaybackState
  activeIndex: number
  visualResetKey: number
  play: () => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  resetVisual: () => void
  forceStopAndReset: () => void
}

export function useMorsePlayer(options: UseMorsePlayerOptions): UseMorsePlayerReturn {
  const { morse, settings, onSymbolExtra, onStateChangeExtra, onCompleteExtra } = options

  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [visualResetKey, setVisualResetKey] = useState(0)

  const playSessionRef = useRef<MorsePlaySession | null>(null)
  const lastMorseRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  const resetVisual = useCallback(() => {
    setVisualResetKey((k) => k + 1)
  }, [])

  const forceStopAndReset = useCallback(() => {
    const session = playSessionRef.current
    if (session) {
      session.stop()
      playSessionRef.current = null
    }
    setActiveIndex(-1)
    resetVisual()
    setPlaybackState('idle')
  }, [resetVisual])

  useEffect(() => {
    if (!isInitializedRef.current) {
      lastMorseRef.current = morse
      isInitializedRef.current = true
      return
    }
    if (morse !== lastMorseRef.current) {
      lastMorseRef.current = morse
      const session = playSessionRef.current
      if (session) {
        const state = session.getState()
        if (state === 'playing' || state === 'paused') {
          forceStopAndReset()
        }
      }
    }
  }, [morse, forceStopAndReset])

  useEffect(() => {
    return () => {
      if (playSessionRef.current) {
        playSessionRef.current.stop()
        playSessionRef.current = null
      }
    }
  }, [])

  const play = useCallback(async () => {
    lastMorseRef.current = morse
    setActiveIndex(-1)
    resetVisual()

    const session = createPlaySession(
      morse,
      (symbol, index) => {
        setActiveIndex(index)
        onSymbolExtra?.(symbol, index)
      },
      settings,
      (state) => {
        setPlaybackState(state)
        onStateChangeExtra?.(state)
      },
      () => {
        setActiveIndex(-1)
        setPlaybackState('idle')
        playSessionRef.current = null
        onCompleteExtra?.()
      },
    )
    playSessionRef.current = session
    await session.play()
  }, [morse, settings, onSymbolExtra, onStateChangeExtra, onCompleteExtra, resetVisual])

  const pause = useCallback(() => {
    const session = playSessionRef.current
    if (session && session.getState() === 'playing') {
      session.pause()
    }
  }, [])

  const resume = useCallback(() => {
    const session = playSessionRef.current
    if (session && session.getState() === 'paused') {
      session.resume()
    }
  }, [])

  const stop = useCallback(() => {
    const session = playSessionRef.current
    if (session) {
      session.stop()
      playSessionRef.current = null
    }
    setActiveIndex(-1)
    resetVisual()
    setPlaybackState('idle')
  }, [resetVisual])

  return {
    playbackState,
    activeIndex,
    visualResetKey,
    play,
    pause,
    resume,
    stop,
    resetVisual,
    forceStopAndReset,
  }
}
