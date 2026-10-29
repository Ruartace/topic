<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { VIDEO, formatTime } from '@/data/journey'

/**
 * 竖屏短片播放器
 *
 * 布局要点:
 * 1) 桌面端用「手机壳」比例居中, 手机端铺满宽度, 永远保持 9:16
 * 2) 顶部一条章节刻度, 点章节直接跳转, 让用户知道片子里讲了哪几件事
 * 3) 「文字简介」抽屉: 静音或来不及看时, 有字也能把内容补齐
 * 4) 支持原生全屏; 全屏时自动切到 9:16 居中, 不会横向拉伸
 */
const emit = defineEmits<{ (e: 'finished'): void }>()

const props = withDefaults(defineProps<{ /** 起播秒数: 从「回看这一段」跳回来时用 */ startAt?: number }>(), {
  startAt: 0,
})

const videoEl = ref<HTMLVideoElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)
const showNotes = ref(false)
const ended = ref(false)
const isFullscreen = ref(false)

/** 是否还没开始播放: 此时只显示封面, HUD 与控制条全部让位 */
const idle = computed(() => !playing.value && current.value === 0 && !ended.value)

const progress = computed(() =>
  duration.value > 0 ? (current.value / duration.value) * 100 : 0,
)

/** 章节刻度位置 (百分比) */
const chapterMarks = computed(() =>
  VIDEO.chapters
    .filter((c) => c.at > 0)
    .map((c) => ({
      ...c,
      left: duration.value > 0 ? (c.at / duration.value) * 100 : 0,
    })),
)

function togglePlay() {
  const v = videoEl.value
  if (!v) return
  if (v.paused) {
    void v.play()
  } else {
    v.pause()
  }
}

function seekTo(sec: number) {
  const v = videoEl.value
  if (!v) return
  v.currentTime = sec
  if (v.paused) void v.play()
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  current.value = v.currentTime
}

function onLoaded() {
  const v = videoEl.value
  if (!v) return
  duration.value = Number.isFinite(v.duration) ? v.duration : 0
  // 从「回看这一段」跳转进来: 定位到指定秒数再播
  if (props.startAt > 0) {
    v.currentTime = Math.min(props.startAt, Math.max(0, duration.value - 0.5))
    void v.play()
  }
}

function onEnded() {
  playing.value = false
  ended.value = true
  emit('finished')
}

async function toggleFullscreen() {
  const el = stageEl.value
  if (!el) return
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen()
    }
  } catch {
    // 某些浏览器/环境不允许全屏, 静默降级为普通播放
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <section class="watch" ref="stageEl" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="watch__frame">
      <video
        ref="videoEl"
        class="watch__video"
        :src="VIDEO.src"
        :poster="VIDEO.poster"
        playsinline
        webkit-playsinline
        preload="metadata"
        @click="togglePlay"
        @play="playing = true"
        @pause="playing = false"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @ended="onEnded"
      />

      <!-- 未播放时的封面层: 独占画面, HUD 与控制条此时隐藏, 避免文字叠压 -->
      <Transition name="cover">
        <button
          v-if="idle"
          type="button"
          class="watch__poster"
          @click="togglePlay"
        >
          <span class="watch__play">
            <AppIcon name="play" :size="26" decorative />
          </span>
          <span class="watch__poster-title">{{ VIDEO.title }}</span>
          <span class="watch__poster-desc">{{ VIDEO.durationLabel }} · 竖屏短片</span>
        </button>
      </Transition>

      <!-- 结束遮罩 -->
      <Transition name="cover">
        <div v-if="ended" class="watch__done">
          <p class="watch__done-title">看完了</p>
          <p class="watch__done-desc">下面回到那五个问题</p>
        </div>
      </Transition>

      <!-- 顶部: 标题 + 章节刻度 (播放中才出现) -->
      <div v-if="!idle" class="watch__hud">
        <div class="watch__hud-row">
          <span class="watch__hud-title">{{ VIDEO.title }}</span>
          <span class="watch__hud-time">{{ formatTime(current) }} / {{ formatTime(duration) }}</span>
        </div>
        <div class="watch__bar">
          <span class="watch__bar-fill" :style="{ width: `${progress}%` }" />
          <button
            v-for="c in chapterMarks"
            :key="c.at"
            type="button"
            class="watch__mark"
            :style="{ left: `${c.left}%` }"
            :title="c.title"
            :aria-label="`跳到 ${c.title}`"
            @click="seekTo(c.at)"
          />
        </div>
      </div>

      <!-- 底部: 控制条 -->
      <div v-if="!idle" class="watch__controls">
        <button type="button" class="ctrl" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay">
          <AppIcon :name="playing ? 'pause' : 'play'" :size="18" decorative />
        </button>

        <span class="watch__spacer" />

        <button
          type="button"
          class="ctrl ctrl--wide"
          :aria-expanded="showNotes"
          @click="showNotes = !showNotes"
        >
          <AppIcon name="document" :size="17" decorative />
          文字简介
        </button>

        <button type="button" class="ctrl" aria-label="全屏" @click="toggleFullscreen">
          <AppIcon name="expand" :size="18" decorative />
        </button>
      </div>
    </div>

    <!-- 文字简介抽屉 -->
    <Transition name="drawer">
      <div v-if="showNotes" class="notes">
        <p class="notes__intro">{{ VIDEO.intro }}</p>

        <ol class="notes__list">
          <li v-for="c in VIDEO.chapters" :key="c.at" class="notes__item">
            <button type="button" class="notes__jump" @click="seekTo(c.at)">
              <span class="notes__at">{{ formatTime(c.at) }}</span>
              <span class="notes__body">
                <span class="notes__title">{{ c.title }}</span>
                <span class="notes__desc">{{ c.desc }}</span>
              </span>
            </button>
          </li>
        </ol>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.watch {
  display: grid;
  gap: var(--sp-3);
  width: 100%;
}

/* 桌面端: 手机壳比例居中 */
.watch__frame {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin-inline: auto;
  aspect-ratio: 9 / 16;
  background: #14170f;
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--sh-3);
}

