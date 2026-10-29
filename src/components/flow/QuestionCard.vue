<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { QuizOption, QuizQuestion } from '@/data/quiz'

/**
 * 单题卡 · 两种模式
 *
 * - pre  (观前): 只记录选择, 点完直接进入下一题。不显示对错,
 *                 避免用户在还没看片时产生「答错了」的负担。
 * - post (观后): 允许判断对错, 立刻给出结果与一句要点。
 */
const props = withDefaults(
  defineProps<{
    question: QuizQuestion
    index: number
    total: number
    mode: 'pre' | 'post'
    /** 已选中的选项 id (受控) */
    picked?: string | null
  }>(),
  { picked: null },
)

const emit = defineEmits<{
  (e: 'pick', optionId: string): void
  (e: 'next'): void
  /** 请求回看短片里的对应段落 */
  (e: 'replay', second: number): void
}>()

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/** post 模式下, 选中后短暂停留再让用户点「下一题」 */
const settled = ref(false)

/**
 * 从「回看这一段」返回时, 组件会被重新挂载, 但这一题已经选过了。
 * 挂载时直接把判定补上, 避免用户看到一张没有结论的卡片。
 */
onMounted(() => {
  if (props.mode === 'post' && props.picked) {
    settled.value = true
  }
})

const correctId = computed(() => props.question.options.find((o) => o.correct)?.id ?? null)

/** post 模式且已选: 展示对错 */
const showVerdict = computed(() => props.mode === 'post' && !!props.picked && settled.value)

function stateOf(option: QuizOption): 'idle' | 'picked' | 'correct' | 'wrong' | 'dimmed' {
  if (props.mode === 'pre') {
    return option.id === props.picked ? 'picked' : 'idle'
  }
  if (!props.picked || !settled.value) {
    return option.id === props.picked ? 'picked' : 'idle'
  }
  if (option.id === correctId.value) return 'correct'
  if (option.id === props.picked) return 'wrong'
  return 'dimmed'
}

function choose(option: QuizOption) {
  if (props.picked) return
  emit('pick', option.id)
  if (props.mode === 'post') {
    // 延后一拍再揭晓, 让「点了」与「判卷」分成两个动作, 不糊在一起
    window.setTimeout(() => {
      settled.value = true
    }, 260)
  }
}

function advance() {
  settled.value = false
  emit('next')
}
</script>

<template>
  <div class="card">
    <div class="card__top">
      <span class="card__count">
        {{ String(props.index + 1).padStart(2, '0') }}
        <span class="card__slash">/</span>
        {{ String(props.total).padStart(2, '0') }}
      </span>
      <span class="card__tag">
        <AppIcon :name="props.question.categoryIcon" :size="15" decorative />
        {{ props.question.category }}
      </span>
    </div>

    <h2 class="card__title">{{ props.question.title }}</h2>

    <p v-if="props.question.tip" class="card__tip">{{ props.question.tip }}</p>

    <div class="options" role="group" :aria-label="props.question.title">
      <button
        v-for="(opt, i) in props.question.options"
        :key="opt.id"
        type="button"
        class="opt"
        :class="`is-${stateOf(opt)}`"
        :style="{ '--i': String(i) }"
        :disabled="!!props.picked"
        :aria-pressed="stateOf(opt) !== 'idle'"
        @click="choose(opt)"
      >
        <span class="opt__badge" aria-hidden="true">
          <AppIcon v-if="stateOf(opt) === 'correct'" name="check" :size="16" decorative />
          <AppIcon v-else-if="stateOf(opt) === 'wrong'" name="close" :size="16" decorative />
          <template v-else>{{ LETTERS[i] }}</template>
        </span>
        <span class="opt__text">{{ opt.text }}</span>
      </button>
    </div>

    <!-- 观前: 选完即走, 不给任何对错暗示 -->
    <Transition name="hint">
      <p v-if="props.mode === 'pre' && props.picked" class="card__foot card__foot--soft">
        已记下你的选择，下一题
      </p>
    </Transition>

    <!-- 观后: 判定 + 一句要点 + 回看 + 继续 -->
    <Transition name="hint">
      <div v-if="showVerdict" class="verdict" :class="props.picked === correctId ? 'is-ok' : 'is-bad'">
        <p class="verdict__head">
          <AppIcon :name="props.picked === correctId ? 'check' : 'lightbulb'" :size="16" decorative />
          <strong>{{ props.picked === correctId ? '答对了' : '差一点' }}</strong>
          <span class="verdict__key">{{ props.question.keyPoint }}</span>
        </p>

        <div class="verdict__actions">
          <button type="button" class="verdict__replay" @click="emit('replay', props.question.chapterAt)">
            <AppIcon name="film" :size="15" decorative />
            回看这一段
          </button>
          <button type="button" class="verdict__next" @click="advance">
            {{ props.index === props.total - 1 ? '提交并看解析' : '下一题' }}
            <AppIcon name="chevron-right" :size="17" decorative />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.card {
  width: 100%;
  max-width: 520px;
  display: grid;
  gap: var(--sp-3);
}

