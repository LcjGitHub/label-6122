import { Card, Typography } from 'antd'
import MorseTable from '../components/MorseTable'

const { Title, Paragraph } = Typography

export default function ChartPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>字母对照表</Title>
      <Paragraph type="secondary">
        完整的字母与数字摩斯电码对照表，支持按字符或编码搜索过滤。点击任意行即可播放该字符的摩斯电码音频。
      </Paragraph>
      <Card>
        <MorseTable />
      </Card>
    </div>
  )
}
