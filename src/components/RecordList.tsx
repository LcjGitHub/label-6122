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
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import {
  useConvertRecordStore,
  type ConvertRecord,
  type ConvertDirection,
} from '../store/convertRecordStore'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface RecordListProps {
  onRestore: (text: string, morse: string) => void
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function directionLabel(direction: ConvertDirection): {
  text: string
  color: string
  icon: React.ReactNode
} {
  if (direction === 'text-to-morse') {
    return {
      text: '文本 → 摩斯',
      color: 'blue',
      icon: <ArrowRightOutlined />,
    }
  }
  return {
    text: '摩斯 → 文本',
    color: 'green',
    icon: <ArrowLeftOutlined />,
  }
}

export default function RecordList({ onRestore }: RecordListProps) {
  const { records, deleteRecord, clearAll } = useConvertRecordStore()
  const [activeKey, setActiveKey] = useState<string | string[]>([])

  const hasRecords = records.length > 0

  const handleRestore = (record: ConvertRecord) => {
    onRestore(record.text, record.morse)
  }

  const renderItem = (record: ConvertRecord) => {
    const dir = directionLabel(record.direction)
    return (
      <List.Item
        key={record.id}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 8,
          background: '#fafafa',
          border: '1px solid #f0f0f0',
        }}
        actions={[
          <Tooltip key="restore" title="回填到输入框">
            <Button
              type="link"
              size="small"
              onClick={() => handleRestore(record)}
            >
              回填
            </Button>
          </Tooltip>,
          <Popconfirm
            key="delete"
            title="确定删除这条记录吗？"
            onConfirm={() => deleteRecord(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>,
        ]}
      >
        <List.Item.Meta
          title={
            <Space>
              <Tag icon={dir.icon} color={dir.color}>
                {dir.text}
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
                ellipsis={{ rows: 1, expandable: true, symbol: '展开' }}
              >
                <Text strong>文本：</Text>
                {record.text || '(空)'}
              </Paragraph>
              <Paragraph
                style={{ margin: 0, fontSize: 13, fontFamily: 'monospace' }}
                ellipsis={{ rows: 1, expandable: true, symbol: '展开' }}
              >
                <Text strong>摩斯：</Text>
                {record.morse || '(空)'}
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
            <span>转换记录</span>
            <Tag color="default">{records.length} / 50</Tag>
          </Space>
        }
        key="records"
        extra={
          hasRecords ? (
            <Popconfirm
              title="确定清空全部记录吗？此操作不可恢复。"
              onConfirm={clearAll}
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
        {hasRecords ? (
          <List
            dataSource={records}
            renderItem={renderItem}
            style={{ background: 'transparent' }}
          />
        ) : (
          <Empty
            description="暂无转换记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Panel>
    </Collapse>
  )
}
