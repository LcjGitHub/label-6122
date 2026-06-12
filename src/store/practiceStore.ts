import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 练习统计状态 */
interface PracticeState {
  total: number
  correct: number
  /** 提交一次答案 */
  submitAnswer: (isCorrect: boolean) => void
  /** 重置统计数据 */
  resetStats: () => void
}

/**
 * 练习计分 Zustand Store（持久化到 localStorage）
 */
export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      total: 0,
      correct: 0,
      submitAnswer: (isCorrect) =>
        set((state) => ({
          total: state.total + 1,
          correct: state.correct + (isCorrect ? 1 : 0),
        })),
      resetStats: () => set({ total: 0, correct: 0 }),
    }),
    { name: 'morse-practice-stats' },
  ),
)

/**
 * 计算正确率百分比
 * @param correct - 正确数
 * @param total - 总题数
 */
export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}
