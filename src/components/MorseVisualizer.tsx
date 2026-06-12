import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseMorseSymbols } from '../utils/morse'
import { getTiming } from '../utils/audio'
import { useAudioSettingsStore } from '../store/audioSettingsStore'
import './MorseVisualizer.css'

interface MorseVisualizerProps {
  morse: string
  activeIndex?: number
  autoAnimate?: boolean
}

export default function MorseVisualizer({
  morse,
  activeIndex = -1,
  autoAnimate = false,
}: MorseVisualizerProps) {
  const symbols = parseMorseSymbols(morse)
  const [animIndex, setAnimIndex] = useState(-1)
  const audioSettings = useAudioSettingsStore()

  const setAnimIndexSafe = useCallback((index: number) => {
    setAnimIndex(index)
  }, [])

  useEffect(() => {
    if (!autoAnimate || !morse.trim()) {
      return
    }

    const parsed = parseMorseSymbols(morse)
    const timing = getTiming(audioSettings)
    let cancelled = false
    let animationFrame: ReturnType<typeof setTimeout>

    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < parsed.length; i++) {
          if (cancelled) break
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
        if (cancelled) break
        setAnimIndexSafe(-1)
        await new Promise<void>((r) => {
          animationFrame = setTimeout(r, 500)
        })
      }
    }

    run()
    return () => {
      cancelled = true
      clearTimeout(animationFrame)
    }
  }, [autoAnimate, morse, audioSettings, setAnimIndexSafe])

  if (!morse.trim()) {
    return <div className="morse-visualizer empty">输入或转换后将在此展示点划节奏</div>
  }

  const highlightIndex = activeIndex >= 0 ? activeIndex : animIndex

  return (
    <div className="morse-visualizer">
      <AnimatePresence mode="popLayout">
        {symbols.map((symbol, index) => {
          if (symbol === 'letterGap') {
            return (
              <span key={`gap-${index}`} className="morse-gap letter-gap">
                |
              </span>
            )
          }
          if (symbol === 'wordGap') {
            return (
              <span key={`word-${index}`} className="morse-gap word-gap">
                /
              </span>
            )
          }

          const isActive = index === highlightIndex
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
