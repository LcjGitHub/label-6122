import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConvertDirection = 'text-to-morse' | 'morse-to-text'

export interface ConvertRecord {
  id: string
  text: string
  morse: string
  direction: ConvertDirection
  timestamp: number
}

const MAX_RECORDS = 50

interface ConvertRecordState {
  records: ConvertRecord[]
  addRecord: (text: string, morse: string, direction: ConvertDirection) => void
  deleteRecord: (id: string) => void
  clearAll: () => void
}

export const useConvertRecordStore = create<ConvertRecordState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (text, morse, direction) =>
        set((state) => {
          const newRecord: ConvertRecord = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            text,
            morse,
            direction,
            timestamp: Date.now(),
          }
          const updated = [newRecord, ...state.records]
          if (updated.length > MAX_RECORDS) {
            updated.length = MAX_RECORDS
          }
          return { records: updated }
        }),
      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
      clearAll: () => set({ records: [] }),
    }),
    { name: 'morse-convert-records' },
  ),
)
