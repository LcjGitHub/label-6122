import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Card, Input, Button, Space, Typography, Statistic, Row, Col, message, Tag, Segmented, Alert } from 'antd'
import { SoundOutlined, CheckOutlined, ReloadOutlined, DeleteOutlined, BookOutlined, FireOutlined, PauseOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import MorseVisualizer from '../components/MorseVisualizer'
import { getPracticeWordsByDifficulty, textToMorse, type DifficultyLevel } from '../utils/morse'
import { createPlaySession, type MorsePlaySession, type PlaybackState } from '../utils/audio'
import { usePracticeStore, calcAccuracy } from '../store/practiceStore'
import { useAudioSettingsStore } from '../store/audioSettingsStore'
import { useWordLibraryStore } from '../store/wordLibraryStore'

const { Title, Paragraph, Text } = Typography

/**
 * 从词库随机选取一个单词，词库为空时返回 null
 */
function pickRandomWord(wordPool: string[], exclude?: string): string | null {
  if (wordPool.length === 0) return null
  const pool = exclude ? wordPool.filter((w) => w !== exclude) : wordPool
  if (pool.length === 0) return wordPool[0] ?? null
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

/**
 * 听码练习页面
 */
export default function PracticePage() {
  const { total, correct, streak, difficulty, submitAnswer, resetStats, setDifficulty } = usePracticeStore()
  const { speed, pitch } = useAudioSettingsStore()
  const { words: customWords } = useWordLibraryStore()

  const activeWords = useMemo(() => {
    void customWords
    return getPracticeWordsByDifficulty(difficulty)
  }, [customWords, difficulty])
  const usingCustom = customWords.length > 0
  const noAvailableWords = activeWords.length === 0

  const prevCustomWordsSig = useRef(JSON.stringify(customWords))
  const [currentWord, setCurrentWord] = useState<string | null>(() => pickRandomWord(activeWords))
  const currentMorse = useMemo(() => (currentWord ? textToMorse(currentWord) : ''), [currentWord])
  const [answer, setAnswer] = useState('')
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [visualResetKey, setVisualResetKey] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const playSessionRef = useRef<MorsePlaySession | null>(null)

  /** 重置题目状态 */
  const resetQuestionState = useCallback((word: string | null) => {
    if (playSessionRef.current) {
      playSessionRef.current.stop()
      playSessionRef.current = null
    }
    setCurrentWord(word)
    setAnswer('')
    setSubmitted(false)
    setActiveIndex(-1)
    setVisualResetKey((k) => k + 1)
    setPlaybackState('idle')
  }, [])

  /** 换题 */
  const nextQuestion = useCallback(
    (exclude?: string) => {
      if (noAvailableWords) {
        resetQuestionState(null)
        return
      }
      const word = pickRandomWord(activeWords, exclude)
      resetQuestionState(word)
    },
    [activeWords, noAvailableWords, resetQuestionState],
  )

  /** 切换难度 */
  const handleDifficultyChange = useCallback(
    (newDifficulty: DifficultyLevel) => {
      setDifficulty(newDifficulty)
      const newWords = getPracticeWordsByDifficulty(newDifficulty)
      if (newWords.length === 0) {
        resetQuestionState(null)
        return
      }
      const word = pickRandomWord(newWords, currentWord ?? undefined)
      resetQuestionState(word)
    },
    [setDifficulty, currentWord, resetQuestionState],
  )

  useEffect(() => {
    const currentSig = JSON.stringify(customWords)
    if (currentSig !== prevCustomWordsSig.current) {
      prevCustomWordsSig.current = currentSig
      const word = pickRandomWord(activeWords, currentWord ?? undefined)
      queueMicrotask(() => resetQuestionState(word))
    }
  }, [customWords, activeWords, currentWord, resetQuestionState])

  useEffect(() => {
    return () => {
      if (playSessionRef.current) {
        playSessionRef.current.stop()
        playSessionRef.current = null
      }
    }
  }, [])

  /** 播放当前题目摩斯码 */
  const handlePlay = useCallback(async () => {
    if (!currentMorse || noAvailableWords) return
    setActiveIndex(-1)
    setVisualResetKey((k) => k + 1)

    const session = createPlaySession(
      currentMorse,
      (_symbol, index) => {
        setActiveIndex(index)
      },
      { speed, pitch },
      (state) => setPlaybackState(state),
      () => {
        setActiveIndex(-1)
        setPlaybackState('idle')
        playSessionRef.current = null
      },
    )
    playSessionRef.current = session
    await session.play()
  }, [currentMorse, noAvailableWords, speed, pitch])

  /** 暂停播放 */
  const handlePause = useCallback(() => {
    if (playSessionRef.current && playbackState === 'playing') {
      playSessionRef.current.pause()
    }
  }, [playbackState])

  /** 继续播放 */
  const handleResume = useCallback(() => {
    if (playSessionRef.current && playbackState === 'paused') {
      playSessionRef.current.resume()
    }
  }, [playbackState])

  /** 停止播放 */
  const handleStop = useCallback(() => {
    if (playSessionRef.current) {
      playSessionRef.current.stop()
      playSessionRef.current = null
    }
    setActiveIndex(-1)
    setVisualResetKey((k) => k + 1)
    setPlaybackState('idle')
  }, [])

  /** 提交答案 */
  const handleSubmit = () => {
    if (noAvailableWords || !currentWord) return
    const normalized = answer.trim().toUpperCase()
    if (!normalized) {
      message.warning('请输入答案')
      return
    }

    const isCorrect = normalized === currentWord
    submitAnswer(isCorrect)
    setSubmitted(true)

    if (isCorrect) {
      message.success('回答正确！')
    } else {
      message.error(`回答错误，正确答案是：${currentWord}`)
    }
  }

  const accuracy = calcAccuracy(correct, total)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>难度选择</Text>
          <Segmented
            value={difficulty}
            onChange={(value) => handleDifficultyChange(value as DifficultyLevel)}
            options={[
              { label: '简单', value: 'easy' },
              { label: '普通', value: 'normal' },
              { label: '困难', value: 'hard' },
            ]}
          />
        </Space>
      </Card>

      <Space align="center" style={{ marginBottom: 8 }}>
        <Title level={2} style={{ margin: 0 }}>
          听码练习
        </Title>
        <Tag icon={<BookOutlined />} color={usingCustom ? 'blue' : 'default'}>
          {usingCustom ? '自定义词库' : '系统默认词库'}
        </Tag>
        <Link to="/斜杠词库" style={{ fontSize: 14 }}>
          管理词库
        </Link>
      </Space>

      {noAvailableWords ? (
        <Alert
          message="暂无符合该难度的单词"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Paragraph type="secondary">
          点击播放听取摩斯电码，输入你听到的内容并提交。统计将保存在本地。
          {usingCustom
            ? `当前使用你的自定义词库（共 ${activeWords.length} 个单词）。`
            : `当前使用系统默认词库（共 ${activeWords.length} 个单词），你可以在「斜杠词库」中添加自定义单词。`}
        </Paragraph>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总题数" value={total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="正确数" value={correct} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正确率"
              value={accuracy}
              suffix="%"
              valueStyle={{ color: accuracy >= 80 ? '#3f8600' : accuracy >= 50 ? '#faad14' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="连对次数"
              value={streak}
              prefix={<FireOutlined />}
              valueStyle={{ color: streak >= 3 ? '#cf1322' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Space wrap style={{ justifyContent: 'center' }}>
              {playbackState === 'idle' && (
                <Button
                  type="primary"
                  size="large"
                  icon={<SoundOutlined />}
                  onClick={handlePlay}
                  disabled={noAvailableWords || !currentWord}
                >
                  播放摩斯码
                </Button>
              )}
              {playbackState === 'playing' && (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PauseOutlined />}
                    onClick={handlePause}
                  >
                    暂停
                  </Button>
                  <Button
                    size="large"
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
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleResume}
                  >
                    继续
                  </Button>
                  <Button
                    size="large"
                    icon={<StopOutlined />}
                    onClick={handleStop}
                    danger
                  >
                    停止
                  </Button>
                </>
              )}
            </Space>
          </div>

          {currentWord && (
            <MorseVisualizer
              key={visualResetKey}
              morse={currentMorse}
              activeIndex={activeIndex}
            />
          )}

          <div>
            <Text strong>你的答案</Text>
            <Input
              size="large"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onPressEnter={handleSubmit}
              placeholder="输入听到的单词"
              disabled={submitted || noAvailableWords}
              style={{ marginTop: 8 }}
            />
          </div>

          <Space wrap>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              disabled={submitted || noAvailableWords || !currentWord}
            >
              提交答案
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => nextQuestion(currentWord ?? undefined)}
              disabled={noAvailableWords}
            >
              下一题
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={resetStats}>
              重置统计
            </Button>
          </Space>

          {submitted && currentWord && (
            <div style={{ textAlign: 'center' }}>
              <Text type={answer.trim().toUpperCase() === currentWord ? 'success' : 'danger'}>
                {answer.trim().toUpperCase() === currentWord
                  ? '太棒了，继续加油！'
                  : `正确答案：${currentWord}`}
              </Text>
            </div>
          )}
        </Space>
      </Card>
    </div>
  )
}
