<script setup lang="ts">
/**
 * 熊猫吉祥物 · 熊猫健康科普
 *
 * 纯矢量, 扁平无渐变: 墨黑耳廓与眼罩 + 竹纸白面部 + 一点腮红。
 * 竹叶在右下角轻微摇动, 作为品牌记忆点。
 */
const props = withDefaults(defineProps<{ size?: number }>(), { size: 132 })
</script>

<template>
  <svg
    class="panda"
    :width="props.size"
    :height="props.size * 1.08"
    viewBox="0 0 120 130"
    fill="none"
    aria-hidden="true"
  >
    <!-- 竹叶 (右下角装饰, 呼吸式摇动) -->
    <g class="panda__leaf">
      <path d="M92 104c6-14 18-22 30-24 0 14-8 26-20 30-4 1-8 0-10-6Z" fill="#b3c9b6" />
      <path d="M96 108c8-8 16-13 24-16" stroke="#8aa78f" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- 耳朵 -->
    <circle cx="27" cy="26" r="15" fill="#2a2f2b" />
    <circle cx="93" cy="26" r="15" fill="#2a2f2b" />
    <circle cx="27" cy="26" r="7" fill="#3f463f" />
    <circle cx="93" cy="26" r="7" fill="#3f463f" />

    <!-- 面部 -->
    <ellipse cx="60" cy="62" rx="44" ry="42" fill="#ffffff" />
    <ellipse cx="60" cy="62" rx="44" ry="42" stroke="#2a2f2b" stroke-width="2" />

    <!-- 眼罩 -->
    <ellipse cx="41" cy="56" rx="12" ry="14" fill="#2a2f2b" transform="rotate(-12 41 56)" />
    <ellipse cx="79" cy="56" rx="12" ry="14" fill="#2a2f2b" transform="rotate(12 79 56)" />

    <!-- 眼神 -->
    <circle cx="42.5" cy="54" r="4" fill="#ffffff" />
    <circle cx="77.5" cy="54" r="4" fill="#ffffff" />
    <circle cx="44" cy="55.4" r="2.1" fill="#2a2f2b" />
    <circle cx="76" cy="55.4" r="2.1" fill="#2a2f2b" />

    <!-- 腮红 -->
    <ellipse cx="27" cy="74" rx="8" ry="5" fill="#e8c9c2" opacity="0.55" />
    <ellipse cx="93" cy="74" rx="8" ry="5" fill="#e8c9c2" opacity="0.55" />

    <!-- 鼻与嘴 -->
    <path
      d="M60 72c-4 0-7 2.6-7 5 0 2.6 3 4 7 4s7-1.4 7-4c0-2.4-3-5-7-5Z"
      fill="#2a2f2b"
    />
    <path
      d="M60 81v3.5M60 84.5c-1.6 3.4-5.6 3.4-7.6.6M60 84.5c1.6 3.4 5.6 3.4 7.6.6"
      stroke="#2a2f2b"
      stroke-width="2.2"
      stroke-linecap="round"
    />

    <!-- 身体 -->
    <path d="M34 100c0-9 11-16 26-16s26 7 26 16v6H34v-6Z" fill="#2a2f2b" />
    <path d="M46 100c2-6 7-9 14-9s12 3 14 9H46Z" fill="#ffffff" />
  </svg>
</template>

<style scoped>
.panda {
  display: block;
  overflow: visible;
}

/* 竹叶缓慢摇动, 幅度极小, 只在余光里被感知 */
.panda__leaf {
  transform-origin: 96px 106px;
  animation: leaf-sway 6.5s ease-in-out infinite;
}

@keyframes leaf-sway {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(4deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .panda__leaf {
    animation: none;
  }
}
</style>
