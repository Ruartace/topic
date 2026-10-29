<script setup lang="ts">
/**
 * 统一线性图标集 (24x24, stroke 1.75)
 * 全部内联 SVG, 不使用 emoji, 保持跨端一致可缩放
 */
export type IconName =
  | 'heart'
  | 'pill'
  | 'leaf'
  | 'brain'
  | 'bone'
  | 'check'
  | 'close'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'flame'
  | 'trophy'
  | 'refresh'
  | 'play'
  | 'pause'
  | 'expand'
  | 'volume'
  | 'mute'
  | 'document'
  | 'gift'
  | 'film'
  | 'lightbulb'
  | 'video'
  | 'panda'
  | 'bamboo'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    /** 纯装饰性图标(旁边已有可见文字)请设为 true */
    decorative?: boolean
  }>(),
  { size: 24, decorative: false },
)
</script>

<template>
  <svg
    class="icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="props.decorative ? 'true' : undefined"
    :role="props.decorative ? undefined : 'img'"
  >
    <title v-if="!props.decorative"><slot /></title>

    <template v-if="props.name === 'heart'">
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1Z" />
      <path d="M3.5 12.5h3l1.5-3 2 5 1.8-3.5 1.2 1.5h4" />
    </template>

    <template v-else-if="props.name === 'pill'">
      <rect x="2.6" y="8.4" width="18.8" height="7.2" rx="3.6" transform="rotate(-45 12 12)" />
      <path d="M8.5 8.5 15.5 15.5" />
    </template>

    <template v-else-if="props.name === 'leaf'">
      <path d="M4 20c0-8 5-14 16-15 0 10-5.5 15-11 15-2.5 0-5-1-5-1Z" />
      <path d="M9 15c2.5-3.5 5.5-5.5 9-7" />
    </template>

    <template v-else-if="props.name === 'brain'">
      <path d="M9.5 4.5A2.5 2.5 0 0 0 7 7v.4A2.6 2.6 0 0 0 4.5 10c0 .9.4 1.7 1 2.2A2.6 2.6 0 0 0 4.6 15c.2.9.8 1.7 1.6 2.1A2.5 2.5 0 0 0 9.5 20a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2Z" />
      <path d="M14.5 4.5A2.5 2.5 0 0 1 17 7v.4A2.6 2.6 0 0 1 19.5 10c0 .9-.4 1.7-1 2.2.6.7.9 1.7.9 2.8-.2.9-.8 1.7-1.6 2.1.6.6.7 1.7.2 2.5-.4.8-1.2 1.4-2.1 1.4a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" />
    </template>

    <template v-else-if="props.name === 'bone'">
      <path d="M6.5 3.5a2.5 2.5 0 1 1 2.8 2.8l7.4 7.4a2.5 2.5 0 1 1-2.8 2.8L6.5 9.1a2.5 2.5 0 1 1 0-5.6Z" />
      <path d="M17.5 8.5a2.5 2.5 0 1 1-2.8-2.8l-1.6 1.6M6.5 14.9l1.6-1.6" />
    </template>

    <template v-else-if="props.name === 'check'">
      <path d="m4.5 12.5 5 5 10-11" />
    </template>

    <template v-else-if="props.name === 'close'">
      <path d="M6 6l12 12M18 6 6 18" />
    </template>

    <template v-else-if="props.name === 'chevron-right'">
      <path d="m9 5 7 7-7 7" />
    </template>

    <template v-else-if="props.name === 'chevron-left'">
      <path d="m15 5-7 7 7 7" />
    </template>

    <template v-else-if="props.name === 'chevron-down'">
      <path d="m5 9 7 7 7-7" />
    </template>

    <template v-else-if="props.name === 'flame'">
      <path d="M12 2.5s5.5 4.2 5.5 9.2A5.5 5.5 0 0 1 12 21.5a5.5 5.5 0 0 1-5.5-5.8c0-2.2 1.2-3.6 2.2-4.6.3 1.2 1.1 2 1.9 2 .5-3 1-4.5 1.4-6.6Z" />
    </template>

    <template v-else-if="props.name === 'trophy'">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4.5A2.5 2.5 0 0 0 7 10M17 5.5h2.5A2.5 2.5 0 0 1 17 10" />
      <path d="M12 14v3.5M8.5 21h7l-.8-3.5H9.3L8.5 21Z" />
    </template>

    <template v-else-if="props.name === 'refresh'">
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </template>

    <template v-else-if="props.name === 'play'">
      <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" stroke="none" />
    </template>

    <template v-else-if="props.name === 'pause'">
      <rect x="7" y="5" width="3.4" height="14" rx="1.4" fill="currentColor" stroke="none" />
      <rect x="13.6" y="5" width="3.4" height="14" rx="1.4" fill="currentColor" stroke="none" />
    </template>

    <template v-else-if="props.name === 'expand'">
      <path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15" />
    </template>

    <template v-else-if="props.name === 'volume'">
      <path d="M11 5.5 6.8 9H3.5v6h3.3L11 18.5V5.5Z" />
      <path d="M14.8 9.2a4 4 0 0 1 0 5.6M17.4 6.6a7.6 7.6 0 0 1 0 10.8" />
    </template>

    <template v-else-if="props.name === 'mute'">
      <path d="M11 5.5 6.8 9H3.5v6h3.3L11 18.5V5.5Z" />
      <path d="m15 9.5 5 5M20 9.5l-5 5" />
    </template>

    <template v-else-if="props.name === 'document'">
      <path d="M6.5 3.5h7L18.5 8.5v12h-12v-17Z" />
      <path d="M13.5 3.5v5h5M9.5 13h5M9.5 16.5h5" />
    </template>

    <template v-else-if="props.name === 'gift'">
      <path d="M4 11.5h16v9H4v-9Z" />
      <path d="M3 7.5h18v4H3v-4Z" />
      <path d="M12 7.5v13" />
      <path d="M12 7.5S10.6 3.5 8.4 3.5a2 2 0 0 0 0 4H12Zm0 0s1.4-4 3.6-4a2 2 0 0 1 0 4H12Z" />
    </template>

    <template v-else-if="props.name === 'lightbulb'">
      <path d="M9 17.5h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3Z" />
    </template>

    <template v-else-if="props.name === 'video'">
      <rect x="2.5" y="5.5" width="13" height="13" rx="3" />
      <path d="m15.5 10 5.5-3v10l-5.5-3" />
    </template>

    <!-- 熊猫头像: 竹纸白填充 + 墨黑描边, 扁平无渐变 -->
    <template v-else-if="props.name === 'panda'">
      <circle cx="6.4" cy="7.2" r="3" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="7.2" r="3" fill="currentColor" stroke="none" />
      <ellipse
        cx="12"
        cy="12.4"
        rx="7.8"
        ry="7.2"
        fill="#fff"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <ellipse cx="9.1" cy="11.6" rx="1.8" ry="2.2" fill="currentColor" stroke="none" />
      <ellipse cx="14.9" cy="11.6" rx="1.8" ry="2.2" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="11" r="0.8" fill="#fff" stroke="none" />
      <circle cx="15.3" cy="11" r="0.8" fill="#fff" stroke="none" />
      <path
        d="M12 13.6v1.1"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        fill="none"
      />
      <path
        d="M9.9 15.2c.6-.6 1.4-.6 2.1 0 .7.6 1.5.6 2.1 0"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        fill="none"
      />
    </template>

    <!-- 翠竹 -->
    <template v-else-if="props.name === 'bamboo'">
      <path d="M8 21V6.5" />
      <path d="M5.8 10.5h4.4M5.8 15.5h4.4M5.8 19h4.4" />
      <path d="M8 8.5C10.5 6 13 5.5 15.5 6.5 14 8.8 11.5 9.6 8 8.5Z" />
      <path d="M8 12.5c2.8-2 5.8-2.4 8.4-1.2-1.6 2.2-4.2 2.9-8.4 1.2Z" />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  display: block;
  flex: none;
}
</style>
