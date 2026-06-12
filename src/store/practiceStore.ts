import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DifficultyLevel } from '../utils/morse'

/** 错题记录 */
export interface WrongAnswer {
  id: string
  word: string
  userAnswer: string
  timestamp: number
}

/** 练习统计状态 */
interface PracticeState {
  total: number
  correct: number
  streak: number
  difficulty: DifficultyLevel
  wrongAnswers: WrongAnswer[]
  /** 提交一次答案 */
  submitAnswer: (isCorrect: boolean) => void
  /** 添加错题记录 */
  addWrongAnswer: (word: string, userAnswer: string) => void
  /** 清空所有错题 */
  clearWrongAnswers: () => void
  /** 删除单个错题 */
  removeWrongAnswer: (id: string) => void
  /** 重置统计数据 */
  resetStats: () => void
  /** 设置难度 */
  setDifficulty: (difficulty: DifficultyLevel) => void
}

/**
 * 练习计分 Zustand Store（持久化到 localStorage）
 */
export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      total: 0,
      correct: 0,
      streak: 0,
      difficulty: 'normal',
      wrongAnswers: [],
      submitAnswer: (isCorrect) =>
        set((state) => ({
          total: state.total + 1,
          correct: state.correct + (isCorrect ? 1 : 0),
          streak: isCorrect ? state.streak + 1 : 0,
        })),
      addWrongAnswer: (word, userAnswer) =>
        set((state) => ({
          wrongAnswers: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              word,
              userAnswer,
              timestamp: Date.now(),
            },
            ...state.wrongAnswers,
          ],
        })),
      clearWrongAnswers: () => set({ wrongAnswers: [] }),
      removeWrongAnswer: (id) =>
        set((state) => ({
          wrongAnswers: state.wrongAnswers.filter((w) => w.id !== id),
        })),
      resetStats: () => set({ total: 0, correct: 0, streak: 0 }),
      setDifficulty: (difficulty) => set({ difficulty }),
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
