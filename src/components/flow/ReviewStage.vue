<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { quizQuestions } from '@/data/quiz'
import type { Prize } from '@/data/journey'

/**
 * 答题结果 · 学习报告
 *
 * 版式从上到下只有一条叙事线:
 *   总结数字 → 前后对比 → 学习收获 → 逐题记录 → 庆祝横幅
 * 逐题记录默认只展开第一张卡片, 其余收起, 想看再点。
 */
const props = defineProps<{
  /** 观前作答 */
  pre: Record<string, string>
  /** 观后作答 */
  post: Record<string, string>
  /** 观后答对数 */
  postCorrect: number
  /** 观前答对数 */
  preCorrect: number
  prize: Prize | null
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'lottery'): void
}>()

const total = quizQuestions.length

/* ---------------- 总结数字 ---------------- */
const wrongCount = computed(() => total - props.postCorrect)
const rate = computed(() => Math.round((props.postCorrect / total) * 100))
const preRate = computed(() => Math.round((props.preCorrect / total) * 100))
const rateGain = computed(() => rate.value - preRate.value)
const gained = computed(() => props.postCorrect - props.preCorrect)

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

/* ---------------- 学习收获 ---------------- */
function isPostOk(qid: string): boolean {
  const correctId = quizQuestions.find((q) => q.id === qid)?.options.find((o) => o.correct)?.id
  return props.post[qid] != null && props.post[qid] === correctId
}

function isPreOk(qid: string): boolean {
  const correctId = quizQuestions.find((q) => q.id === qid)?.options.find((o) => o.correct)?.id
  return props.pre[qid] != null && props.pre[qid] === correctId
}

const masteredText = computed(() => {
  const cats = [...new Set(quizQuestions.filter((q) => isPostOk(q.id)).map((q) => q.category))]
  return cats.length > 0 ? `${cats.join('、')}。` : '本轮未答对题目, 再看一遍短片试试。'
})

const reviewText = computed(() => {
  const cats = [...new Set(quizQuestions.filter((q) => !isPostOk(q.id)).map((q) => q.category))]
  return cats.length > 0 ? `${cats.join('、')}。` : '本轮全部答对, 没有需要巩固的知识点。'
})

const freshText = computed(() => {
  const fixed = quizQuestions.filter((q) => !isPreOk(q.id) && isPostOk(q.id))
  if (fixed.length > 0) return `看完短片记住了: ${fixed.map((q) => q.keyPoint).join('、')}。`
  return '再看一遍答错题的解析, 下次就是你的新收获。'
})

/* ---------------- 逐题记录 ---------------- */
type FilterKey = 'all' | 'correct' | 'wrong'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'correct', label: '答对' },
  { key: 'wrong', label: '答错' },
]

const filter = ref<FilterKey>('all')
const expanded = ref<string | null>(quizQuestions[0]?.id ?? null)

const rows = computed(() =>
  quizQuestions.map((q, index) => {
    const correctId = q.options.find((o) => o.correct)?.id ?? null
    const postPick = props.post[q.id] ?? null
    return {
      q,
      no: index + 1,
      postPick,
      postOk: postPick != null && postPick === correctId,
      correctText: q.options.find((o) => o.id === correctId)?.text ?? '',
      pickedText: q.options.find((o) => o.id === postPick)?.text ?? '',
    }
  }),
)

const counts = computed(() => ({
  all: rows.value.length,
  correct: rows.value.filter((r) => r.postOk).length,
  wrong: rows.value.filter((r) => !r.postOk).length,
}))

