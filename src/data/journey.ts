/** 文案与静态数据: 一次性健康小测验（直觉 → 短片 → 作答 → 揭晓 → 惊喜） */
export interface VideoChapter {
  /** 秒 */
  at: number
  title: string
  desc: string
}

export const VIDEO = {
  src: `${import.meta.env.BASE_URL}media/health-brief.mp4`,
  poster: `${import.meta.env.BASE_URL}media/health-brief.jpg`,
  /** 约 27 秒 */
  durationLabel: '约 27 秒',
  title: '五个健康小问题',
  intro:
    '一段竖屏小短片，把 5 道题的答案各用一句话讲清楚：心率多少算正常、抗生素该怎么吃、每天吃多少蔬菜、睡多久才够、骨头喜欢什么样的运动。看完再答一次，答案基本都在里面。',
  chapters: [
    { at: 0, title: '开场', desc: '先猜再看，答案在片尾' },
    { at: 4, title: '静息心率', desc: '成年人安静时 60–100 次/分钟' },
    { at: 9, title: '抗生素', desc: '按医嘱吃完整个疗程' },
    { at: 13, title: '蔬菜', desc: '每天 300–500 克，深色占一半' },
    { at: 18, title: '睡眠', desc: '成年人每天 7–9 小时' },
    { at: 22, title: '骨骼', desc: '负重运动 + 钙与维生素 D' },
  ] as VideoChapter[],
}

export interface Prize {
  id: string
  label: string
  desc: string
}

export const PRIZES: Prize[] = [
  { id: 'tea', label: '养生茶包一份', desc: '凭本页截图，到前台领取' },
  { id: 'bookmark', label: '竹叶书签一枚', desc: '凭本页截图，到前台领取' },
  { id: 'book', label: '健康知识手册一本', desc: '凭本页截图，到前台领取' },
  { id: 'coupon', label: '定制体检 8 折券', desc: '截图保存，30 天内有效' },
  { id: 'luck', label: '健康好运', desc: '今天也要好好吃饭、好好睡觉' },
]

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
