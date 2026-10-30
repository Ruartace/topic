// 生成 9:16 竖屏开场 SVG 序列 intro-01 ~ intro-12
// 画布 1080x1920 / 12fps / 总时长 3s (每帧 0.25s)
// 约束: 静态元素坐标全帧不变; 仅 rect/circle/path/line; 无 filter/gradient/mask/clipPath
import fs from 'node:fs'
import path from 'node:path'

const W = 1080, H = 1920
const BG = '#f6f6f0'      // 底色
const INK = '#262b26'     // 墨色
const GREEN = '#476b50'   // 主绿
const LGREEN = '#e8f0e6'  // 浅绿
const STROKE = '#c2d6c4'  // 描边
const SW = 6              // 线宽

const OUT = path.resolve('public/intro')
fs.mkdirSync(OUT, { recursive: true })

// ---- 主细线: 坐标全帧恒定 (80,1280)-(1000,1280), 靠 dash 做"由中心向两侧展开" ----
const LINE_Y = 1280
const LINE_X1 = 80, LINE_X2 = 1000
const LINE_LEN = LINE_X2 - LINE_X1      // 920
const LINE_MID = LINE_LEN / 2           // 460
const BASE = [80, 1277]                 // 竹叶生长基点(主细线左端上沿)

// [可见 dash 长度, dashoffset(使 dash 以中点对称展开)]
const LINE_DASH = { 1: [80, -420], 2: [500, -210], 3: [920, 0] }

// ---- 竹叶: 三片依次在左端长出, 向右上方依次张开 ----
// [长度, 半宽, 张角(度, 相对水平向右上方), 元素不透明度]
const LEAVES = [
  { 4: [130, 22, 72, 0.5], 5: [143, 23, 67, 0.75], 6: [152, 24, 62, 1], 7: [156, 24, 60, 1] },
  { 5: [150, 24, 52, 0.5], 6: [163, 25, 48, 0.75], 7: [172, 26, 44, 1], 8: [176, 26, 43, 1] },
  { 6: [160, 24, 34, 0.5], 7: [172, 25, 31, 0.8], 8: [178, 26, 29, 1], 9: [180, 26, 28.5, 1] },
]

// ---- 墨色圆点: 自主细线右端升起, 48x48 -> 96x96 (底边贴合细线) ----
const DOT_CX = 952
const DOT = { 7: [1256, 24, 0.6], 8: [1246, 32, 0.8], 9: [1232, 48, 1] }

// ---- 圆点下方两条短横线, 间距 24 ----
const SHORT = [
  { x1: 902, y: 1300, x2: 1002 },
  { x1: 922, y: 1324, x2: 982 },
]
const SHORT_OP = { 10: 0.5, 11: 0.8, 12: 1 }

// ---- 整体不透明度: 逐帧升至 100%, 第 12 帧定格 ----
const GROUP_OP = [0.7, 0.75, 0.8, 0.84, 0.88, 0.91, 0.94, 0.96, 0.98, 0.99, 1, 1]

const r1 = (n) => (Math.round(n * 10) / 10).toString()

function leafGeom(len, w, deg) {
  const a = (deg * Math.PI) / 180
  const dx = Math.cos(a), dy = -Math.sin(a)
  const tip = [BASE[0] + dx * len, BASE[1] + dy * len]
  const nx = -dy, ny = dx
  const mx = BASE[0] + dx * len * 0.5, my = BASE[1] + dy * len * 0.5
  const p1 = [mx + nx * w, my + ny * w]
  const p2 = [mx - nx * w, my - ny * w]
  return {
    d: `M ${r1(BASE[0])} ${r1(BASE[1])} Q ${r1(p1[0])} ${r1(p1[1])} ${r1(tip[0])} ${r1(tip[1])} Q ${r1(p2[0])} ${r1(p2[1])} ${r1(BASE[0])} ${r1(BASE[1])} Z`,
    tip,
  }
}

const tipOf = (len, deg) => [
  BASE[0] + Math.cos(deg * Math.PI / 180) * len,
  BASE[1] - Math.sin(deg * Math.PI / 180) * len,
]

