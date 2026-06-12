import { useState, useCallback } from 'react'
import { Table, Input, Typography } from 'antd'
import { SearchOutlined, SoundOutlined } from '@ant-design/icons'
import { MORSE_MAP } from '../utils/morse'
import { playChar, stopPlay } from '../utils/audio'
import { useAudioSettingsStore } from '../store/audioSettingsStore'
import MorseVisualizer from './MorseVisualizer'

const { Text } = Typography

interface MorseEntry {
  key: string
  char: string
  code: string
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const DIGITS = '0123456789'.split('')
const ORDERED_CHARS = [...LETTERS, ...DIGITS]

const DATA: MorseEntry[] = ORDERED_CHARS.map((char) => ({
  key: char,
  char,
  code: MORSE_MAP[char],
}))

const columns = [
  {
    title: '字符',
    dataIndex: 'char',
    key: 'char',
    width: 100,
    align: 'center' as const,
    render: (char: string) => (
      <Text strong style={{ fontSize: 20 }}>
        {char}
      </Text>
    ),
  },
  {
    title: '摩斯码',
    dataIndex: 'code',
    key: 'code',
    align: 'center' as const,
    render: (code: string) => (
      <Text code style={{ fontSize: 16, letterSpacing: 2 }}>
        {code}
      </Text>
    ),
  },
  {
    title: '点划',
    dataIndex: 'code',
    key: 'visual',
    align: 'center' as const,
    render: (code: string) => (
      <div className="morse-table-visual">
        <MorseVisualizer morse={code} />
      </div>
    ),
  },
  {
    title: '播放',
    key: 'action',
    width: 80,
    align: 'center' as const,
    render: () => (
      <SoundOutlined style={{ fontSize: 18, color: '#1677ff', cursor: 'pointer' }} />
    ),
  },
]

interface MorseTableProps {
  onPlay?: (char: string) => void
}

export default function MorseTable({ onPlay }: MorseTableProps) {
  const [search, setSearch] = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const audioSettings = useAudioSettingsStore()

  const filtered = DATA.filter(
    (item) =>
      item.char.toLowerCase().includes(search.toLowerCase()) ||
      item.code.includes(search),
  )

  const handleRowClick = useCallback(
    (record: MorseEntry) => {
      stopPlay()
      setActiveKey(record.key)
      onPlay?.(record.char)
      playChar(record.char, undefined, audioSettings)
    },
    [onPlay, audioSettings],
  )

  return (
    <div>
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索字符或摩斯码，如 A 或 .-"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 16, maxWidth: 360 }}
      />
      <Table
        dataSource={filtered}
        columns={columns}
        pagination={false}
        size="middle"
        rowClassName={(record) =>
          record.key === activeKey ? 'morse-table-row-active' : 'morse-table-row'
        }
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