.watch__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

/* 全屏: 依然保持竖屏比例, 两侧留黑, 不横向拉伸 */
.watch.is-fullscreen {
  display: grid;
  place-items: center;
  background: #000;
  gap: 0;
}

.watch.is-fullscreen .watch__frame {
  max-width: none;
  width: auto;
  height: 100%;
  max-height: 100vh;
  border-radius: 0;
  box-shadow: none;
}

.watch.is-fullscreen .notes {
  display: none;
}

/* ---------- 封面层 ---------- */
.watch__poster {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  font: inherit;
  color: #fff;
  background: linear-gradient(180deg, rgba(20, 23, 15, 0.35) 0%, rgba(20, 23, 15, 0.72) 100%);
  border: 0;
  cursor: pointer;
  text-align: center;
}

.watch__play {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  color: var(--c-primary-strong);
  background: rgba(255, 255, 255, 0.94);
  border-radius: var(--r-pill);
  padding-left: 4px;
  box-shadow: var(--sh-2);
  transition: transform var(--dur) var(--ease-out-back);
}

.watch__poster:hover .watch__play {
  transform: scale(1.06);
}

.watch__poster-title {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
}

.watch__poster-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.watch__done {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 4px;
  color: #fff;
  background: rgba(20, 23, 15, 0.62);
}

.watch__done-title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
}

.watch__done-desc {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

/* ---------- HUD ---------- */
.watch__hud {
  position: absolute;
  inset-inline: 0;
  top: 0;
  display: grid;
  gap: 6px;
  padding: var(--sp-3);
  background: linear-gradient(180deg, rgba(20, 23, 15, 0.62) 0%, rgba(20, 23, 15, 0) 100%);
}

.watch__hud-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.watch__hud-title {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.94);
}

.watch__hud-time {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.68);
}

.watch__bar {
  position: relative;
  height: 3px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.24);
  cursor: pointer;
}

.watch__bar-fill {
  position: absolute;
  inset-block: 0;
  left: 0;
  border-radius: var(--r-pill);
  background: var(--c-accent-line);
  transition: width 120ms linear;
}

.watch__mark {
  position: absolute;
  top: 50%;
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.7);
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.watch__mark:hover {
  background: #fff;
  transform: translate(-50%, -50%) scale(1.35);
}

/* ---------- 控制条 ---------- */
.watch__controls {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: linear-gradient(0deg, rgba(20, 23, 15, 0.68) 0%, rgba(20, 23, 15, 0) 100%);
}

.watch__spacer {
  flex: 1;
}

.ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.14);
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition: background-color var(--dur) var(--ease);
}

.ctrl:hover {
  background: rgba(255, 255, 255, 0.26);
}

.ctrl--wide {
  padding-inline: 10px;
}

/* ---------- 文字简介 ---------- */
.notes {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-1);
}

.notes__intro {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--c-ink-2);
}

.notes__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1px;
}

.notes__item {
  border-top: 1px solid var(--c-divider);
}

.notes__item:last-child {
  border-bottom: 1px solid var(--c-divider);
}

.notes__jump {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-3) 0;
  font: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: padding-left var(--dur) var(--ease);
}

.notes__jump:hover {
  padding-left: 6px;
}

.notes__at {
  flex: none;
  font-family: var(--font-serif);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--c-primary);
}

.notes__body {
  display: grid;
  gap: 1px;
}

.notes__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-ink);
}

.notes__desc {
  font-size: 12.5px;
  color: var(--c-ink-3);
}

/* ---------- 动效 ---------- */
.cover-enter-active,
.cover-leave-active {
  transition: opacity var(--dur-slow) var(--ease);
}

.cover-enter-from,
.cover-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity var(--dur-slow) var(--ease),
    transform var(--dur-slow) var(--ease);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .cover-enter-active,
  .cover-leave-active,
  .drawer-enter-active,
  .drawer-leave-active {
    transition: none;
  }
}
</style>
