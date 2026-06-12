import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseMorseSymbols } from '../utils/morse'
import { TIMING } from '../utils/audio'
import './MorseVisualizer.css'

interface MorseVisualizerProps {
  /** 摩斯电码字符串 */
  morse: string
  /** 是否正在播放（外部驱动高亮） */
  activeIndex?: number
  /** 是否自动循环动画预览 */
  autoAnimate?: boolean
}

/**
 * 摩斯点划节奏可视化组件
 */
export default function MorseVisualizer({
  morse,
  activeIndex = -1,
  autoAnimate = false,
}: MorseVisualizerProps) {
  const symbols = parseMorseSymbols(morse)
  const [animIndex, setAnimIndex] = useState(-1)

  useEffect(() => {
    if (!autoAnimate || !morse.trim()) {
      setAnimIndex(-1)
      return
    }

    const parsed = parseMorseSymbols(morse)
    let cancelled = false

    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < parsed.length; i++) {
          if (cancelled) break
          const sym = parsed[i]
          setAnimIndex(i)

          const duration =
            sym === 'dot'
              ? TIMING.dot + TIMING.symbolGap
              : sym === 'dash'
                ? TIMING.dash + TIMING.symbolGap
                : sym === 'letterGap'
                  ? TIMING.letterGap
                  : TIMING.wordGap

          await new Promise((r) => setTimeout(r, duration))
        }
        setAnimIndex(-1)
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [autoAnimate, morse])

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
