import { computed, onBeforeUnmount, ref } from 'vue'

/**
 * 关键帧序列播放器
 *
 * 把「一串编号 SVG」当成一段动画来播:
 * - sources  按 prefix + 两位序号 拼出每一帧的 URL
 * - preload  先把全部帧请求一遍, 全部有结论后才算就绪, 避免播到一半白屏
 * - start    以 performance.now() 为时间基准逐帧推进, 掉帧也不会让节奏漂移
 *
 * 用在两处:
 * - IntroSequence  开场动画, 播完回调一次
 * - BambooLoader   加载指示, 往返循环
 */
export interface FrameSequenceOptions {
  /** 关键帧数量 */
  frames: number
  /** 每帧停留时长 (毫秒) */
  holdMs: number
  /** 文件名前缀, 实际路径为 prefix + 两位序号 + .svg */
  prefix: string
  /** 往返播放: 走到头掉头再回来, 不做硬切 */
  pingPong?: boolean
  /** 非循环模式下播完的回调 */
  onEnd?: () => void
}

export function useFrameSequence(options: FrameSequenceOptions) {
  /** 当前关键帧序号 */
  const index = ref(0)
  /** 全部帧是否已就绪 */
  const loaded = ref(false)

  const sources = computed(() =>
    Array.from({ length: options.frames }, (_, i) => `${options.prefix}${String(i + 1).padStart(2, '0')}.svg`),
  )

  let raf = 0
  /** 距开播过去了多少毫秒 */
  let elapsed = 0
  /** 上一帧的时间戳 */
  let last = 0
  /** 组件是否已经卸载: 卸载后不能再启动动画 */
  let disposed = false

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  /** 把连续时间映射成帧序号 */
  function frameAt(ms: number): number {
    const lastIndex = options.frames - 1
    if (!options.pingPong) {
      // 单向: 每 holdMs 一帧, 最后一帧也停满一帧
      return Math.min(lastIndex, Math.floor(ms / options.holdMs))
    }
    // 往返: 三角波, 0 -> lastIndex -> 0, 端点各停一帧
    const span = lastIndex * options.holdMs
    const period = span * 2
    const u = (ms % period) / options.holdMs
    return Math.round(u <= lastIndex ? u : period / options.holdMs - u)
  }

  function tick(now: number) {
    if (!last) last = now
    elapsed += now - last
    last = now

    if (!options.pingPong) {
      // 单向: 每帧停满 holdMs, 最后一帧也停满一帧再收尾
      const span = options.frames * options.holdMs
      if (elapsed >= span) {
        index.value = options.frames - 1
        stop()
        options.onEnd?.()
        return
      }
    }

    index.value = frameAt(elapsed)
    raf = requestAnimationFrame(tick)
  }

  /** 预载全部帧: onload / onerror 都算这一帧「有结论」, 缺一帧也要能开播 */
  function preload() {
    return new Promise<void>((resolve) => {
      let pending = options.frames
      const settle = () => {
        pending -= 1
        if (pending <= 0) {
          loaded.value = true
          resolve()
        }
      }
      for (const src of sources.value) {
        const img = new Image()
        img.onload = settle
        img.onerror = settle
        img.src = src
      }
    })
  }

  function start() {
    if (disposed) return
    stop()
    elapsed = 0
    last = 0
    index.value = 0
    raf = requestAnimationFrame(tick)
  }

  onBeforeUnmount(() => {
    disposed = true
    stop()
  })

  return { index, loaded, sources, preload, start, stop }
}
