<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import PandaMark from '@/components/flow/PandaMark.vue'

/**
 * 入场 · 熊猫邀约
 *
 * 目标只有一个: 让用户愿意点下去。
 * 做法: 分层镜头式入场 (竹叶 → 熊猫 → 标题 → 按钮)，
 * 标题用衬线体拉开气质，按钮用实心墨色压住画面。
 * 文案不喊口号, 只说清楚「会发生什么」。
 */
const emit = defineEmits<{ (e: 'start'): void }>()

const steps = [
  { no: '01', title: '先答一遍', desc: '五个健康常识，凭第一直觉' },
  { no: '02', title: '看段短片', desc: '竖屏 27 秒，答案都在里面' },
  { no: '03', title: '再答一遍', desc: '看看刚才哪几条没记住' },
]
</script>

<template>
  <section class="intro" aria-labelledby="intro-title">
    <!-- 背景竹叶: 极慢漂移, 只在余光里被感知 -->
    <span class="leaf leaf--a" aria-hidden="true" />
    <span class="leaf leaf--b" aria-hidden="true" />
    <span class="leaf leaf--c" aria-hidden="true" />

    <div class="intro__inner">
      <header class="intro__head">
        <p class="intro__eyebrow">
          <AppIcon name="bamboo" :size="15" decorative />
          熊猫健康科普 · 心脑血管专题
        </p>
      </header>

      <div class="intro__mascot" aria-hidden="true">
        <PandaMark :size="150" />
      </div>

      <h1 id="intro-title" class="intro__title">
        <span class="intro__line"><span>五个问题，</span></span>
        <span class="intro__line"><span>看片前看片后</span></span>
        <span class="intro__line"><span class="intro__accent">各答一次</span></span>
      </h1>

      <p class="intro__desc">
        先凭直觉选一遍，看完 27 秒短片再回来选一次。两次的差别，就是你真正记住的部分。
      </p>

      <ol class="steps">
        <li v-for="(s, i) in steps" :key="s.no" class="steps__item" :style="{ '--i': String(i) }">
          <span class="steps__no">{{ s.no }}</span>
          <span class="steps__body">
            <span class="steps__title">{{ s.title }}</span>
            <span class="steps__desc">{{ s.desc }}</span>
          </span>
        </li>
      </ol>

      <button type="button" class="cta" @click="emit('start')">
        <span class="cta__label">开始</span>
        <AppIcon name="chevron-right" :size="20" decorative />
      </button>

      <p class="intro__note">全程约两分钟 · 进度存在本机，中途离开也能接着答</p>
    </div>
  </section>
</template>

<style scoped>
.intro {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-7) var(--gutter) calc(var(--sp-7) + env(safe-area-inset-bottom));
  overflow: hidden;
  background:
    radial-gradient(120% 80% at 15% 0%, #fdfdf8 0%, rgba(253, 253, 248, 0) 60%),
    linear-gradient(168deg, var(--c-bg) 0%, var(--c-bg-2) 100%);
}

/* ---------- 背景竹叶 ---------- */
.leaf {
  position: absolute;
  border-radius: 62% 38% 58% 42% / 54% 46% 54% 46%;
  pointer-events: none;
  will-change: transform;
}

.leaf--a {
  top: -60px;
  right: -70px;
  width: 210px;
  height: 210px;
  background: var(--c-primary-soft);
  border: 1px solid var(--c-primary-line);
  opacity: 0.6;
  animation: drift-a 19s ease-in-out infinite;
}

.leaf--b {
  bottom: -90px;
  left: -80px;
  width: 250px;
  height: 250px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  opacity: 0.85;
  animation: drift-b 23s ease-in-out infinite;
}

.leaf--c {
  top: 38%;
  left: -50px;
  width: 120px;
  height: 120px;
  background: var(--c-tint-2);
  opacity: 0.5;
  animation: drift-c 16s ease-in-out infinite;
}

