<script setup lang="ts">
import { onMounted } from 'vue'
import { useFrameSequence } from '@/composables/useFrameSequence'

/**
 * 竹环加载指示器
 *
 * 12 张关键帧画的是一枚进度环: 弧线从 0 走到整圈, 再倒回来,
 * 像竹叶轻轻呼吸。往返播放, 不要硬切, 否则会有跳帧的突兀感。
 *
 * 帧画布是 120x120 的正方形, 里面已经带了背景色 (#f6f6f0),
 * 所以这里用正方形容器, 不再额外加圆角或底色, 免得出现方块边。
 */
const props = withDefaults(
  defineProps<{
    /** 关键帧数量 */
    frames?: number
    /** 每帧停留时长 (毫秒) */
    holdMs?: number
    /** 文件名前缀, 实际路径为 prefix + 两位序号 + .svg */
    prefix?: string
    /** 显示尺寸 (像素) */
    size?: number
  }>(),
  {
    frames: 12,
    holdMs: 70,
    prefix: `${import.meta.env.BASE_URL}bamboo-loading/frame-`,
    size: 44,
  },
)

const { index, sources, preload, start } = useFrameSequence({
  frames: props.frames,
  holdMs: props.holdMs,
  prefix: props.prefix,
  pingPong: true,
})

onMounted(async () => {
  await preload()

  // 降低动态效: 停在第一帧, 不做往复动画
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  start()
})
</script>

<template>
  <span class="loader" :style="{ width: `${size}px`, height: `${size}px` }" role="status" aria-label="加载中">
    <img
      v-for="(src, i) in sources"
      :key="src"
      class="loader__frame"
      :class="{ 'is-on': i === index }"
      :src="src"
      alt=""
      draggable="false"
    />
  </span>
</template>

<style scoped>
.loader {
  position: relative;
  display: inline-block;
  flex: none;
  /* 帧内自带方形底色, 做成圆角块, 免得在画面上出现一个生硬的方块 */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--sh-1);
}

.loader__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}

.loader__frame.is-on {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .loader__frame {
    transition: none;
  }
}
</style>
