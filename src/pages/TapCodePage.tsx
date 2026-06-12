import { Card, Typography } from 'antd'
import TapCodeInputPanel from '../components/TapCodeInputPanel'

const { Title, Paragraph, Text } = Typography

export default function TapCodePage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>斜杠敲码</Title>
      <Paragraph type="secondary">
        通过「点」「划」按钮输入摩斯序列，使用「<Text code>/</Text>」分隔字母、
        「<Text code>//</Text>」分隔单词，完成后点击「解码」还原为文本。
      </Paragraph>

      <Card>
        <TapCodeInputPanel />
      </Card>

      <Card style={{ marginTop: 24 }} title="参考示例">
        <div style={{ lineHeight: 2.2, fontSize: 14 }}>
          <div>
            <Text code>...././.-../.-../---//.--/---/.-./.-../-..</Text>
            <Text type="secondary" style={{ marginLeft: 16 }}>
              → HELLO WORLD
            </Text>
          </div>
          <div>
            <Text code>.../---/...</Text>
            <Text type="secondary" style={{ marginLeft: 16 }}>
              → SOS
            </Text>
          </div>
          <div>
            <Text code>--/---/.-./..././</Text>
            <Text type="secondary" style={{ marginLeft: 16 }}>
              → MORSE
            </Text>
          </div>
        </div>
      </Card>
    </div>
  )
}