.card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.card__count {
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--c-ink-3);
}

.card__slash {
  margin: 0 2px;
  color: var(--c-border-strong);
}

.card__tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-primary-strong);
  background: var(--c-primary-soft);
  border-radius: var(--r-pill);
}

.card__title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.6;
  letter-spacing: 0.01em;
  color: var(--c-ink);
}

.card__tip {
  margin: calc(var(--sp-2) * -1) 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--c-ink-3);
}

/* ---------- 选项 ---------- */
.options {
  display: grid;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}

.opt {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  min-height: var(--tap-min);
  padding: var(--sp-3) var(--sp-4);
  text-align: left;
  font: inherit;
  color: var(--c-ink);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition:
    border-color var(--dur) var(--ease),
    background-color var(--dur) var(--ease),
    transform var(--dur-fast) var(--ease);
  animation: opt-in 480ms var(--ease-out-quint) both;
  animation-delay: calc(var(--i) * 60ms + 60ms);
}

.opt:hover:not(:disabled) {
  border-color: var(--c-primary-line);
}

.opt:active:not(:disabled) {
  transform: scale(0.992);
}

.opt:disabled {
  cursor: default;
}

.opt__badge {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-ink-3);
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--r-pill);
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}

.opt__text {
  font-size: 14.5px;
  line-height: 1.55;
}

/* 观前选中: 只表达「记下了」, 不用对错色 */
.is-picked {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
}

.is-picked .opt__badge {
  color: #fff;
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.is-correct {
  border-color: var(--c-ok-line);
  background: var(--c-ok-soft);
}

.is-correct .opt__badge {
  color: #fff;
  background: var(--c-ok);
  border-color: var(--c-ok);
}

.is-wrong {
  border-color: var(--c-bad-line);
  background: var(--c-bad-soft);
}

.is-wrong .opt__badge {
  color: #fff;
  background: var(--c-bad);
  border-color: var(--c-bad);
}

.is-dimmed {
  color: var(--c-ink-3);
  background: transparent;
}

.is-dimmed .opt__badge {
  color: var(--c-ink-3);
  background: transparent;
  border-color: var(--c-divider);
}

/* ---------- 判定 ---------- */
.verdict {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border-radius: var(--r-md);
  border: 1px solid;
}

.verdict.is-ok {
  background: var(--c-ok-soft);
  border-color: var(--c-ok-line);
}

.verdict.is-bad {
  background: var(--c-surface);
  border-color: var(--c-border);
}

.verdict__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  color: var(--c-ink);
}

.verdict.is-ok .verdict__head {
  color: var(--c-ok);
}

/* 金句: 与判定同排, 一眼看完 */
.verdict__key {
  flex: 1 1 100%;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--c-ink-2);
}

.verdict__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}

.verdict__replay {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: var(--tap-min);
  padding: 0 var(--sp-4);
  font: inherit;
  font-size: 13.5px;
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

.verdict__replay:hover {
  color: var(--c-ink);
  border-color: var(--c-border-strong);
}

.verdict__next {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: var(--tap-min);
  padding: 0 var(--sp-4);
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

.verdict__next:hover {
  background: var(--c-primary-strong);
}

.verdict__next:active {
  transform: scale(0.985);
}

.card__foot {
  margin: 0;
  font-size: 13px;
  text-align: center;
}

.card__foot--soft {
  color: var(--c-ink-3);
}

/* ---------- 动效 ---------- */
@keyframes opt-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hint-enter-active {
  transition:
    opacity var(--dur-slow) var(--ease),
    transform var(--dur-slow) var(--ease);
}

.hint-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .opt {
    animation: none;
  }

  .hint-enter-active {
    transition: none;
  }
}
</style>