const visibleRows = computed(() =>
  filter.value === 'all' ? rows.value : rows.value.filter((r) => (filter.value === 'correct') === r.postOk),
)

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <section class="report">
    <!-- 报告头 -->
    <header class="report__head">
      <p class="report__eyebrow">Learning Report · 答题报告</p>
      <h2 class="report__title">本次学习总结</h2>
    </header>

    <!-- 总结数字 -->
    <div class="stats">
      <div class="stat">
        <span class="stat__num">{{ total }}</span>
        <span class="stat__label">总题数</span>
      </div>
      <div class="stat">
        <span class="stat__num">{{ props.postCorrect }}</span>
        <span class="stat__label">答对</span>
      </div>
      <div class="stat">
        <span class="stat__num is-bad">{{ wrongCount }}</span>
        <span class="stat__label">答错</span>
      </div>
      <div class="stat">
        <span class="stat__num">{{ rate }}%</span>
        <span class="stat__label">正确率</span>
      </div>
    </div>

    <!-- 学前学后对比 -->
    <section class="card">
      <h3 class="card__title">学前学后对比</h3>
      <div class="cmp">
        <div class="cmp__row">
          <div class="cmp__line">
            <span class="cmp__label">学前</span>
            <span class="cmp__value"><strong>{{ props.preCorrect }}</strong>/{{ total }}</span>
          </div>
          <div class="bar">
            <span class="bar__fill is-pre" :style="{ width: `${(props.preCorrect / total) * 100}%` }" />
          </div>
        </div>
        <div class="cmp__row">
          <div class="cmp__line">
            <span class="cmp__label">学后</span>
            <span class="cmp__value"><strong>{{ props.postCorrect }}</strong>/{{ total }}</span>
          </div>
          <div class="bar">
            <span class="bar__fill is-post" :style="{ width: `${(props.postCorrect / total) * 100}%` }" />
          </div>
        </div>
      </div>
      <div class="cmp__foot">
        <span>答题数 <strong>{{ signed(gained) }}</strong></span>
        <span>正确率 <strong>{{ signed(rateGain) }}</strong> 个百分点</span>
      </div>
    </section>

    <!-- 学习收获 -->
    <section class="card">
      <h3 class="card__title">本次学习收获</h3>
      <div class="gains">
        <div class="gain">
          <span class="gain__head">
            <span class="gain__icon is-ok"><AppIcon name="check" :size="13" decorative /></span>
            <span class="gain__label">已经掌握</span>
          </span>
          <p class="gain__text">{{ masteredText }}</p>
        </div>
        <div class="gain">
          <span class="gain__head">
            <span class="gain__icon is-info"><AppIcon name="info" :size="13" decorative /></span>
            <span class="gain__label">需要巩固</span>
          </span>
          <p class="gain__text">{{ reviewText }}</p>
        </div>
        <div class="gain">
          <span class="gain__head">
            <span class="gain__icon is-pin"><AppIcon name="pin" :size="13" decorative /></span>
            <span class="gain__label">新的知识收获</span>
          </span>
          <p class="gain__text">{{ freshText }}</p>
        </div>
      </div>
    </section>

    <!-- 逐题记录 -->
    <section class="card">
      <h3 class="card__title">逐题答题记录</h3>

      <div class="tabs" role="tablist" aria-label="按对错筛选题目">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-active': filter === f.key }"
          :aria-selected="filter === f.key"
          @click="filter = f.key"
        >
          {{ f.label }}
          <span class="tab__count">{{ counts[f.key] }}</span>
        </button>
      </div>

      <ul v-if="visibleRows.length > 0" class="qa-list">
        <li v-for="row in visibleRows" :key="row.q.id" class="qa" :class="row.postOk ? 'is-ok' : 'is-bad'">
          <button
            type="button"
            class="qa__head"
            :aria-expanded="expanded === row.q.id"
            @click="toggle(row.q.id)"
          >
            <span class="qa__meta">
              <span class="qa__pill">{{ row.postOk ? '回答正确' : '回答错误' }}</span>
              <span class="qa__no">第 {{ row.no }} 题</span>
              <AppIcon
                name="chevron-down"
                :size="16"
                decorative
                class="qa__chevron"
                :class="{ 'is-open': expanded === row.q.id }"
              />
            </span>
            <span class="qa__title">{{ row.q.title }}</span>
          </button>

          <Transition name="expand">
            <div v-if="expanded === row.q.id" class="qa__detail">
              <div class="ansbox" :class="row.postOk ? 'is-ok' : 'is-bad'">
                <span class="ansbox__label">
                  <AppIcon :name="row.postOk ? 'check' : 'close'" :size="12" decorative />
                  你的答案
                </span>
                <span class="ansbox__text">{{ row.postPick ? row.pickedText : '未作答' }}</span>
              </div>
              <div class="ansbox is-ok">
                <span class="ansbox__label">
                  <AppIcon name="check" :size="12" decorative />
                  正确答案
                </span>
                <span class="ansbox__text">{{ row.correctText }}</span>
              </div>
              <div class="qa__explain">
                <span class="qa__explain-label">题目解析</span>
                <p class="qa__explain-text">{{ row.q.explain }}</p>
              </div>
              <span class="qa__tag">
                <AppIcon name="book" :size="12" decorative />
                知识点: {{ row.q.category }}
              </span>
            </div>
          </Transition>
        </li>
      </ul>
      <p v-else class="qa-empty">这一类暂时没有题目。</p>

      <p class="card__hint">点击题目卡片，可展开查看答案与解析。</p>
    </section>

    <!-- 庆祝横幅 -->
    <div class="celebrate">
      <span class="celebrate__body">
        <span class="celebrate__title">
          <AppIcon name="trophy" :size="16" decorative />
          恭喜完成答题!
        </span>
        <span v-if="props.prize" class="celebrate__sub">已抽中「{{ props.prize.label }}」</span>
      </span>
      <button type="button" class="celebrate__btn" @click="emit('lottery')">
        {{ props.prize ? '再抽一次' : '点此抽奖' }}
      </button>
    </div>

    <button type="button" class="again" @click="emit('retry')">
      <AppIcon name="refresh" :size="15" decorative />
      再测一遍
    </button>
  </section>
