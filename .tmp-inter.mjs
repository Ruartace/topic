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

const st = () => page.evaluate(() => JSON.parse(localStorage.getItem('hx.survey.session.v1') || 'null'))

// 走完观前 + 观后
async function toReview() {
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
  await page.getByRole('button', { name: /看完了/ }).click()
  await page.waitForTimeout(500)
  for (let i = 0; i < 5; i++) {
    await page.locator('.opt').nth(1).click()
    await page.waitForTimeout(420)
    await page.getByRole('button', { name: /下一题|提交并看解析/ }).click()
    await page.waitForTimeout(420)
  }
}

// ===== F: 抽奖页 → 抽中 → 回解析 → 再摇一次 =====
log('===== F: 抽奖 / 再摇一次 交互 =====')
await toReview()
await page.getByRole('button', { name: /抽一份奖品/ }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /摇一支签/ }).click()
await page.waitForTimeout(1600)
const firstPrize = await page.locator('.prize__label').innerText()
log(`F 抽中: ${firstPrize}, session.prizeId=${(await st()).prizeId}`)

// 回到解析
await page.getByRole('button', { name: /回去看解析/ }).click()
await page.waitForTimeout(500)
const reviewBtn = await page.locator('.cta-wide').innerText()
log(`F 解析页按钮文案: "${reviewBtn.trim()}"`)
const wonVisible = await page.locator('.won').count()
log(`F 解析页奖品区块可见: ${wonVisible === 1}`)

// 点「再摇一次」
await page.getByRole('button', { name: /再摇一次/ }).click()
await page.waitForTimeout(600)
const lotteryState = await page.evaluate(() => ({
  eyebrow: document.querySelector('.panel__eyebrow')?.textContent?.trim(),
  prizeLabel: document.querySelector('.prize__label')?.textContent?.trim() ?? null,
  idle: document.querySelector('.idle__title')?.textContent?.trim() ?? null,
  btn: document.querySelector('.lottery__actions .btn')?.textContent?.trim(),
}))
log(`F 再摇一次后 lottery: ${JSON.stringify(lotteryState)}`)
log(`F session.prizeId=${(await st()).prizeId}`)
log('F 预期: 应能直接再抽一次 (显示"摇一支签"按钮), 而不是卡在已抽中状态')

// ===== G: 视频章节刻度 / 文字简介 =====
log('\n===== G: 视频章节刻度 + 文字简介抽屉 =====')
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').first().click()
  await page.waitForTimeout(620)
}
await page.locator('.watch__poster').click()
await page.waitForTimeout(1200)
const marks = await page.locator('.watch__mark').count()
log(`G 章节刻度数: ${marks} (期望 5, 开场 at=0 被过滤)`)
await page.locator('.watch__mark').nth(2).click()
await page.waitForTimeout(600)
log(`G 点击第 3 个刻度后 currentTime = ${await page.evaluate(() => document.querySelector('video').currentTime)}`)

await page.getByRole('button', { name: /文字简介/ }).click()
await page.waitForTimeout(500)
const notes = await page.locator('.notes').count()
log(`G 文字简介抽屉可见: ${notes === 1}`)
const jumpBtns = await page.locator('.notes__jump').count()
log(`G 抽屉内条目数: ${jumpBtns}`)
await page.locator('.notes__jump').nth(4).click()
await page.waitForTimeout(600)
log(`G 抽屉内跳转后 currentTime = ${await page.evaluate(() => document.querySelector('video').currentTime)}`)

// ===== H: 布局溢出检查 =====
log('\n===== H: 横向溢出检查 =====')
const overflow = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  bodyScrollW: document.body.scrollWidth,
}))
log(`H video stage: ${JSON.stringify(overflow)} 溢出=${overflow.scrollW > overflow.clientW}`)

await toReview()
for (const [name, sel] of [['review', '.review'], ['lottery', '.lottery']]) {
  const o = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }))
  log(`H ${name}: scrollW=${o.scrollW} clientW=${o.clientW} 溢出=${o.scrollW > o.clientW}`)
}

// 桌面宽屏
await page.setViewportSize({ width: 1440, height: 900 })
await page.waitForTimeout(400)
const o2 = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }))
log(`H desktop: scrollW=${o2.scrollW} clientW=${o2.clientW} 溢出=${o2.scrollW > o2.clientW}`)

log('\n===== ERRORS =====')
log(errors.length ? [...new Set(errors)].join('\n') : 'none')
await browser.close()
