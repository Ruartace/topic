<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { quizQuestions } from '@/data/quiz'
import type { Prize } from '@/data/journey'

/**
 * 答完后的解析
 *
 * 核心信息只有一条: 看片前后差了几分。
 * 其余是逐题的展开 (默认收起, 想看再点), 避免一屏塞满文字。
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

const emit = defineEmits<{ (e: 'retry'): void }>()

const expanded = ref<string | null>(null)

const total = quizQuestions.length
const gained = computed(() => props.postCorrect - props.preCorrect)

const rows = computed(() =>
  quizQuestions.map((q) => {
    const prePick = props.pre[q.id] ?? null
    const postPick = props.post[q.id] ?? null
    const correctId = q.options.find((o) => o.correct)?.id ?? null
    const preOk = prePick != null && prePick === correctId
    const postOk = postPick != null && postPick === correctId
    return {
      q,
      prePick,
      postPick,
      preOk,
      postOk,
      correctText: q.options.find((o) => o.id === correctId)?.text ?? '',
      pickedText: q.options.find((o) => o.id === postPick)?.text ?? '',
      /** 状态: 看完就对了 / 之前就会 / 还是没掌握 */
      status: postOk && !preOk ? ('fixed' as const) : postOk ? ('kept' as const) : ('missed' as const),
    }
  }),
)

const STATUS_TEXT = {
  fixed: '看完就会了',
  kept: '之前就会',
  missed: '还没掌握',
} as const

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <section class="review">
    <!-- 分数: 前后对比是主角 -->
    <div class="score">
      <div class="score__cell">
        <span class="score__label">看片前</span>
        <span class="score__value">
          <strong>{{ props.preCorrect }}</strong>
          <span>/ {{ total }}</span>
        </span>
      </div>

      <span class="score__arrow" aria-hidden="true">
        <AppIcon name="chevron-right" :size="18" decorative />
      </span>

      <div class="score__cell">
        <span class="score__label">看片后</span>
        <span class="score__value">
          <strong>{{ props.postCorrect }}</strong>
          <span>/ {{ total }}</span>
        </span>
      </div>
    </div>

    <p class="score__note">
      <template v-if="gained > 0">
        短片帮你多对上了 <strong>{{ gained }}</strong> 题。
      </template>
      <template v-else-if="props.postCorrect === props.preCorrect">
        前后一样 —— 这几个点本来就熟，或者片子里没讲到。
      </template>
      <template v-else>
        少对了一题，值得把解析再读一遍。
      </template>
    </p>

    <!-- 逐题解析: 默认收起 -->
    <ul class="list">
      <li v-for="row in rows" :key="row.q.id" class="item" :class="`is-${row.status}`">
        <button type="button" class="item__head" :aria-expanded="expanded === row.q.id" @click="toggle(row.q.id)">
          <span class="item__dot" aria-hidden="true" />
          <span class="item__body">
            <span class="item__title">{{ row.q.title }}</span>
            <span class="item__meta">
              <span class="item__status">{{ STATUS_TEXT[row.status] }}</span>
              <span class="item__pick">{{ row.postPick ? `你选了「${row.pickedText}」` : '未作答' }}</span>
            </span>
          </span>
          <AppIcon
            name="chevron-down"
            :size="18"
            decorative
            class="item__chevron"
          />
        </button>

        <Transition name="expand">
          <div v-if="expanded === row.q.id" class="item__detail">
            <dl class="detail">
              <div class="detail__row">
                <dt>正确答案</dt>
                <dd>{{ row.correctText }}</dd>
              </div>
              <div class="detail__row">
                <dt>看片前</dt>
                <dd :class="row.preOk ? 'is-ok' : 'is-bad'">
                  {{ row.prePick ? (row.preOk ? '选对了' : '选错了') : '没作答' }}
                </dd>
              </div>
              <div class="detail__row">
                <dt>看片后</dt>
                <dd :class="row.postOk ? 'is-ok' : 'is-bad'">
                  {{ row.postPick ? (row.postOk ? '选对了' : '选错了') : '没作答' }}
                </dd>
              </div>
            </dl>
            <p class="item__explain">{{ row.q.explain }}</p>
          </div>
        </Transition>
      </li>
    </ul>

    <!-- 奖品 -->
    <div v-if="props.prize" class="won">
      <span class="won__icon">
        <AppIcon name="gift" :size="20" decorative />
      </span>
      <span class="won__body">
        <span class="won__label">你的奖品</span>
        <span class="won__value">{{ props.prize.label }}</span>
        <span class="won__desc">{{ props.prize.desc }}</span>
      </span>
    </div>
    <button type="button" class="again" @click="emit('retry')">
      <AppIcon name="refresh" :size="17" decorative />
      再看一遍
    </button>
  </section>
