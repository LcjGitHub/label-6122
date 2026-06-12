import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRACTICE_WORDS } from '../utils/morse'

interface WordLibraryState {
  words: string[]
  addWord: (word: string) => boolean
  removeWord: (word: string) => void
  clearWords: () => void
  getActiveWords: () => string[]
}

export const useWordLibraryStore = create<WordLibraryState>()(
  persist(
    (set, get) => ({
      words: [],
      addWord: (word) => {
        const trimmed = word.trim().toUpperCase()
        if (!trimmed) return false
        if (!/^[A-Z0-9]+$/.test(trimmed)) return false
        const current = get().words
        if (current.includes(trimmed)) return false
        set({ words: [...current, trimmed] })
        return true
      },
      removeWord: (word) => {
        set((state) => ({
          words: state.words.filter((w) => w !== word),
        }))
      },
      clearWords: () => set({ words: [] }),
      getActiveWords: () => {
        const { words } = get()
        return words.length > 0 ? words : PRACTICE_WORDS
      },
    }),
    { name: 'morse-word-library' },
  ),
)