for (let i = 1; i <= 12; i++) {
  const n = String(i).padStart(2, '0')
  const L = []
  L.push(`<!-- intro-${n}.svg | 1080x1920 (9:16) | 时长 0.25s | 12fps | 第 ${i} / 12 帧 -->`)
  L.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`)
  L.push(`  <rect x="0" y="0" width="${W}" height="${H}" fill="${BG}"/>`)
  L.push(`  <g opacity="${GROUP_OP[i - 1]}">`)

  // 1. 横向主细线 (坐标恒定, dash 由中心向两侧展开)
  const dash = LINE_DASH[Math.min(i, 3)] || LINE_DASH[3]
  L.push(`    <line x1="${LINE_X1}" y1="${LINE_Y}" x2="${LINE_X2}" y2="${LINE_Y}" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round" pathLength="${LINE_LEN}" stroke-dasharray="${dash[0]} ${LINE_LEN}" stroke-dashoffset="${dash[1]}"/>`)

  // 2. 竹叶 (三片依次长出, 向右上方依次张开)
  for (const leaf of LEAVES) {
    const keys = Object.keys(leaf).map(Number)
    if (i < Math.min(...keys)) continue
    const st = leaf[i] || leaf[Math.max(...keys)]
    const g = leafGeom(st[0], st[1], st[2])
    L.push(`    <path d="${g.d}" fill="${GREEN}" stroke="${STROKE}" stroke-width="${SW}" stroke-linejoin="round" opacity="${st[3]}"/>`)
    L.push(`    <line x1="${BASE[0]}" y1="${BASE[1]}" x2="${r1(g.tip[0])}" y2="${r1(g.tip[1])}" stroke="${LGREEN}" stroke-width="${SW}" stroke-linecap="round" opacity="${st[3]}"/>`)
  }

  // 3. 墨色圆点
  if (i >= 7) {
    const d = DOT[Math.min(i, 9)] || DOT[9]
    L.push(`    <circle cx="${DOT_CX}" cy="${d[0]}" r="${d[1]}" fill="${INK}" opacity="${d[2]}"/>`)
  }

  // 4. 圆点下方两条短横线
  if (i >= 10) {
    for (const s of SHORT) {
      L.push(`    <line x1="${s.x1}" y1="${s.y}" x2="${s.x2}" y2="${s.y}" stroke="${GREEN}" stroke-width="${SW}" stroke-linecap="round" opacity="${SHORT_OP[i]}"/>`)
    }
  }

  L.push(`  </g>`)
  L.push(`</svg>`)
  fs.writeFileSync(path.join(OUT, `intro-${n}.svg`), L.join('\n') + '\n')
}

// ---- 自检 1: 相邻帧几何位移 <= 20px ----
const report = []
for (let i = 1; i < 12; i++) {
  LEAVES.forEach((leaf, k) => {
    const a = leaf[i], b = leaf[i + 1]
    if (!a || !b) return
    const ta = tipOf(a[0], a[2]), tb = tipOf(b[0], b[2])
    report.push({ frame: `${i}->${i + 1}`, el: `leaf${k + 1}`, dist: +Math.hypot(ta[0] - tb[0], ta[1] - tb[1]).toFixed(2) })
  })
  if (DOT[i] && DOT[i + 1]) {
    report.push({ frame: `${i}->${i + 1}`, el: 'dot', dist: +Math.abs(DOT[i][0] - DOT[i + 1][0]).toFixed(2) })
  }
}
const bad = report.filter((c) => c.dist > 20)
console.log('max displacement:', Math.max(...report.map((c) => c.dist)).toFixed(2) + 'px')
console.log(bad.length ? 'OVER: ' + JSON.stringify(bad) : 'OK: adjacent-frame displacement all <= 20px')

// ---- 自检 2: 静态元素坐标跨帧完全一致 ----
const files = fs.readdirSync(OUT).sort()
const grab = (name, re) => {
  const s = fs.readFileSync(path.join(OUT, name), 'utf8')
  return (s.match(re) || []).join('')
}
const geoOf = (name, idx) => {
  const s = fs.readFileSync(path.join(OUT, name), 'utf8')
  const all = [...s.matchAll(/<(line|path|circle|rect)\b[^>]*>/g)].map((m) => m[0])
  return all
}
// 主细线(第 1 个 line)只比较几何属性, 不比较 dash
const lineGeo = (name) => {
  const s = fs.readFileSync(path.join(OUT, name), 'utf8')
  const m = s.match(/<line x1="[^"]*" y1="[^"]*" x2="[^"]*" y2="[^"]*"[^>]*>/)
  return m ? m[0].replace(/pathLength="[^"]*"|stroke-dasharray="[^"]*"|stroke-dashoffset="[^"]*"/g, '') : ''
}
const ref = lineGeo(files[0])
const staticOk = files.every((f) => lineGeo(f) === ref)
console.log(staticOk ? 'OK: 主细线坐标全帧一致' : 'FAIL: 主细线坐标漂移')
console.log('files:', files.length)
