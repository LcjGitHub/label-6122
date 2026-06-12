import { describe, it, expect } from 'vitest'
import {
  textToMorse,
  morseToText,
  isValidMorse,
  greedyMorseToText,
} from '../utils/morse'

describe('textToMorse', () => {
  it('正常转换单个字母', () => {
    expect(textToMorse('A')).toBe('.-')
    expect(textToMorse('S')).toBe('...')
    expect(textToMorse('O')).toBe('---')
  })

  it('正常转换单个数字', () => {
    expect(textToMorse('0')).toBe('-----')
    expect(textToMorse('1')).toBe('.----')
    expect(textToMorse('9')).toBe('----.')
  })

  it('正常转换小写字母（自动转大写）', () => {
    expect(textToMorse('hello')).toBe('.... . .-.. .-.. ---')
    expect(textToMorse('sos')).toBe('... --- ...')
  })

  it('正常转换多单词文本，单词间用 / 分隔', () => {
    expect(textToMorse('HELLO WORLD')).toBe(
      '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    )
    expect(textToMorse('SOS HELP')).toBe('... --- ... / .... . .-.. .--.')
  })

  it('空输入返回空字符串', () => {
    expect(textToMorse('')).toBe('')
    expect(textToMorse('   ')).toBe('')
    expect(textToMorse('\t\n')).toBe('')
  })

  it('前后空白被忽略', () => {
    expect(textToMorse('  HELLO  ')).toBe('.... . .-.. .-.. ---')
  })

  it('多个连续空格视为单词分隔', () => {
    expect(textToMorse('HELLO   WORLD')).toBe(
      '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    )
  })

  it('包含不支持的字符时抛出错误', () => {
    expect(() => textToMorse('HELLO@WORLD')).toThrow('不支持的字符: @')
    expect(() => textToMorse('你好')).toThrow('不支持的字符: 你')
    expect(() => textToMorse('A!B')).toThrow('不支持的字符: !')
  })

  it('字母数字混合转换', () => {
    expect(textToMorse('ABC123')).toBe(
      '.- -... -.-. .---- ..--- ...--',
    )
  })
})

describe('morseToText', () => {
  it('正常转换单个字母的摩斯码', () => {
    expect(morseToText('.-')).toBe('A')
    expect(morseToText('...')).toBe('S')
    expect(morseToText('---')).toBe('O')
  })

  it('正常转换单个数字的摩斯码', () => {
    expect(morseToText('-----')).toBe('0')
    expect(morseToText('.----')).toBe('1')
    expect(morseToText('----.')).toBe('9')
  })

  it('正常转换多字母单词', () => {
    expect(morseToText('.... . .-.. .-.. ---')).toBe('HELLO')
    expect(morseToText('... --- ...')).toBe('SOS')
  })

  it('正常转换多单词摩斯码，/ 作为单词分隔', () => {
    expect(
      morseToText('.... . .-.. .-.. --- / .-- --- .-. .-.. -..'),
    ).toBe('HELLO WORLD')
    expect(morseToText('... --- ... / .... . .-.. .--.')).toBe('SOS HELP')
  })

  it('单词分隔符 / 周围允许有不同数量的空格', () => {
    expect(morseToText('.- / -...')).toBe('A B')
    expect(morseToText('.-/ -...')).toBe('A B')
    expect(morseToText('.- /-...')).toBe('A B')
    expect(morseToText('.-/-...')).toBe('A B')
  })

  it('空输入返回空字符串', () => {
    expect(morseToText('')).toBe('')
    expect(morseToText('   ')).toBe('')
  })

  it('前后空白被忽略', () => {
    expect(morseToText('  .... . .-.. .-.. ---  ')).toBe('HELLO')
  })

  it('无效的摩斯码序列抛出错误', () => {
    expect(() => morseToText('......')).toThrow('无效的摩斯码: ......')
    expect(() => morseToText('.- abc')).toThrow('无效的摩斯码: abc')
  })

  it('字母数字混合解码', () => {
    expect(
      morseToText('.- -... -.-. .---- ..--- ...--'),
    ).toBe('ABC123')
  })
})

describe('isValidMorse', () => {
  it('空字符串或纯空白视为合法', () => {
    expect(isValidMorse('')).toBe(true)
    expect(isValidMorse('   ')).toBe(true)
    expect(isValidMorse('\t\n')).toBe(true)
  })

  it('单个合法摩斯码字符', () => {
    expect(isValidMorse('.')).toBe(true)
    expect(isValidMorse('-')).toBe(true)
    expect(isValidMorse('.-')).toBe(true)
    expect(isValidMorse('...')).toBe(true)
    expect(isValidMorse('---')).toBe(true)
  })

  it('包含单词分隔符 / 视为合法', () => {
    expect(isValidMorse('/')).toBe(true)
    expect(isValidMorse('.- / -...')).toBe(true)
    expect(isValidMorse('... --- ... / .... . .-.. .--.')).toBe(true)
  })

  it('非法字符序列', () => {
    expect(isValidMorse('a')).toBe(false)
    expect(isValidMorse('.a')).toBe(false)
    expect(isValidMorse('.- abc')).toBe(false)
    expect(isValidMorse('123')).toBe(false)
    expect(isValidMorse('._~')).toBe(false)
  })

  it('包含混合非法字符', () => {
    expect(isValidMorse('.- @ -...')).toBe(false)
    expect(isValidMorse('你好')).toBe(false)
  })

  it('合法的完整句子', () => {
    expect(
      isValidMorse('.... . .-.. .-.. --- / .-- --- .-. .-.. -..'),
    ).toBe(true)
  })
})

describe('greedyMorseToText', () => {
  it('空输入返回空字符串', () => {
    expect(greedyMorseToText('')).toBe('')
    expect(greedyMorseToText('   ')).toBe('')
  })

  it('正常贪心解码：单个字符', () => {
    expect(greedyMorseToText('.')).toBe('E')
    expect(greedyMorseToText('-')).toBe('T')
    expect(greedyMorseToText('.-')).toBe('A')
  })

  it('贪心策略按最长匹配优先（数字优先于更短的字母组合）', () => {
    expect(greedyMorseToText('-----')).toBe('0')
    expect(greedyMorseToText('.----')).toBe('1')
    expect(greedyMorseToText('....-')).toBe('4')
    expect(greedyMorseToText('.....')).toBe('5')
  })

  it('贪心解码多字符', () => {
    expect(greedyMorseToText('....')).toBe('H')
    expect(greedyMorseToText('......')).toBe('5E')
    expect(greedyMorseToText('.......')).toBe('5I')
  })

  it('贪心解码按最长优先：连续点划串优先匹配数字', () => {
    expect(greedyMorseToText('...---...')).toBe('3B')
  })

  it('贪心解码字母序列', () => {
    expect(greedyMorseToText('.-.-.-')).toBe('RK')
  })

  it('格式错误时抛出异常：包含非法字符', () => {
    expect(() => greedyMorseToText('.-a')).toThrow(
      '格式错误：仅允许使用点（.）和划（-）',
    )
    expect(() => greedyMorseToText('abc')).toThrow(
      '格式错误：仅允许使用点（.）和划（-）',
    )
    expect(() => greedyMorseToText('._-')).toThrow(
      '格式错误：仅允许使用点（.）和划（-）',
    )
  })

  it('前后空白被忽略', () => {
    expect(greedyMorseToText('  ...---...  ')).toBe('3B')
    expect(greedyMorseToText('  .-  ')).toBe('A')
  })

  it('任意纯点划序列总能被解析（回退到单个字符 E/T）', () => {
    expect(greedyMorseToText('........')).toBe('5S')
    expect(greedyMorseToText('--------')).toBe('0O')
  })

  it('贪心解码字母数字混合输出', () => {
    expect(greedyMorseToText('.-.----')).toBe('ROT')
    expect(greedyMorseToText('...--...')).toBe('3S')
  })
})
