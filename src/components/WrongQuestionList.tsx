import { useState } from 'react'
import {
  Collapse,
  List,
  Button,
  Popconfirm,
  Typography,
  Tag,
  Space,
  Empty,
  Tooltip,
} from 'antd'
import {
  DeleteOutlined,
  DeleteFilled,
  ReloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import {
  usePracticeStore,
  type WrongAnswer,
} from '../store/practiceStore'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface WrongQuestionListProps {
  onPractice: (word: string) => void
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function WrongQuestionList({ onPractice }: WrongQuestionListProps) {
  const { wrongAnswers, clearWrongAnswers, removeWrongAnswer } = usePracticeStore()
  const [activeKey, setActiveKey] = useState<string | string[]>([])

  const hasWrongAnswers = wrongAnswers.length > 0

  const handlePractice = (record: WrongAnswer) => {
    setActiveKey([])
    onPractice(record.word)
  }

  const renderItem = (record: WrongAnswer) => {
    return (
      <List.Item
        key={record.id}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 8,
          background: '#fff2f0',
          border: '1px solid #ffccc7',
        }}
        actions={[
          <Tooltip key="practice" title="再练一次">
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handlePractice(record)
              }}
            >
              再练一次
            </Button>
          </Tooltip>,
          <Popconfirm
            key="delete"
            title="确定删除这条错题吗？"
            onConfirm={() => removeWrongAnswer(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              删除
            </Button>
          </Popconfirm>,
        ]}
      >
        <List.Item.Meta
          title={
            <Space>
              <Tag color="error" icon={<CloseCircleOutlined />}>
                答错
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatTime(record.timestamp)}
              </Text>
            </Space>
          }
          description={
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Paragraph
                style={{ margin: 0, fontSize: 13 }}
              >
                <Text strong style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  正确答案：
                </Text>
                <Text strong style={{ fontSize: 16, color: '#3f8600' }}>
                  {record.word}
                </Text>
              </Paragraph>
              <Paragraph
                style={{ margin: 0, fontSize: 13 }}
              >
                <Text strong style={{ color: '#ff4d4f' }}>
                  <CloseCircleOutlined style={{ marginRight: 4 }} />
                  你的答案：
                </Text>
                <Text delete style={{ color: '#cf1322' }}>
                  {record.userAnswer}
                </Text>
              </Paragraph>
            </Space>
          }
        />
      </List.Item>
    )
  }

  return (
    <Collapse
      activeKey={activeKey}
      onChange={(key) => setActiveKey(key)}
      style={{ marginTop: 16 }}
    >
      <Panel
        header={
          <Space>
            <span>错题回顾</span>
            <Tag color="error">{wrongAnswers.length}</Tag>
          </Space>
        }
        key="wrong-answers"
        extra={
          hasWrongAnswers ? (
            <Popconfirm
              title="确定清空全部错题吗？此操作不可恢复。"
              onConfirm={clearWrongAnswers}
              okText="清空"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteFilled />}
                onClick={(e) => e.stopPropagation()}
              >
                全部清空
              </Button>
            </Popconfirm>
          ) : null
        }
      >
        {hasWrongAnswers ? (
          <List
            dataSource={wrongAnswers}
            renderItem={renderItem}
            style={{ background: 'transparent' }}
          />
        ) : (
          <Empty
            description="暂无错题记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Panel>
    </Collapse>
  )
}
