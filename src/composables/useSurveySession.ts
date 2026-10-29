import { computed, reactive, watch } from 'vue'
import { quizQuestions } from '@/data/quiz'

/**
 * 一次「观看前 → 短片 → 观看后」的完整会话
 *
 * 设计约定：
 * 1) 全流程一次性走完，观前答案与观后答案分别留存，用来对比「看完片懂了多少」
 * 2) 不做登录、不联后端，数据存在 localStorage，刷新页面可续上
 * 3) 数据结构与后端接口一一对应，后续接接口只需替换 read/write 两个函数
 */

const STORAGE_KEY = 'hx.survey.session.v1'

export interface SurveySession {
  /** 本次会话 id */
  id: string
  /** 观前作答: 题目 id -> 选项 id */
  pre: Record<string, string>
  /** 观后作答: 题目 id -> 选项 id */
  post: Record<string, string>
  /** 观前是否全部作答完毕 */
  preDone: boolean
  /** 观后是否全部作答完毕 */
  postDone: boolean
  /** 是否已提交并进入结果 */
  submitted: boolean
  /** 抽中的奖品 id */
  prizeId: string | null
  /** 抽中的时间戳 */
  prizeAt: number
  /** 开始时间戳 */
  startedAt: number
}

function emptySession(): SurveySession {
  return {
    id: '',
    pre: {},
    post: {},
    preDone: false,
    postDone: false,
    submitted: false,
    prizeId: null,
    prizeAt: 0,
    startedAt: 0,
  }
}

function readSession(): SurveySession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptySession()
    const parsed = JSON.parse(raw) as Partial<SurveySession>
    return {
      ...emptySession(),
      ...parsed,
      pre: parsed.pre ?? {},
      post: parsed.post ?? {},
    }
  } catch {
    return emptySession()
  }
}

const state = reactive<SurveySession>(readSession())

function writeSession() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 隐私模式 / 存储写满时静默降级，流程不中断
  }
}

watch(state, writeSession, { deep: true })

/** 统计某一份作答里答对的题数 */
function countCorrect(answers: Record<string, string>): number {
  return quizQuestions.filter((q) => {
    const picked = answers[q.id]
    return picked != null && picked === q.options.find((o) => o.correct)?.id
  }).length
}

export function useSurveySession() {
  /** 会话是否已经开始 */
  const started = computed(() => state.startedAt > 0)

  /** 观后答对的题数 */
  const postCorrect = computed(() => countCorrect(state.post))

  /** 观前答对的题数 */
  const preCorrect = computed(() => countCorrect(state.pre))

  /** 看完片后新学会的题数 */
  const gained = computed(() => Math.max(0, postCorrect.value - preCorrect.value))

  /** 开一场新会话 */
  function startSession() {
    state.id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    state.pre = {}
    state.post = {}
    state.preDone = false
    state.postDone = false
    state.submitted = false
    state.prizeId = null
    state.prizeAt = 0
    state.startedAt = Date.now()
    writeSession()
  }

  /** 记录观前作答 */
  function recordPre(questionId: string, optionId: string) {
    state.pre[questionId] = optionId
    writeSession()
  }

  /** 记录观后作答 */
  function recordPost(questionId: string, optionId: string) {
    state.post[questionId] = optionId
    writeSession()
  }

  /** 观前阶段结束 */
  function finishPre() {
    state.preDone = true
    writeSession()
  }

  /** 观后阶段结束 */
  function finishPost() {
    state.postDone = true
    writeSession()
  }

  /** 提交, 进入结果页 */
  function submit() {
    state.submitted = true
    writeSession()
  }

  /** 记录中奖; 传 null 表示放弃这次结果 */
  function recordPrize(prizeId: string | null) {
    state.prizeId = prizeId
    state.prizeAt = prizeId ? Date.now() : 0
    writeSession()
  }

  /** 清空当前会话 */
  function resetSession() {
    Object.assign(state, emptySession())
    writeSession()
  }

  return {
    session: state,
    started,
    preCorrect,
    postCorrect,
    gained,
    startSession,
    recordPre,
    recordPost,
    finishPre,
    finishPost,
    submit,
    recordPrize,
    resetSession,
  }
}
