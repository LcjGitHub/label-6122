import { useState, useCallback } from 'react'
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  Popconfirm,
  message,
  Empty,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  BookOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useWordLibraryStore } from '../store/wordLibraryStore'
import { PRACTICE_WORDS } from '../utils/morse'

const { Title, Paragraph, Text } = Typography

export default function WordLibraryPage() {
  const { words, addWord, removeWord, clearWords, getActiveWords } =
    useWordLibraryStore()
  const [inputValue, setInputValue] = useState('')

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      message.warning('请输入单词')
      return
    }
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      message.error('仅允许字母与数字')
      return
    }
    const success = addWord(trimmed)
    if (success) {
      message.success(`已添加「${trimmed.toUpperCase()}」`)
      setInputValue('')
    } else {
      message.warning('该单词已存在')
    }
  }, [inputValue, addWord])

  const handleRemove = useCallback(
    (word: string) => {
      removeWord(word)
      message.info(`已删除「${word}」`)
    },
    [removeWord],
  )

  const activeWords = getActiveWords()
  const usingCustom = words.length > 0

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      render: (word: string) => <Text strong>{word}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: { word: string }) =>
        usingCustom ? (
          <Popconfirm
            title="删除单词"
            description={`确定要删除「${record.word}」吗？`}
            onConfirm={() => handleRemove(record.word)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  const dataSource = activeWords.map((word) => ({
    key: word,
    word,
  }))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={2}>自定义词库</Title>
      <Paragraph type="secondary">
        管理听码练习使用的单词列表。添加自定义单词后，练习时将优先从你的词库中随机出题。
        词库为空时自动使用系统默认词库。
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="我的词库"
              value={words.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: usingCustom ? '#1677ff' : '#999' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="系统默认"
              value={PRACTICE_WORDS.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前使用"
              value={activeWords.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <Tag color={usingCustom ? 'blue' : 'default'}>
                  {usingCustom ? '自定义' : '默认'}
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAdd}
            placeholder="输入单词（仅字母与数字，自动转大写）"
            maxLength={50}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            提示：仅支持字母 A-Z 和数字 0-9，输入后自动转为大写
          </Text>
        </div>
      </Card>

      <Card
        title={
          <Space>
            <span>{usingCustom ? '我的词库' : '系统默认词库（预览）'}</span>
            {usingCustom && (
              <Tag color="blue">练习时优先使用</Tag>
            )}
            {!usingCustom && (
              <Tag color="default">当前使用默认</Tag>
            )}
          </Space>
        }
        extra={
          usingCustom ? (
            <Popconfirm
              title="清空词库"
              description="确定要清空所有自定义单词吗？清空后将使用系统默认词库。"
              onConfirm={() => {
                clearWords()
                message.info('已清空词库，已切换到系统默认词库')
              }}
              okText="清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                清空
              </Button>
            </Popconfirm>
          ) : (
            <Button icon={<ReloadOutlined />} size="small" disabled>
              系统默认
            </Button>
          )
        }
      >
        {dataSource.length > 0 ? (
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个单词`,
            }}
            size="middle"
          />
        ) : (
          <Empty description="词库为空" />
        )}
      </Card>
    </div>
  )
}
