import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, Input, Button, Space, Typography, Divider, message } from 'antd'
import { SwapOutlined, SoundOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons'
import MorseVisualizer from '../components/MorseVisualizer'
import RecordList from '../components/RecordList'
import { textToMorse, morseToText, isValidMorse } from '../utils/morse'
import { playMorse } from '../utils/audio'
import { copyToClipboard } from '../utils/clipboard'
import { useConvertRecordStore } from '../store/convertRecordStore'
import { useAudioSettingsStore } from '../store/audioSettingsStore'

const { TextArea } = Input
const { Title, Paragraph } = Typography

/**
 * 摩斯电码互转页面
 */
export default function ConvertPage() {
  const [text, setText] = useState('')
  const [morse, setMorse] = useState('')
  const [playing, setPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [autoAnimate, setAutoAnimate] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastConvertedTextRef = useRef<string>('')
  const { addRecord } = useConvertRecordStore()
  const { speed, pitch } = useAudioSettingsStore()

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!text.trim()) {
        setMorse('')
        lastConvertedTextRef.current = ''
        return
      }
      if (text === lastConvertedTextRef.current) return
      try {
        const result = textToMorse(text)
        setMorse(result)
        setAutoAnimate(true)
        lastConvertedTextRef.current = text
      } catch (err) {
        message.error(err instanceof Error ? err.message : '转换失败')
      }
    }, 300)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [text])

  /** 文本 → 摩斯 */
  const handleTextToMorse = useCallback(() => {
    try {
      const result = textToMorse(text)
      setMorse(result)
      setAutoAnimate(true)
      if (text.trim() || result.trim()) {
        addRecord(text, result, 'text-to-morse')
      }
      message.success('转换成功')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '转换失败')
    }
  }, [text, addRecord])

  /** 摩斯 → 文本 */
  const handleMorseToText = useCallback(() => {
    if (!isValidMorse(morse)) {
      message.error('摩斯码格式无效，请使用 . 和 - 表示点划，空格分隔字母，/ 分隔单词')
      return
    }
    try {
      const result = morseToText(morse)
      setText(result)
      if (morse.trim() || result.trim()) {
        addRecord(result, morse, 'morse-to-text')
      }
      message.success('转换成功')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '转换失败')
    }
  }, [morse, addRecord])

  /** 回填记录到输入框 */
  const handleRestore = useCallback((restoredText: string, restoredMorse: string) => {
    setText(restoredText)
    setMorse(restoredMorse)
    setAutoAnimate(false)
    setActiveIndex(-1)
    message.success('已回填记录')
  }, [])

  /** 播放摩斯音频 */
  const handlePlay = useCallback(async () => {
    if (!morse.trim()) {
      message.warning('请先输入或转换摩斯码')
      return
    }
    setPlaying(true)
    setAutoAnimate(false)
    setActiveIndex(-1)
    try {
      await playMorse(morse, (_symbol, index) => {
        setActiveIndex(index)
      }, { speed, pitch })
    } finally {
      setPlaying(false)
      setActiveIndex(-1)
    }
  }, [morse, speed, pitch])

  /** 清空输入 */
  const handleClear = () => {
    setText('')
    setMorse('')
    setAutoAnimate(false)
    setActiveIndex(-1)
    lastConvertedTextRef.current = ''
  }

  /** 复制摩斯码到剪贴板 */
  const handleCopyMorse = useCallback(async () => {
    const result = await copyToClipboard(morse)
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message)
    }
  }, [morse])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>摩斯电码互转</Title>
      <Paragraph type="secondary">
        在文本与摩斯码之间互相转换，支持字母 A-Z 与数字 0-9。字母间用空格分隔，单词间用 / 分隔。
      </Paragraph>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>文本</Typography.Text>
            <TextArea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入英文文本，如 HELLO WORLD"
              style={{ marginTop: 8 }}
            />
          </div>

          <Space wrap>
            <Button type="primary" icon={<SwapOutlined />} onClick={handleTextToMorse}>
              文本 → 摩斯
            </Button>
            <Button icon={<SwapOutlined />} onClick={handleMorseToText}>
              摩斯 → 文本
            </Button>
            <Button
              icon={<SoundOutlined />}
              onClick={handlePlay}
              loading={playing}
              disabled={!morse.trim()}
            >
              播放
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
          </Space>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Typography.Text strong>摩斯码</Typography.Text>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopyMorse}
                disabled={!morse.trim()}
                size="small"
              >
                复制
              </Button>
            </div>
            <TextArea
              rows={4}
              value={morse}
              onChange={(e) => {
                setMorse(e.target.value)
                setAutoAnimate(false)
              }}
              placeholder="输入摩斯码，如 .... . .-.. .-.. --- / .-- --- .-. .-.. -.."
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <Divider style={{ margin: '8px 0' }}>点划节奏预览</Divider>

          <MorseVisualizer
            morse={morse}
            activeIndex={activeIndex}
            autoAnimate={autoAnimate && !playing}
          />

          <RecordList onRestore={handleRestore} />
        </Space>
      </Card>
    </div>
  )
}
