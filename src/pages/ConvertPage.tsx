import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, Input, Button, Space, Typography, Divider, message, Switch, Slider } from 'antd'
import { SwapOutlined, SoundOutlined, ClearOutlined, CopyOutlined, PauseOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import MorseVisualizer from '../components/MorseVisualizer'
import RecordList from '../components/RecordList'
import { textToMorse, morseToText, isValidMorse, safeTextToMorse } from '../utils/morse'
import { copyToClipboard } from '../utils/clipboard'
import { useConvertRecordStore } from '../store/convertRecordStore'
import { useAudioSettingsStore } from '../store/audioSettingsStore'
import { useMorsePlayer } from '../hooks/useMorsePlayer'

const { TextArea } = Input
const { Title, Paragraph } = Typography

/**
 * 摩斯电码互转页面
 */
export default function ConvertPage() {
  const [text, setText] = useState('')
  const [morse, setMorse] = useState('')
  const [autoAnimate, setAutoAnimate] = useState(false)
  const [slowDemoMode, setSlowDemoMode] = useState(false)
  const [demoSpeedMultiplier, setDemoSpeedMultiplier] = useState(0.5)
  const [sliderDisplayValue, setSliderDisplayValue] = useState(0.5)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastConvertedTextRef = useRef<string>('')
  const { addRecord } = useConvertRecordStore()
  const { speed, pitch } = useAudioSettingsStore()

  const {
    playbackState,
    activeIndex,
    visualResetKey,
    play: morsePlay,
    pause: morsePause,
    resume: morseResume,
    stop: morseStop,
    forceStopAndReset,
  } = useMorsePlayer({
    morse,
    settings: { speed, pitch },
  })

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
      const { morse: result, errorMessage } = safeTextToMorse(text)
      if (errorMessage) {
        setMorse('')
        message.error(errorMessage)
        return
      }
      setMorse(result)
      setAutoAnimate(true)
      lastConvertedTextRef.current = text
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
    forceStopAndReset()
    setText(restoredText)
    setMorse(restoredMorse)
    setAutoAnimate(false)
    lastConvertedTextRef.current = restoredText
    message.success('已回填记录')
  }, [forceStopAndReset])

  /** 播放摩斯音频 */
  const handlePlay = useCallback(async () => {
    if (!morse.trim()) {
      message.warning('请先输入或转换摩斯码')
      return
    }
    if (slowDemoMode) {
      message.warning('慢速演示模式下无法播放音频，请先关闭慢速演示')
      return
    }
    setAutoAnimate(false)
    await morsePlay()
  }, [morse, slowDemoMode, morsePlay])

  /** 暂停播放 */
  const handlePause = useCallback(() => {
    morsePause()
  }, [morsePause])

  /** 继续播放 */
  const handleResume = useCallback(() => {
    morseResume()
  }, [morseResume])

  /** 停止播放 */
  const handleStop = useCallback(() => {
    morseStop()
  }, [morseStop])

  /** 清空输入 */
  const handleClear = () => {
    forceStopAndReset()
    setText('')
    setMorse('')
    setAutoAnimate(false)
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
            {playbackState === 'idle' && (
              <Button
                icon={<SoundOutlined />}
                onClick={handlePlay}
                disabled={!morse.trim() || slowDemoMode}
              >
                播放
              </Button>
            )}
            {playbackState === 'playing' && (
              <>
                <Button
                  icon={<PauseOutlined />}
                  onClick={handlePause}
                  type="primary"
                >
                  暂停
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={handleStop}
                  danger
                >
                  停止
                </Button>
              </>
            )}
            {playbackState === 'paused' && (
              <>
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={handleResume}
                  type="primary"
                >
                  继续
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={handleStop}
                  danger
                >
                  停止
                </Button>
              </>
            )}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text>慢速演示模式</Typography.Text>
              <Switch
                checked={slowDemoMode}
                aria-label="慢速演示模式开关"
                onChange={(checked) => {
                  setSlowDemoMode(checked)
                  if (checked) {
                    setSliderDisplayValue(demoSpeedMultiplier)
                    forceStopAndReset()
                  }
                }}
              />
            </div>
            {slowDemoMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                <Typography.Text style={{ whiteSpace: 'nowrap' }}>速度</Typography.Text>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={sliderDisplayValue}
                  onChange={setSliderDisplayValue}
                  onChangeComplete={(value: number) => {
                    setDemoSpeedMultiplier(value)
                  }}
                  style={{ flex: 1 }}
                  tooltip={{ formatter: (value) => `${value}x` }}
                />
                <Typography.Text style={{ minWidth: 48, textAlign: 'right' }}>
                  {sliderDisplayValue.toFixed(1)}x
                </Typography.Text>
              </div>
            )}
          </div>

          <MorseVisualizer
            key={visualResetKey}
            morse={morse}
            activeIndex={activeIndex}
            autoAnimate={slowDemoMode ? !!morse.trim() : autoAnimate && playbackState === 'idle'}
            speedMultiplier={slowDemoMode ? demoSpeedMultiplier : 1}
          />

          <RecordList onRestore={handleRestore} />
        </Space>
      </Card>
    </div>
  )
}
