import { useState, useCallback } from 'react'
import { Button, Space, Typography, message } from 'antd'
import {
  PlusOutlined,
  MinusOutlined,
  ColumnHeightOutlined,
  DeleteOutlined,
  ClearOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { parseDotDashString } from '../utils/morse'

const { Text } = Typography

interface TapCodePanelProps {
  onDecode?: (text: string) => void
}

export default function TapCodePanel({ onDecode }: TapCodePanelProps) {
  const [sequence, setSequence] = useState('')
  const [result, setResult] = useState('')

  const handleDot = useCallback(() => {
    setSequence((prev) => prev + '.')
  }, [])

  const handleDash = useCallback(() => {
    setSequence((prev) => prev + '-')
  }, [])

  const handleSpace = useCallback(() => {
    setSequence((prev) => {
      if (prev.endsWith(' ')) return prev
      return prev + ' '
    })
  }, [])

  const handleBackspace = useCallback(() => {
    setSequence((prev) => {
      if (prev.endsWith(' ')) return prev.slice(0, -1)
      return prev.slice(0, -1)
    })
  }, [])

  const handleClear = useCallback(() => {
    setSequence('')
    setResult('')
  }, [])

  const handleDecode = useCallback(() => {
    if (!sequence.trim()) {
      message.warning('请先输入点划序列')
      return
    }
    try {
      const decoded = parseDotDashString(sequence)
      setResult(decoded)
      onDecode?.(decoded)
      message.success('解码成功')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '解码失败')
      setResult('')
    }
  }, [sequence, onDecode])

  const displaySequence = sequence
    .split('')
    .map((ch) => {
      if (ch === '.') return '·'
      if (ch === '-') return '—'
      return ' '
    })
    .join('')

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div
        style={{
          minHeight: 80,
          padding: '16px 20px',
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          background: '#fafafa',
          fontSize: 28,
          fontFamily: 'monospace',
          letterSpacing: 4,
          wordBreak: 'break-all',
          lineHeight: 1.6,
          color: sequence ? '#000' : '#bfbfbf',
        }}
      >
        {sequence ? displaySequence : '点击下方按钮输入点划…'}
      </div>

      <Space wrap size="middle" style={{ justifyContent: 'center', display: 'flex' }}>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleDot}
          style={{ minWidth: 100 }}
        >
          点
        </Button>
        <Button
          size="large"
          icon={<MinusOutlined />}
          onClick={handleDash}
          style={{ minWidth: 100 }}
        >
          划
        </Button>
        <Button
          size="large"
          icon={<ColumnHeightOutlined />}
          onClick={handleSpace}
          style={{ minWidth: 100 }}
        >
          空格
        </Button>
        <Button size="large" icon={<DeleteOutlined />} onClick={handleBackspace}>
          退格
        </Button>
        <Button size="large" icon={<ClearOutlined />} onClick={handleClear} danger>
          清空
        </Button>
      </Space>

      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleDecode}
          disabled={!sequence.trim()}
          style={{ minWidth: 160 }}
        >
          解码
        </Button>
      </div>

      {result && (
        <div
          style={{
            padding: '16px 20px',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
            background: '#f6ffed',
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            解码结果
          </Text>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: 6, marginTop: 8 }}>
            {result}
          </div>
        </div>
      )}

      <div style={{ color: '#999', fontSize: 12, textAlign: 'center' }}>
        <Text type="secondary">
          操作说明：点击「点」或「划」输入符号，点击「空格」分隔字母，输入完成后点击「解码」还原文本
        </Text>
      </div>
    </Space>
  )
}