</template>

<style scoped>
.report {
  display: grid;
  gap: var(--sp-3);
  width: 100%;
  max-width: 520px;
}

/* ---------- 报告头 ---------- */
.report__head {
  display: grid;
  gap: 5px;
  padding: var(--sp-1) 2px 0;
}

.report__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--c-primary);
}

.report__title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--c-ink);
}

/* ---------- 总结数字 ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
}

.stat {
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 14px 4px 11px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  box-shadow: var(--sh-1);
}

.stat__num {
  font-family: var(--font-serif);
  font-size: 23px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--c-ink);
}

.stat__num.is-bad {
  color: var(--c-bad);
}

.stat__label {
  font-size: 12px;
  color: var(--c-ink-3);
}

/* ---------- 通用卡片 ---------- */
.card {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-1);
}

.card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--c-ink);
}

.card__hint {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--c-ink-3);
}

/* ---------- 学前学后对比 ---------- */
.cmp {
  display: grid;
  gap: var(--sp-3);
}

.cmp__row {
  display: grid;
  gap: 7px;
}

.cmp__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.cmp__label {
  font-size: 13px;
  color: var(--c-ink-2);
}

.cmp__value {
  font-size: 12.5px;
  color: var(--c-ink-3);
}

.cmp__value strong {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--c-ink);
}

.bar {
  height: 7px;
  overflow: hidden;
  background: var(--c-bg-2);
  border-radius: var(--r-pill);
}

.bar__fill {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  transition: width var(--dur-slow) var(--ease);
}

.bar__fill.is-pre {
  background: var(--c-border-strong);
}

.bar__fill.is-post {
  background: var(--c-primary);
}

.cmp__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--c-divider);
  font-size: 13px;
  color: var(--c-ink-2);
}

.cmp__foot strong {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--c-ink);
}

/* ---------- 学习收获 ---------- */
.gains {
  display: grid;
  gap: var(--sp-2);
}

.gain {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  background: var(--c-surface-2);
  border-radius: var(--r-sm);
}

