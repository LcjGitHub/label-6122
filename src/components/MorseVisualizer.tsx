import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseMorseSymbols } from '../utils/morse'
import { getTiming, getScaledTiming } from '../utils/audio'
import { useAudioSettingsStore } from '../store/audioSettingsStore'
import './MorseVisualizer.css'

interface MorseVisualizerProps {
  morse: string
  activeIndex?: number
  autoAnimate?: boolean
  resetKey?: number
  speedMultiplier?: number
}

export default function MorseVisualizer({
  morse,
  activeIndex = -1,
  autoAnimate = false,
  resetKey = 0,
  speedMultiplier = 1,
}: MorseVisualizerProps) {
  const symbols = parseMorseSymbols(morse)
  const [animIndex, setAnimIndex] = useState(-1)
  const audioSettings = useAudioSettingsStore()
  const animIndexRef = useRef(-1)
  const resetKeyRef = useRef(resetKey)

  const setAnimIndexSafe = useCallback((index: number) => {
    animIndexRef.current = index
    setAnimIndex(index)
  }, [])

  useEffect(() => {
    if (resetKey !== resetKeyRef.current) {
      resetKeyRef.current = resetKey
      if (animIndexRef.current !== -1) {
        setAnimIndexSafe(-1)
      }
    }
  }, [resetKey, setAnimIndexSafe])

  useEffect(() => {
    if (animIndexRef.current !== -1) {
      setAnimIndexSafe(-1)
    }
    resetKeyRef.current = resetKey
  }, [morse, setAnimIndexSafe, resetKey])

  useEffect(() => {
    if (!autoAnimate || !morse.trim()) {
      return
    }

    const parsed = parseMorseSymbols(morse)
    const baseTiming = getTiming(audioSettings)
    const timing = getScaledTiming(baseTiming, speedMultiplier)
    let cancelled = false
    let animationFrame: ReturnType<typeof setTimeout>
    const startedResetKey = resetKeyRef.current

    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < parsed.length; i++) {
          if (cancelled || resetKeyRef.current !== startedResetKey) break
          setAnimIndexSafe(i)

          const sym = parsed[i]
          const duration =
            sym === 'dot'
              ? timing.dot + timing.symbolGap
              : sym === 'dash'
                ? timing.dash + timing.symbolGap
                : sym === 'letterGap'
                  ? timing.letterGap
                  : timing.wordGap

          await new Promise<void>((r) => {
            animationFrame = setTimeout(r, duration)
          })
        }
        if (cancelled || resetKeyRef.current !== startedResetKey) break
        setAnimIndexSafe(-1)
        await new Promise<void>((r) => {
          animationFrame = setTimeout(r, timing.letterGap)
        })
      }
    }

    run()
    return () => {
      cancelled = true
      clearTimeout(animationFrame)
    }
  }, [autoAnimate, morse, audioSettings, speedMultiplier, setAnimIndexSafe])

  if (!morse.trim()) {
    return <div className="morse-visualizer empty">输入或转换后将在此展示点划节奏</div>
  }

  const highlightIndex = activeIndex >= 0 ? activeIndex : animIndex

  return (
    <div className="morse-visualizer">
      <AnimatePresence mode="popLayout">
        {symbols.map((symbol, index) => {
          const isActive = index === highlightIndex

          if (symbol === 'letterGap') {
            return (
              <motion.span
                key={`gap-${index}`}
                className={`morse-gap letter-gap ${isActive ? 'active' : ''}`}
                animate={{
                  scale: isActive ? 1.3 : 1,
                  color: isActive ? '#1677ff' : '#bfbfbf',
                  backgroundColor: isActive ? '#e6f4ff' : 'transparent',
                  borderRadius: 4,
                  boxShadow: isActive ? '0 0 8px rgba(22, 119, 255, 0.5)' : 'none',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  padding: '2px 6px',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 28,
                }}
              >
                |
              </motion.span>
            )
          }
          if (symbol === 'wordGap') {
            return (
              <motion.span
                key={`word-${index}`}
                className={`morse-gap word-gap ${isActive ? 'active' : ''}`}
                animate={{
                  scale: isActive ? 1.3 : 1,
                  color: isActive ? '#1677ff' : '#8c8c8c',
                  backgroundColor: isActive ? '#e6f4ff' : 'transparent',
                  borderRadius: 4,
                  boxShadow: isActive ? '0 0 8px rgba(22, 119, 255, 0.5)' : 'none',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  padding: '2px 8px',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 28,
                  height: 28,
                }}
              >
                /
              </motion.span>
            )
          }

          return (
            <motion.span
              key={`sym-${index}`}
              className={`morse-symbol ${symbol} ${isActive ? 'active' : ''}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: isActive ? 1.2 : 1,
                opacity: 1,
                backgroundColor: isActive ? '#1677ff' : symbol === 'dot' ? '#52c41a' : '#fa8c16',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {symbol === 'dot' ? '·' : '—'}
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
