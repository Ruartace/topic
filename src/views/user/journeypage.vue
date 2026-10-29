<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import LotteryStage from '@/components/flow/LotteryStage.vue'
import QuestionCard from '@/components/flow/QuestionCard.vue'
import ReviewStage from '@/components/flow/ReviewStage.vue'
import StageIntro from '@/components/flow/StageIntro.vue'
import VideoStage from '@/components/flow/VideoStage.vue'
import { useSurveySession } from '@/composables/useSurveySession'
import { type Prize, PRIZES } from '@/data/journey'
import { quizQuestions } from '@/data/quiz'
/**
 * 一次性健康小调查
 *
 * 六段单向动线, 中间没有回退:
 *   入场 → 观前作答 → 观片 → 观后作答 → 解析 → 抽奖
 *
 * 设计要点:
 * 1) 观前作答不显示对错, 观后作答才判卷 —— 前后差值就是这段流程的价值
 * 2) 每一步只做一件事, 不出现并排的多个入口
 * 3) 全部状态落在本机, 刷新页面能接着上次的位置
 */

type Stage = 'intro' | 'pre' | 'video' | 'post' | 'review' | 'lottery'

const { session, preCorrect, postCorrect, startSession, recordPre, recordPost, finishPre, finishPost, submit, recordPrize, resetSession } =
  useSurveySession()

const stage = ref<Stage>('intro')
const preIndex = ref(0)
const postIndex = ref(0)
const prePicked = ref<string | null>(null)
const postPicked = ref<string | null>(null)
const prize = ref<Prize | null>(null)

const questions = quizQuestions
const total = questions.length

/** 顶部流程指示: 1 观前 2 观片 3 观后 4 结果 */
const STEPS: { key: Stage; label: string }[] = [
  { key: 'pre', label: '观前' },
  { key: 'video', label: '观片' },
  { key: 'post', label: '观后' },
  { key: 'review', label: '解析' },
]

const stepIndex = computed(() => {
  const map: Record<Stage, number> = {
    intro: -1,
    pre: 0,
    video: 1,
    post: 2,
    review: 3,
    lottery: 3,
  }
  return map[stage.value]
})

const showRail = computed(() => stage.value !== 'intro' && stage.value !== 'lottery')

const currentPre = computed(() => questions[preIndex.value]!)
const currentPost = computed(() => questions[postIndex.value]!)

/** 观前题目上方的一句提示: 观后答对几题由这里兑现 */
const preHint = computed(() => {
  const left = total - preIndex.value
  return left > 1 ? `还有 ${left} 题` : '最后一题'
})

/** 顶部计数: 观片阶段不显示题号, 其余按当前阶段取 */
const currentNumber = computed(() => {
  if (stage.value === 'post') return postIndex.value + 1
  return preIndex.value + 1
})

/** 顶部计数文案: 观片阶段不报题号 */
const railCount = computed(() => {
  if (session.submitted) return `答对 ${postCorrect.value} 题`
  if (stage.value === 'video') return '27 秒短片'
  return `第 ${Math.min(currentNumber.value, total)} 题 / 共 ${total}`
})

/* ---------------- 观前作答 ---------------- */

function pickPre(optionId: string) {
  if (prePicked.value) return
  prePicked.value = optionId
  recordPre(currentPre.value.id, optionId)
  // 观前不判卷, 选完直接进入下一题
  window.setTimeout(() => {
    if (preIndex.value < total - 1) {
      preIndex.value++
      prePicked.value = null
    } else {
      finishPre()
      goVideo()
    }
  }, 420)
}

/* ---------------- 观后作答 ---------------- */

function pickPost(optionId: string) {
  if (postPicked.value) return
  postPicked.value = optionId
  recordPost(currentPost.value.id, optionId)
}

function nextPost() {
  if (postIndex.value < total - 1) {
    postIndex.value++
    postPicked.value = null
  } else {
    finishPost()
    submit()
    stage.value = 'review'
  }
}

/* ---------------- 阶段切换 ---------------- */

/** 从观后答题跳回短片的起点 (秒) */
const replayAt = ref(0)
/** 回看时待返回的题目 id, 看完短片后回到这一题 */
const replayQuestionId = ref<string | null>(null)

