import { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, Input, Button, Space, Typography, Statistic, Row, Col, message, Tag } from 'antd'
import { SoundOutlined, CheckOutlined, ReloadOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import MorseVisualizer from '../components/MorseVisualizer'
import { PRACTICE_WORDS, textToMorse } from '../utils/morse'
import { playMorse } from '../utils/audio'
import { usePracticeStore, calcAccuracy } from '../store/practiceStore'
import { useAudioSettingsStore } from '../store/audioSettingsStore'
import { useWordLibraryStore } from '../store/wordLibraryStore'

const { Title, Paragraph, Text } = Typography

/**
 * 从词库随机选取一个单词
 */
function pickRandomWord(wordPool: string[], exclude?: string): string {
  const pool = exclude ? wordPool.filter((w) => w !== exclude) : wordPool
  if (pool.length === 0) return wordPool[0] || ''
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * 听码练习页面
 */
export default function PracticePage() {
  const { total, correct, submitAnswer, resetStats } = usePracticeStore()
  const { speed, pitch } = useAudioSettingsStore()
  const { words: customWords, getActiveWords } = useWordLibraryStore()

  const activeWords = useMemo(() => getActiveWords(), [customWords, getActiveWords])
  const usingCustom = customWords.length > 0

  const [currentWord, setCurrentWord] = useState(() => pickRandomWord(activeWords))
  const [currentMorse, setCurrentMorse] = useState(() => textToMorse(currentWord))
  const [answer, setAnswer] = useState('')
  const [playing, setPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [submitted, setSubmitted] = useState(false)

  /** 换题 */
  const nextQuestion = useCallback(
    (exclude?: string) => {
      const word = pickRandomWord(activeWords, exclude)
      setCurrentWord(word)
      setCurrentMorse(textToMorse(word))
      setAnswer('')
      setSubmitted(false)
      setActiveIndex(-1)
    },
    [activeWords],
  )

  useEffect(() => {
    const word = pickRandomWord(activeWords)
    setCurrentWord(word)
    setCurrentMorse(textToMorse(word))
  }, [activeWords])

  useEffect(() => {
    setCurrentMorse(textToMorse(currentWord))
  }, [currentWord])

  /** 播放当前题目摩斯码 */
  const handlePlay = useCallback(async () => {
    setPlaying(true)
    setActiveIndex(-1)
    try {
      await playMorse(currentMorse, (_symbol, index) => {
        setActiveIndex(index)
      }, { speed, pitch })
    } finally {
      setPlaying(false)
      setActiveIndex(-1)
    }
  }, [currentMorse, speed, pitch])

  /** 提交答案 */
  const handleSubmit = () => {
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
      <Space align="center" style={{ marginBottom: 8 }}>
        <Title level={2} style={{ margin: 0 }}>
          听码练习
        </Title>
        <Tag icon={<BookOutlined />} color={usingCustom ? 'blue' : 'default'}>
          {usingCustom ? '自定义词库' : '系统默认词库'}
          <Link to="/斜杠词库" style={{ marginLeft: 6 }}>
            管理
          </Link>
        </Tag>
      </Space>
      <Paragraph type="secondary">
        点击播放听取摩斯电码，输入你听到的内容并提交。统计将保存在本地。
        {usingCustom
          ? `当前使用你的自定义词库（共 ${activeWords.length} 个单词）。`
          : `当前使用系统默认词库（共 ${PRACTICE_WORDS.length} 个单词），你可以在「斜杠词库」中添加自定义单词。`}
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总题数" value={total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="正确数" value={correct} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="正确率"
              value={accuracy}
              suffix="%"
              valueStyle={{ color: accuracy >= 80 ? '#3f8600' : accuracy >= 50 ? '#faad14' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<SoundOutlined />}
              onClick={handlePlay}
              loading={playing}
            >
              播放摩斯码
            </Button>
          </div>

          <MorseVisualizer morse={currentMorse} activeIndex={activeIndex} />

          <div>
            <Text strong>你的答案</Text>
            <Input
              size="large"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onPressEnter={handleSubmit}
              placeholder="输入听到的单词"
              disabled={submitted}
              style={{ marginTop: 8 }}
            />
          </div>

          <Space wrap>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              disabled={submitted}
            >
              提交答案
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => nextQuestion(currentWord)}
            >
              下一题
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={resetStats}>
              重置统计
            </Button>
          </Space>

          {submitted && (
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
