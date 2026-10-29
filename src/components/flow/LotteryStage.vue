<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { PRIZES, type Prize } from '@/data/journey'

/**
 * 竹签抽奖
 *
 * 用「抽签」而不是转盘: 签筒是竹子的, 和熊猫主题是一套语言,
 * 签从筒里升起的过程有明确的时间感, 比闪光灯更能留住注意力。
 */
const emit = defineEmits<{ (e: 'drawn', prize: Prize | null): void }>()

const props = withDefaults(defineProps<{ initialPrize?: Prize | null }>(), { initialPrize: null })

const SLIP_COUNT = 5

/** 签筒里露出的签 */
const slips = ref<{ id: string; prizeId: string; lean: number }[]>(
  PRIZES.slice(0, SLIP_COUNT).map((p, i) => ({
    id: `${p.id}-${i}`,
    prizeId: p.id,
    lean: -6 + i * 3,
  })),
)

const drawing = ref(false)
const drawnId = ref<string | null>(null)
/** 本地记录的奖品: 与 prop 解耦, 这样「再摇一次」能真正归零 */
const localPrize = ref<Prize | null>(props.initialPrize)

/** 已抽中的奖品 */
const drawnPrize = computed(() => localPrize.value)

// 带着上次抽中的奖回来时, 让对应那支签保持升起状态
onMounted(() => {
  if (props.initialPrize) {
    const slip = slips.value.find((s) => s.prizeId === props.initialPrize?.id)
    if (slip) drawnId.value = slip.id
  }
})

function draw() {
  if (drawing.value) return
  drawing.value = true
  drawnId.value = null
  localPrize.value = null

  // 摇签: 签在筒里抖动
  window.setTimeout(() => {
    const target = slips.value[Math.floor(Math.random() * slips.value.length)]
    if (target) {
      drawnId.value = target.id
      const prize = PRIZES.find((p) => p.id === target.prizeId)
      if (prize) {
        localPrize.value = prize
        emit('drawn', prize)
      }
    }
    drawing.value = false
  }, 900)
}

function reset() {
  drawnId.value = null
  localPrize.value = null
  drawing.value = false
  emit('drawn', null)
}
</script>

<template>
  <div class="lottery">
    <div class="lottery__stage" :class="{ 'is-drawing': drawing, 'is-drawn': !!drawnId }">
      <!-- 签筒 -->
      <div class="tube" aria-hidden="true">
        <span class="tube__rim" />
        <span class="tube__body">
          <span class="tube__node tube__node--a" />
          <span class="tube__node tube__node--b" />
          <span class="tube__node tube__node--c" />
        </span>
      </div>

      <!-- 签 -->
      <div class="sticks">
        <span
          v-for="(s, i) in slips"
          :key="s.id"
          class="stick"
          :class="{
            'is-risen': s.id === drawnId,
            'is-hidden': !!drawnId && s.id !== drawnId,
          }"
          :style="{
            '--lean': `${s.lean}deg`,
            '--i': String(i),
            '--delay': `${i * 60}ms`,
          }"
        >
          <span class="stick__head" />
        </span>
      </div>
    </div>

    <div class="lottery__panel">
      <Transition name="prize" mode="out-in">
        <!-- 已抽出 -->
        <div v-if="drawnPrize" key="prize" class="prize">
          <p class="prize__eyebrow">
            <AppIcon name="gift" :size="15" decorative />
            恭喜
          </p>
          <p class="prize__label">{{ drawnPrize.label }}</p>
          <p class="prize__desc">{{ drawnPrize.desc }}</p>
        </div>

        <!-- 未抽 -->
        <div v-else key="idle" class="idle">
          <p class="idle__title">{{ drawing ? '正在摇签…' : '抽一支竹签' }}</p>
          <p class="idle__desc">每个名额只有一份，抽完即止</p>
        </div>
      </Transition>

      <div class="lottery__actions">
        <button v-if="!drawnId" type="button" class="btn btn--ink" :disabled="drawing" @click="draw">
          <AppIcon name="bamboo" :size="17" decorative />
          {{ drawing ? '摇签中' : '摇一支签' }}
        </button>
        <template v-else>
          <button type="button" class="btn btn--ink" @click="reset">
            <AppIcon name="refresh" :size="17" decorative />
            再摇一次
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lottery {
  display: grid;
  gap: var(--sp-5);
  justify-items: center;
}

