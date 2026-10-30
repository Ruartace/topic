import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const errors = []
const log = (...a) => console.log(...a)

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

async function toVideo() {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: '开始' }).click()
  await page.waitForTimeout(400)
  for (let i = 0; i < 5; i++) {
    await page.locator('.opt').first().click()
    await page.waitForTimeout(620)
  }
  await page.waitForSelector('.watch__poster')
}

const state = () =>
  page.evaluate(() => {
    const v = document.querySelector('video')
    const seq = document.querySelector('.seq')
    return {
      cur: v ? +v.currentTime.toFixed(2) : null,
      paused: v?.paused,
      seqPresent: !!seq,
      seqOn: document.querySelectorAll('.seq__frame.is-on').length,
      seqOpacity: seq ? getComputedStyle(seq).opacity : null,
      poster: !!document.querySelector('.watch__poster'),
      hud: !!document.querySelector('.watch__hud'),
      controls: !!document.querySelector('.watch__controls'),
      loader: !!document.querySelector('.watch__buffering'),
      imgs: [...document.querySelectorAll('.seq__frame')].map((i) => i.naturalWidth > 0),
    }
  })

log('===== 1. 进入观片页 =====')
await toVideo()
let s = await state()
log('封面可见:', s.poster, '| 片头未出现:', !s.seqPresent, '| HUD 隐藏:', !s.hud, '| 控制条隐藏:', !s.controls)

log('\n===== 2. 点封面 -> 应进入片头, 封面消失 =====')
await page.locator('.watch__poster').click()
await page.waitForTimeout(500)
s = await state()
log('片头存在:', s.seqPresent, '| 当前亮起帧数(应为1):', s.seqOn, '| 透明度:', s.seqOpacity)
log('封面已隐藏:', !s.poster, '| HUD 隐藏:', !s.hud, '| 控制条隐藏:', !s.controls)
log('视频仍在暂停:', s.paused)
log('12 帧全部加载成功:', s.imgs.every(Boolean), `(${s.imgs.filter(Boolean).length}/12)`)
await page.screenshot({ path: 'shot-intro.png' })

log('\n===== 3. 片头中途换帧 =====')
await page.waitForTimeout(700)
const mid = await state()
log('中途仍是单帧亮起:', mid.seqOn === 1)

log('\n===== 4. 片头播完 -> 视频自动起播 =====')
await page.waitForTimeout(3200)
s = await state()
log('片头已撤掉:', !s.seqPresent)
log('视频在播:', s.paused === false, '| currentTime:', s.cur)
log('HUD 出现:', s.hud, '| 控制条出现:', s.controls)

log('\n===== 5. 回看这一段: 不播片头 =====')
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(500)
await page.locator('.opt').nth(1).click()
await page.waitForTimeout(700)
await page.getByRole('button', { name: /回看这一段/ }).click()
await page.waitForTimeout(600)
s = await state()
log('回看中片头未出现:', !s.seqPresent, '| currentTime:', s.cur, '(期望 ~9)')

log('\n===== ERRORS =====')
log(errors.length ? [...new Set(errors)].join('\n') : 'none')
await browser.close()
