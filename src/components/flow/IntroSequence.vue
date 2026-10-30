<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useFrameSequence } from '@/composables/useFrameSequence'

/**
 * 片头序列播放器
 *
 * 12 张关键帧 SVG, 每帧停 250ms, 共 3 秒。相邻帧之间做 90ms 交叉淡入,
 * 让 4fps 的关键帧读起来是连续的动画, 而不是一格一格地跳。
 *
 * 约束:
 * 1) 帧文件全部预载完再开播, 避免中途白屏
 * 2) 时间基准用 performance.now(), 不靠定时器累加, 不会因掉帧而漂移
 * 3) 尊重 prefers-reduced-motion: 直接落到最后一帧, 不做位移动画
 * 4) 收尾时自己淡出再通知父组件, 避免动画突然消失
 */
const props = withDefaults(
  defineProps<{
    /** 关键帧数量 */
    frames?: number
    /** 每帧停留时长 (毫秒) */
    holdMs?: number
    /** 相邻帧交叉淡入时长 (毫秒) */
    fadeMs?: number
    /** 收尾淡出时长 (毫秒) */
    outMs?: number
    /** 文件名前缀, 实际路径为 prefix + 两位序号 + .svg */
    prefix?: string
  }>(),
  {
    frames: 12,
    holdMs: 250,
    fadeMs: 90,
    outMs: 320,
    prefix: `${import.meta.env.BASE_URL}intro/intro-`,
  },
)

const emit = defineEmits<{ (e: 'finished'): void }>()

/** 是否正在收尾淡出 */
const fading = ref(false)

/** 收尾定时器 */
let outTimer = 0

const { index, loaded, sources, preload, start } = useFrameSequence({
  frames: props.frames,
  holdMs: props.holdMs,
  prefix: props.prefix,
  onEnd: () => {
    // 最后一帧停满, 然后淡出, 再通知上层撤掉这一层
    fading.value = true
    outTimer = window.setTimeout(() => emit('finished'), props.outMs)
  },
})

onMounted(async () => {
  await preload()

  // 降低动态效: 不播位移, 直接给最后一帧
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    index.value = props.frames - 1
    emit('finished')
    return
  }

  start()
})

onBeforeUnmount(() => {
  if (outTimer) window.clearTimeout(outTimer)
})
</script>

<template>
  <div
    class="seq"
    :class="{ 'is-loaded': loaded, 'is-fading': fading }"
    :style="{ '--seq-fade': `${fadeMs}ms`, '--seq-out': `${outMs}ms` }"
    aria-hidden="true"
  >
    <img
      v-for="(src, i) in sources"
      :key="src"
      class="seq__frame"
      :class="{ 'is-on': i === index }"
      :src="src"
      alt=""
      draggable="false"
    />
  </div>
</template>

<style scoped>
.seq {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* 与 SVG 底色一致, 帧与帧之间没有色差 */
  background: #f6f6f0;
  opacity: 0;
  transition: opacity 160ms var(--ease);
  z-index: 3;
}

.seq.is-loaded {
  opacity: 1;
}

/* 收尾: 整层淡出, 把画面交还给视频 */
.seq.is-fading {
  opacity: 0;
  transition: opacity var(--seq-out) var(--ease);
}

.seq__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--seq-fade) linear;
  will-change: opacity;
}

.seq__frame.is-on {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .seq,
  .seq__frame {
    transition: none;
  }
}
</style>