function begin() {
  startSession()
  preIndex.value = 0
  postIndex.value = 0
  prePicked.value = null
  postPicked.value = null
  prize.value = null
  replayAt.value = 0
  replayQuestionId.value = null
  stage.value = 'pre'
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function goVideo() {
  stage.value = 'video'
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function goPost() {
  stage.value = 'post'
  postIndex.value = 0
  postPicked.value = null
  window.scrollTo({ top: 0, behavior: 'auto' })
}

/** 观后答题时「回看这一段」: 跳回短片并定位, 看完再回到同一题 */
function replaySegment(second: number, questionId: string) {
  replayAt.value = second
  replayQuestionId.value = questionId
  stage.value = 'video'
  window.scrollTo({ top: 0, behavior: 'auto' })
}

/** 从短片回到观后答题: 有回看来源就回到那一题, 否则从头开始 */
function backToPost() {
  if (replayQuestionId.value) {
    const idx = questions.findIndex((q) => q.id === replayQuestionId.value)
    if (idx >= 0) {
      postIndex.value = idx
      postPicked.value = session.post[replayQuestionId.value] ?? null
    }
    replayQuestionId.value = null
    replayAt.value = 0
    stage.value = 'post'
    window.scrollTo({ top: 0, behavior: 'auto' })
    return
  }
  goPost()
}

function onVideoFinished() {
  backToPost()
}

function onDrawn(p: Prize | null) {
  prize.value = p
  // 传 null 表示这次作废, 本机记录同步清掉, 刷新后不会又冒出旧奖品
  recordPrize(p ? p.id : null)
}

function toLottery() {
  stage.value = 'lottery'
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function retry() {
  resetSession()
  prize.value = null
  stage.value = 'intro'
  window.scrollTo({ top: 0, behavior: 'auto' })
}

/* ---------------- 挂载恢复 ---------------- */

onMounted(() => {
  // 刷新后回到上次停住的位置, 不让用户重来一遍
  // 有中奖记录就回到抽奖页 (奖品保持展示), 否则回到解析页
  if (session.prizeId) {
    prize.value = PRIZES.find((p) => p.id === session.prizeId) ?? null
    stage.value = 'lottery'
  } else if (session.submitted) {
    stage.value = 'review'
  } else if (session.postDone) {
    stage.value = 'post'
    postIndex.value = total - 1
  } else if (Object.keys(session.post).length > 0) {
    // 观后答到一半就刷新了: 回到刚才那一题, 并把它选过的选项还原出来
    stage.value = 'post'
    postIndex.value = Math.max(0, Math.min(Object.keys(session.post).length - 1, total - 1))
    postPicked.value = session.post[questions[postIndex.value]!.id] ?? null
  } else if (session.preDone) {
    stage.value = 'video'
  } else if (session.startedAt > 0) {
    stage.value = 'pre'
    preIndex.value = Math.min(Object.keys(session.pre).length, total - 1)
  }
})

onBeforeUnmount(() => {
  window.scrollTo({ top: 0, behavior: 'auto' })
})
</script>

<template>
  <div class="flow" :class="`is-${stage}`">
    <!-- 顶部流程指示 -->
    <header v-if="showRail" class="rail">
      <div class="rail__inner">
        <ol class="rail__list">
          <li v-for="(s, i) in STEPS" :key="s.key" class="rail__item" :class="{ 'is-done': i < stepIndex, 'is-now': i === stepIndex }">
            <span class="rail__dot" aria-hidden="true" />
            <span class="rail__label">{{ s.label }}</span>
          </li>
        </ol>
        <span class="rail__count">{{ railCount }}</span>
      </div>
    </header>

    <main class="stage">
      <!-- 单向动线: 入场 → 观前 → 观片 → 观后 → 解析 → 抽奖
           六个场景放在同一个 Transition 内, 保证 v-if / v-else-if 是连续的兄弟链 -->
      <Transition name="scene">
        <!-- 1 · 入场 -->
        <StageIntro v-if="stage === 'intro'" key="intro" @start="begin" />

        <!-- 2 · 观前作答 -->
        <section v-else-if="stage === 'pre'" key="pre" class="panel">
          <p class="panel__eyebrow">
            <AppIcon name="lightbulb" :size="15" decorative />
            凭第一直觉 · 不判对错
          </p>
          <QuestionCard
            :key="currentPre.id"
            :question="currentPre"
            :index="preIndex"
            :total="total"
            mode="pre"
            :picked="prePicked"
            @pick="pickPre"
          />
          <p class="panel__note">{{ preHint }} · 看完短片还有一次机会</p>
        </section>

        <!-- 3 · 观片 -->
        <section v-else-if="stage === 'video'" key="video" class="panel">
          <p class="panel__eyebrow">
            <AppIcon name="film" :size="15" decorative />
            {{ replayQuestionId ? '回看这一段 · 看完回到原题' : '27 秒 · 答案都在里面' }}
          </p>
          <VideoStage :start-at="replayAt" @finished="onVideoFinished" />
          <div class="panel__row">
            <button type="button" class="link" @click="backToPost">
              看完了，直接答题
              <AppIcon name="chevron-right" :size="16" decorative />
            </button>
          </div>
        </section>

        <!-- 4 · 观后作答 -->
        <section v-else-if="stage === 'post'" key="post" class="panel">
          <p class="panel__eyebrow">
            <AppIcon name="check" :size="15" decorative />
            再答一次 · 这次判对错
          </p>
          <QuestionCard
            :key="currentPost.id"
            :question="currentPost"
            :index="postIndex"
            :total="total"
            mode="post"
            :picked="postPicked"
            @pick="pickPost"
            @next="nextPost"
            @replay="(sec) => replaySegment(sec, currentPost.id)"
          />
        </section>

        <!-- 5 · 解析 -->
        <section v-else-if="stage === 'review'" key="review" class="panel">
          <p class="panel__eyebrow">
            <AppIcon name="document" :size="15" decorative />
            你的答案
          </p>
          <ReviewStage
            :pre="session.pre"
            :post="session.post"
            :pre-correct="preCorrect"
            :post-correct="postCorrect"
            :prize="prize"
            @retry="retry"
          />
          <div class="panel__row">
            <button type="button" class="cta-wide" @click="toLottery">
              <AppIcon name="gift" :size="18" decorative />
              {{ prize ? '再摇一次' : '抽一份奖品' }}
            </button>
          </div>
        </section>

        <!-- 6 · 抽奖 -->
        <section v-else key="lottery" class="panel">
          <p class="panel__eyebrow">
            <AppIcon name="gift" :size="15" decorative />
            摇一支签
          </p>
          <LotteryStage :initial-prize="prize" @drawn="onDrawn" />
          <div class="panel__row">
            <button type="button" class="link" @click="stage = 'review'">
              <AppIcon name="document" :size="16" decorative />
              回去看解析
            </button>
            <button type="button" class="link" @click="retry">
              <AppIcon name="refresh" :size="16" decorative />
              再看一遍
            </button>
          </div>
        </section>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.flow {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(110% 70% at 50% 0%, #fdfdf9 0%, rgba(253, 253, 249, 0) 55%),
    var(--c-bg);
}

/* ---------- 顶部流程指示 ---------- */
.rail {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(246, 246, 240, 0.86);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--c-divider);
  /* 左右边缘渐隐, 暗示可以横滑 */
  mask-image: linear-gradient(90deg, #000 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 88%, transparent 100%);
}

.rail__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--gutter);
  overflow-x: auto;
  scrollbar-width: none;
}

.rail__inner::-webkit-scrollbar {
  display: none;
}

.rail__list {
  display: flex;
  align-items: center;
  flex: none;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.rail__item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 6px;
  border-radius: var(--r-pill);
  transition: background-color var(--dur) var(--ease);
}

.rail__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--c-border-strong);
  transition:
    background-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.rail__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-ink-3);
  transition: color var(--dur) var(--ease);
}

