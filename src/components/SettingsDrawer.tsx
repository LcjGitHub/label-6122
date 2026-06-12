import { Drawer, Radio, Space, Typography, Divider } from 'antd'
import {
  useAudioSettingsStore,
  type SpeedLevel,
  type PitchLevel,
} from '../store/audioSettingsStore'

const { Title, Text } = Typography

const speedOptions: { label: string; value: SpeedLevel }[] = [
  { label: '慢速', value: 'slow' },
  { label: '正常', value: 'normal' },
  { label: '快速', value: 'fast' },
]

const pitchOptions: { label: string; value: PitchLevel }[] = [
  { label: '低', value: 'low' },
  { label: '中', value: 'mid' },
  { label: '高', value: 'high' },
]

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export default function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { speed, pitch, setSpeed, setPitch } = useAudioSettingsStore()

  return (
    <Drawer
      title="音频设置"
      placement="right"
      onClose={onClose}
      open={open}
      width={320}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: 8 }}>
            播放速度
          </Title>
          <Radio.Group
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            {speedOptions.map((opt) => (
              <Radio.Button key={opt.value} value={opt.value}>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {speed === 'slow' && '点划间隔更长，适合初学者辨认'}
            {speed === 'normal' && '标准速度，日常练习推荐'}
            {speed === 'fast' && '紧凑节奏，挑战高阶听力'}
          </Text>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: 8 }}>
            音调高低
          </Title>
          <Radio.Group
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            {pitchOptions.map((opt) => (
              <Radio.Button key={opt.value} value={opt.value}>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {pitch === 'low' && '低音 400Hz，声音沉稳'}
            {pitch === 'mid' && '中音 600Hz，经典摩斯音'}
            {pitch === 'high' && '高音 800Hz，清脆明亮'}
          </Text>
        </div>
      </Space>
    </Drawer>
  )
}
