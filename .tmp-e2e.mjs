import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const errors = []
const log = (...a) => console.log(...a)

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()

page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    errors.push(`[console.${m.type()}] ${m.text()}`)
  }
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

// 从头开始
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })

log('== intro ==')
log('title:', await page.title())
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(500)

// 观前 5 题
for (let i = 0; i < 5; i++) {
  await page.waitForSelector('.opt', { timeout: 5000 })
  const n = await page.locator('.card__count').innerText()
  const opts = await page.locator('.opt').count()
  log(`pre q${i + 1} count=${n.replace(/\s/g, '')} opts=${opts}`)
  await page.locator('.opt').first().click()
  await page.waitForTimeout(700)
}

log('== stage after pre ==')
log('eyebrow:', await page.locator('.panel__eyebrow').innerText())

// 视频
await page.waitForSelector('.watch__poster', { timeout: 5000 })
await page.locator('.watch__poster').click()
await page.waitForTimeout(1500)
const vid = await page.evaluate(() => {
  const v = document.querySelector('video')
  return v ? { dur: v.duration, cur: v.currentTime, paused: v.paused, w: v.videoWidth, h: v.videoHeight } : null
})
log('video:', JSON.stringify(vid))
await page.waitForTimeout(1000)
log('hud time:', await page.locator('.watch__hud-time').innerText().catch(() => 'n/a'))
log('rail count:', await page.locator('.rail__count').innerText())

// 点"看完了，直接答题"
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(600)
log('== post stage ==')
log('eyebrow:', await page.locator('.panel__eyebrow').innerText())

// 观后 5 题
for (let i = 0; i < 5; i++) {
  await page.waitForSelector('.opt', { timeout: 5000 })
  const n = await page.locator('.card__count').innerText()
  log(`post q${i + 1} count=${n.replace(/\s/g, '')}`)
  await page.locator('.opt').nth(1).click()
  await page.waitForTimeout(500)
  const hasVerdict = await page.locator('.verdict').count()
  log('  verdict shown:', hasVerdict)
  // 第 1 题测回看
  if (i === 0) {
    await page.getByRole('button', { name: /回看这一段/ }).click()
    await page.waitForTimeout(1200)
    log('  after replay stage:', await page.locator('.panel__eyebrow').innerText())
    const v2 = await page.evaluate(() => {
      const v = document.querySelector('video')
      return v ? { cur: v.currentTime, dur: v.duration } : null
    })
    log('  video pos after replay:', JSON.stringify(v2))
    await page.getByRole('button', { name: /看完了/ }).click()
    await page.waitForTimeout(600)
    log('  back to:', await page.locator('.panel__eyebrow').innerText())
    log('  count after back:', (await page.locator('.card__count').innerText()).replace(/\s/g, ''))
  }
  await page.getByRole('button', { name: /下一题|提交并看解析/ }).click()
  await page.waitForTimeout(600)
}

log('== review ==')
log('score:', (await page.locator('.score').innerText()).replace(/\s+/g, ' '))
log('note:', await page.locator('.score__note').innerText())

// 抽奖
await page.getByRole('button', { name: /抽一份奖品|再摇一次/ }).click()
await page.waitForTimeout(600)
log('== lottery ==')
await page.getByRole('button', { name: /摇一支签/ }).click()
await page.waitForTimeout(1600)
log('prize:', await page.locator('.prize__label').innerText().catch(() => 'n/a'))

await page.screenshot({ path: 'shot-lottery.png', fullPage: true })

log('== ERRORS ==')
log(errors.length ? errors.join('\n') : 'none')

await browser.close()
