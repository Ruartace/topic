export interface QuizOption {
  id: string
  text: string
  correct: boolean
}

export interface QuizQuestion {
  id: string
  category: string
  categoryIcon: 'heart' | 'pill' | 'leaf' | 'brain' | 'bone'
  title: string
  tip?: string
  options: QuizOption[]
  explain: string
  /** 答案金句: 短片里对应的一句话 */
  keyPoint: string
  /** 短片内的秒数, 用于「回看这一段」 */
  chapterAt: number
}

/** 题库独立成文件, 后续接入接口时只替换此数据源即可 */
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    category: '心脑血管',
    categoryIcon: 'heart',
    title: '成人安静状态下，正常的静息心率范围大约是多少？',
    tip: '心率是反映心血管健康最直观的指标之一',
    options: [
      { id: 'a', text: '40–60 次/分钟', correct: false },
      { id: 'b', text: '60–100 次/分钟', correct: true },
      { id: 'c', text: '100–120 次/分钟', correct: false },
      { id: 'd', text: '120–140 次/分钟', correct: false },
    ],
    explain:
      '成年人静息心率通常为 60–100 次/分钟。长期低于 60 次/分钟（运动员常见）或高于 100 次/分钟，都建议就医评估。',
    keyPoint: '安静时每分钟 60 到 100 次',
    chapterAt: 4,
  },
  {
    id: 'q2',
    category: '安全用药',
    categoryIcon: 'pill',
    title: '服用抗生素时，下面哪种做法是正确的？',
    tip: '抗生素不是万能药，滥用会破坏菌群并产生耐药性',
    options: [
      { id: 'a', text: '感觉好转就自行停药', correct: false },
      { id: 'b', text: '症状一好转就停药', correct: false },
      { id: 'c', text: '按医嘱足疗程服用，不自行增减', correct: true },
      { id: 'd', text: '剩余药留着下次生病接着吃', correct: false },
    ],
    explain:
      '抗生素需要按医嘱完成整个疗程，过早停药可能让细菌未完全清除并诱导耐药。切勿自行调整剂量或与他人共用。',
    keyPoint: '按医嘱吃完整个疗程',
    chapterAt: 9,
  },
  {
    id: 'q3',
    category: '营养饮食',
    categoryIcon: 'leaf',
    title: '根据《中国居民膳食指南》，成人每天蔬菜摄入量建议为？',
    tip: '蔬果是维生素、矿物质和膳食纤维的主要来源',
    options: [
      { id: 'a', text: '100–200 克', correct: false },
      { id: 'b', text: '300–500 克', correct: true },
      { id: 'c', text: '500–800 克', correct: false },
      { id: 'd', text: '800 克以上', correct: false },
    ],
    explain:
      '建议成人每天摄入蔬菜 300–500 克、水果 200–350 克，深色蔬菜应占蔬菜总量的一半。',
    keyPoint: '每天 300 到 500 克，深色占一半',
    chapterAt: 13,
  },
  {
    id: 'q4',
    category: '神经系统',
    categoryIcon: 'brain',
    title: '成年人每天建议睡眠时长是多少？',
    tip: '长期睡眠不足会影响免疫、记忆与情绪',
    options: [
      { id: 'a', text: '4–5 小时', correct: false },
      { id: 'b', text: '6–7 小时', correct: false },
      { id: 'c', text: '7–9 小时', correct: true },
      { id: 'd', text: '10–12 小时', correct: false },
    ],
    explain:
      '成人通常需要 7–9 小时睡眠。长期低于 6 小时或高于 10 小时，都与认知功能下降和代谢异常相关。',
    keyPoint: '每天睡够 7 到 9 小时',
    chapterAt: 18,
  },
  {
    id: 'q5',
    category: '骨骼健康',
    categoryIcon: 'bone',
    title: '预防骨质疏松，最有效的组合是？',
    tip: '骨骼也需要「负重训练」的刺激',
    options: [
      { id: 'a', text: '多喝咖啡 + 多晒太阳', correct: false },
      { id: 'b', text: '负重运动 + 钙与维生素 D 摄入', correct: true },
      { id: 'c', text: '长期卧床 + 高蛋白饮食', correct: false },
      { id: 'd', text: '节食减重 + 补充剂', correct: false },
    ],
    explain:
      '阻力与负重运动可促进骨形成，配合充足的钙（约 800–1000 mg/天）和维生素 D 是预防骨质疏松的基础组合。',
    keyPoint: '骨头喜欢负重运动',
    chapterAt: 22,
  },
]