.rail__item.is-done .rail__dot {
  background: var(--c-primary);
}

.rail__item.is-done .rail__label {
  color: var(--c-ink-2);
}

.rail__item.is-now {
  background: var(--c-primary-soft);
}

.rail__item.is-now .rail__dot {
  background: var(--c-primary);
  transform: scale(1.35);
}

.rail__item.is-now .rail__label {
  color: var(--c-primary-strong);
}

.rail__count {
  flex: none;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--c-ink-3);
}

/* ---------- 舞台 ---------- */
.stage {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel {
  flex: 1;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: var(--sp-4);
  width: 100%;
  max-width: 560px;
  margin-inline: auto;
  padding: var(--sp-6) var(--gutter) calc(var(--sp-7) + env(safe-area-inset-bottom));
}

.panel__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 5px 12px 5px 10px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--c-primary-strong);
  background: var(--c-primary-soft);
  border-radius: var(--r-pill);
}

.panel__note {
  margin: 0;
  font-size: 12.5px;
  color: var(--c-ink-3);
}

.panel__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  width: 100%;
  max-width: 520px;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: var(--tap-min);
  padding: 0 var(--sp-4);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-ink-2);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-pill);
  cursor: pointer;
  transition:
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}

.link:hover {
  color: var(--c-ink);
  border-color: var(--c-border-strong);
}

.cta-wide {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 52px;
  font: inherit;
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--c-ink);
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.cta-wide:hover {
  background: var(--c-primary-strong);
}

.cta-wide:active {
  transform: scale(0.99);
}

/* ---------- 场景切换 ---------- */
.scene-enter-active {
  transition:
    opacity var(--dur-cinema) var(--ease),
    transform var(--dur-cinema) var(--ease);
}

.scene-leave-active {
  transition:
    opacity 180ms var(--ease),
    transform 180ms var(--ease);
  position: absolute;
  inset-inline: 0;
}

.scene-enter-from {
  opacity: 0;
  transform: translateY(18px);
}

.scene-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .scene-enter-active,
  .scene-leave-active {
    transition: none;
  }
}
</style>