.gain__head {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.gain__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--r-pill);
}

.gain__icon.is-ok {
  color: var(--c-ok);
  background: var(--c-ok-soft);
}

.gain__icon.is-info {
  color: var(--c-ink-2);
  background: var(--c-bg-2);
}

.gain__icon.is-pin {
  color: var(--c-primary);
  background: var(--c-tint);
}

.gain__label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--c-ink);
}

.gain__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--c-ink-2);
}

/* ---------- 筛选 Tab ---------- */
.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  background: var(--c-bg-2);
  border-radius: var(--r-pill);
}

.tab {
  min-height: 34px;
  padding: 0 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ink-2);
  background: transparent;
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.tab.is-active {
  font-weight: 700;
  color: var(--c-ink);
  background: var(--c-surface);
  box-shadow: var(--sh-1);
}

.tab__count {
  margin-left: 2px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--c-ink-3);
}

.tab.is-active .tab__count {
  color: var(--c-ink-2);
}

/* ---------- 逐题卡片 ---------- */
.qa-list {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.qa {
  background: var(--c-surface-2);
  border-radius: var(--r-md);
  overflow: hidden;
}

.qa__head {
  display: grid;
  gap: 8px;
  width: 100%;
  padding: 12px 14px;
  font: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.qa__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qa__pill {
  padding: 2px 9px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: var(--r-pill);
}

.is-ok .qa__pill {
  color: var(--c-ok);
  background: var(--c-ok-soft);
}

.is-bad .qa__pill {
  color: var(--c-bad);
  background: var(--c-bad-soft);
}

.qa__no {
  font-size: 12px;
  color: var(--c-ink-3);
}

.qa__chevron {
  margin-left: auto;
  color: var(--c-ink-3);
  transition: transform var(--dur) var(--ease);
}

.qa__chevron.is-open {
  transform: rotate(180deg);
}

.qa__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--c-ink);
}

.qa__detail {
  display: grid;
  gap: 10px;
  padding: 0 14px 14px;
}

.ansbox {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
}

.ansbox.is-bad {
  background: var(--c-bad-soft);
}

.ansbox.is-ok {
  background: var(--c-ok-soft);
}

.ansbox__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
}

.ansbox.is-bad .ansbox__label {
  color: var(--c-bad);
}

.ansbox.is-ok .ansbox__label {
  color: var(--c-ok);
}

.ansbox__text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-ink);
}

.qa__explain {
  display: grid;
  gap: 4px;
}

.qa__explain-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--c-ink);
}

.qa__explain-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--c-ink-2);
}

.qa__tag {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--c-primary-strong);
  background: var(--c-surface);
  border: 1px solid var(--c-primary-line);
  border-radius: var(--r-pill);
}

.qa-empty {
  margin: 0;
  padding: var(--sp-3);
  text-align: center;
  font-size: 13px;
  color: var(--c-ink-3);
  background: var(--c-surface-2);
  border-radius: var(--r-md);
}

/* ---------- 庆祝横幅 ---------- */
.celebrate {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-1);
  padding: 14px 14px 14px 18px;
  background: var(--c-primary);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-2);
}

.celebrate__body {
  flex: 1;
  display: grid;
  gap: 2px;
  min-width: 0;
}

.celebrate__title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}

.celebrate__sub {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.celebrate__btn {
  flex: none;
  min-height: 38px;
  padding: 0 16px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--c-primary-strong);
  background: #fff;
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease);
}

.celebrate__btn:hover {
  background: var(--c-tint);
}

.celebrate__btn:active {
  transform: scale(0.97);
}

/* ---------- 再测一遍 ---------- */
.again {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ink-3);
  background: transparent;
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition: color var(--dur) var(--ease);
}

.again:hover {
  color: var(--c-ink-2);
}

/* ---------- 动效 ---------- */
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity var(--dur-slow) var(--ease),
    transform var(--dur-slow) var(--ease);
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }
}
</style>