/* ---------- 签筒 ---------- */
.lottery__stage {
  position: relative;
  width: 180px;
  height: 272px;
  display: grid;
  place-items: end center;
}

.tube {
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -48px;
  width: 96px;
  height: 128px;
  display: grid;
  justify-items: center;
}

.tube__rim {
  position: absolute;
  top: 0;
  width: 104px;
  height: 16px;
  border-radius: var(--r-pill);
  background: var(--c-primary-strong);
}

.tube__body {
  position: absolute;
  top: 12px;
  width: 92px;
  height: 116px;
  border-radius: 10px 10px 16px 16px;
  background: linear-gradient(90deg, #a8c1ab 0%, #c3d6c2 42%, #8fac93 100%);
  overflow: hidden;
}

.tube__node {
  position: absolute;
  left: 50%;
  width: 26px;
  height: 18px;
  margin-left: -13px;
  border-radius: 4px;
  background: rgba(60, 88, 66, 0.22);
}

.tube__node--a {
  top: 16px;
}

.tube__node--b {
  top: 46px;
}

.tube__node--c {
  top: 76px;
}

/* ---------- 签 ---------- */
.sticks {
  position: absolute;
  bottom: 96px;
  left: 50%;
  margin-left: -60px;
  width: 120px;
  height: 92px;
}

.stick {
  position: absolute;
  bottom: 0;
  left: calc(12px + var(--i) * 22px);
  width: 7px;
  height: 92px;
  border-radius: 3px 3px 1px 1px;
  background: linear-gradient(180deg, #e6d9b8 0%, #cfbe93 100%);
  transform-origin: bottom center;
  transform: rotate(var(--lean));
  transition:
    transform 620ms var(--ease-out-quint),
    opacity 320ms var(--ease);
  animation: stick-idle 3.4s ease-in-out infinite;
  animation-delay: var(--delay);
}

.stick__head {
  position: absolute;
  top: 0;
  left: 50%;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  border-radius: var(--r-pill);
  background: var(--c-accent);
}

/* 摇签时签跟着晃 */
.is-drawing .stick {
  animation: stick-shake 160ms ease-in-out infinite;
}

/* 中签的那支升起 */
.stick.is-risen {
  transform: translateY(-74px) rotate(0deg);
  animation: none;
  box-shadow: var(--sh-2);
}

.stick.is-hidden {
  opacity: 0.2;
  transform: translateY(20px);
}

/* ---------- 抽奖信息 ---------- */
.lottery__panel {
  width: 100%;
  max-width: 380px;
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
  text-align: center;
}

.idle__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--c-ink);
}

.idle__desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--c-ink-3);
}

.prize {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.prize__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  padding: 4px 11px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border: 1px solid var(--c-accent-line);
  border-radius: var(--r-pill);
}

.prize__label {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--c-ink);
}

.prize__desc {
  margin: 0;
  font-size: 13.5px;
  color: var(--c-ink-2);
}

.lottery__actions {
  display: flex;
  gap: var(--sp-3);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: var(--tap-min);
  padding: 0 var(--sp-5);
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

.btn:hover:not(:disabled) {
  background: var(--c-primary-strong);
}

.btn:active:not(:disabled) {
  transform: scale(0.985);
}

.btn:disabled {
  color: var(--c-ink-3);
  background: var(--c-surface-2);
  cursor: default;
}

/* ---------- 动效 ---------- */
@keyframes stick-idle {
  0%,
  100% {
    transform: rotate(var(--lean));
  }
  50% {
    transform: rotate(calc(var(--lean) * 1.5));
  }
}

@keyframes stick-shake {
  0%,
  100% {
    transform: rotate(calc(var(--lean) - 7deg)) translateY(0);
  }
  50% {
    transform: rotate(calc(var(--lean) + 7deg)) translateY(-6px);
  }
}

.prize-enter-active {
  transition:
    opacity 420ms var(--ease),
    transform 420ms var(--ease-out-back);
}

.prize-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.94);
}

.prize-leave-active {
  transition:
    opacity 200ms var(--ease),
    transform 200ms var(--ease);
}

.prize-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .stick {
    animation: none;
  }

  .prize-enter-active,
  .prize-leave-active {
    transition: none;
  }
}
</style>