/* ---------- 内容 ---------- */
.intro__inner {
  position: relative;
  width: 100%;
  max-width: 460px;
  display: grid;
  justify-items: start;
  gap: var(--sp-4);
}

.intro__head {
  animation: fade-down 700ms var(--ease) both;
}

.intro__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 5px 12px 5px 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--c-primary-strong);
  background: var(--c-surface);
  border: 1px solid var(--c-primary-line);
  border-radius: var(--r-pill);
}

.intro__mascot {
  animation: float-in 900ms var(--ease-out-quint) both;
  animation-delay: 120ms;
  margin-top: var(--sp-2);
}

/* 标题: 逐行上浮, 制造「一句话被念出来」的节奏 */
.intro__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(30px, 8.4vw, 40px);
  font-weight: 700;
  line-height: 1.42;
  letter-spacing: 0.01em;
  color: var(--c-ink);
}

.intro__line {
  display: block;
  overflow: hidden;
}

.intro__line > span {
  display: block;
  animation: line-up 820ms var(--ease-out-quint) both;
}

.intro__line:nth-child(1) > span {
  animation-delay: 260ms;
}
.intro__line:nth-child(2) > span {
  animation-delay: 360ms;
}
.intro__line:nth-child(3) > span {
  animation-delay: 460ms;
}

.intro__accent {
  color: var(--c-primary);
}

.intro__desc {
  margin: 0;
  max-width: 30ch;
  font-size: 14px;
  line-height: 1.85;
  color: var(--c-ink-2);
  animation: fade-up 700ms var(--ease) both;
  animation-delay: 600ms;
}

/* ---------- 三步 ---------- */
.steps {
  width: 100%;
  margin: var(--sp-2) 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 2px;
}

.steps__item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) 0;
  border-top: 1px solid var(--c-divider);
  animation: fade-up 640ms var(--ease) both;
  animation-delay: calc(700ms + var(--i) * 110ms);
}

.steps__item:last-child {
  border-bottom: 1px solid var(--c-divider);
}

.steps__no {
  flex: none;
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--c-primary);
}

.steps__body {
  display: grid;
  gap: 1px;
}

.steps__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-ink);
}

.steps__desc {
  font-size: 12.5px;
  color: var(--c-ink-3);
}

/* ---------- CTA ---------- */
.cta {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
  padding: 0 var(--sp-6);
  min-height: 54px;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  background: var(--c-ink);
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition:
    transform var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
  animation: fade-up 640ms var(--ease) both;
  animation-delay: 1040ms;
}

.cta:hover {
  background: var(--c-primary-strong);
  transform: translateY(-2px);
}

.cta:active {
  transform: translateY(0) scale(0.985);
}

.cta__label {
  transform: translateY(1px);
}

.intro__note {
  margin: 0;
  font-size: 12px;
  color: var(--c-ink-3);
  animation: fade-up 640ms var(--ease) both;
  animation-delay: 1140ms;
}

/* ---------- 动效 ---------- */
@keyframes line-up {
  from {
    transform: translateY(105%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes drift-a {
  0%,
  100% {
    transform: rotate(-16deg) translate(0, 0);
  }
  50% {
    transform: rotate(-8deg) translate(-14px, 18px);
  }
}

@keyframes drift-b {
  0%,
  100% {
    transform: rotate(22deg) translate(0, 0);
  }
  50% {
    transform: rotate(14deg) translate(18px, -16px);
  }
}

@keyframes drift-c {
  0%,
  100% {
    transform: rotate(-10deg) translate(0, 0);
  }
  50% {
    transform: rotate(6deg) translate(12px, -10px);
  }
}

@media (min-width: 768px) {
  .intro__inner {
    max-width: 520px;
  }

  .intro__title {
    font-size: 46px;
  }

  .intro__desc {
    max-width: 36ch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro__head,
  .intro__mascot,
  .intro__line > span,
  .intro__desc,
  .steps__item,
  .cta,
  .intro__note,
  .leaf {
    animation: none;
  }
}
</style>