</template>

<style scoped>
.review {
  display: grid;
  gap: var(--sp-4);
  width: 100%;
  max-width: 520px;
}

/* ---------- 分数 ---------- */
.score {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-1);
}

.score__cell {
  display: grid;
  gap: 4px;
  justify-items: center;
}

.score__label {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--c-ink-3);
}

.score__value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score__value strong {
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  color: var(--c-ink);
}

.score__cell:last-child .score__value strong {
  color: var(--c-primary);
}

.score__value span {
  font-size: 13px;
  color: var(--c-ink-3);
}

.score__arrow {
  color: var(--c-border-strong);
}

.score__note {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--c-ink-2);
}

.score__note strong {
  color: var(--c-primary);
}

/* ---------- 逐题 ---------- */
.list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--sp-2);
}

.item {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  overflow: hidden;
  transition: border-color var(--dur) var(--ease);
}

.item__head {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  font: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.item__dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: var(--r-pill);
  background: var(--c-border-strong);
}

.is-fixed .item__dot {
  background: var(--c-ok);
}

.is-kept .item__dot {
  background: var(--c-primary);
}

.is-missed .item__dot {
  background: var(--c-accent);
}

.item__body {
  flex: 1;
  display: grid;
  gap: 4px;
  min-width: 0;
}

.item__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--c-ink);
}

.item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}

.item__status {
  padding: 2px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--c-ink-2);
  background: var(--c-surface-2);
  border-radius: var(--r-pill);
}

.is-fixed .item__status {
  color: var(--c-ok);
  background: var(--c-ok-soft);
}

.is-missed .item__status {
  color: var(--c-accent);
  background: var(--c-accent-soft);
}

.item__pick {
  font-size: 12px;
  color: var(--c-ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item__chevron {
  flex: none;
  margin-top: 3px;
  color: var(--c-ink-3);
  transition: transform var(--dur) var(--ease);
}

.item__head[aria-expanded='true'] .item__chevron {
  transform: rotate(180deg);
}

.item__detail {
  display: grid;
  gap: var(--sp-3);
  padding: 0 var(--sp-4) var(--sp-4);
}

.detail {
  margin: 0;
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--c-surface-2);
  border-radius: var(--r-sm);
}

.detail__row {
  display: flex;
  gap: var(--sp-3);
  font-size: 13px;
}

.detail__row dt {
  flex: none;
  width: 5em;
  color: var(--c-ink-3);
}

.detail__row dd {
  margin: 0;
  color: var(--c-ink-2);
}

.detail__row dd.is-ok {
  color: var(--c-ok);
  font-weight: 600;
}

.detail__row dd.is-bad {
  color: var(--c-bad);
  font-weight: 600;
}

.item__explain {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--c-ink-2);
}

/* ---------- 奖品 ---------- */
.won {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--c-accent-soft);
  border: 1px solid var(--c-accent-line);
  border-radius: var(--r-lg);
}

.won__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  color: var(--c-accent);
  background: var(--c-surface);
  border-radius: var(--r-pill);
}

.won__body {
  display: grid;
  gap: 2px;
}

.won__label {
  font-size: 12px;
  color: var(--c-ink-3);
}

.won__value {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--c-ink);
}

.won__desc {
  font-size: 12.5px;
  color: var(--c-ink-2);
}

/* ---------- 再来一次 ---------- */
.again {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: var(--tap-min);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: var(--c-ink);
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.again:hover {
  background: var(--c-primary-strong);
}

.again:active {
  transform: scale(0.99);
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
