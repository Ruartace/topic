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

const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('hx.survey.session.v1') || 'null'))

async function snapshot(tag) {
  const st = await state()
  const eyebrow = await page.locator('.panel__eyebrow').innerText().catch(() => '-')
  const count = await page.locator('.card__count').innerText().catch(() => '-')
  log(
    `${tag} :: eyebrow="${eyebrow.replace(/\s+/g, ' ')}" count=${count.replace(/\s/g, '')} | pre=${JSON.stringify(st?.pre)} post=${JSON.stringify(st?.post)} preDone=${st?.preDone} postDone=${st?.postDone} submitted=${st?.submitted} prize=${st?.prizeId}`,
  )
}

// ---- 场景 A: 观前答 3 题后刷新 ----
log('===== A: 观前答 3 题后刷新 =====')
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
for (let i = 0; i < 3; i++) {
  await page.locator('.opt').first().click()
  await page.waitForTimeout(650)
}
await snapshot('A before refresh')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await snapshot('A after refresh')
log('A expected: 应回到第 4 题 (04/05)')

// ---- 场景 B: 观后答 2 题后刷新 ----
log('\n===== B: 观后答 2 题后刷新 =====')
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').first().click()
  await page.waitForTimeout(650)
}
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(500)
for (let i = 0; i < 2; i++) {
  await page.locator('.opt').nth(1).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /下一题/ }).click()
  await page.waitForTimeout(500)
}
await snapshot('B before refresh')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await snapshot('B after refresh')
const bVerdict = await page.locator('.verdict').count()
log(`B after refresh verdict count = ${bVerdict} (期望 1)`)
log('B expected: 应回到第 2 题 (02/05) 且判定可见')

// ---- 场景 C: 观后回看中刷新 ----
log('\n===== C: 观后回看中刷新 =====')
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').first().click()
  await page.waitForTimeout(650)
}
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(500)
await page.locator('.opt').nth(1).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /回看这一段/ }).click()
await page.waitForTimeout(1000)
await snapshot('C during replay')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await snapshot('C after refresh')
log('C expected: 应回到观后第 1 题 (01/05)')

// ---- 场景 D: 抽奖后刷新 ----
log('\n===== D: 抽奖后刷新 =====')
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').first().click()
  await page.waitForTimeout(650)
}
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(500)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').nth(1).click()
  await page.waitForTimeout(450)
  await page.getByRole('button', { name: /下一题|提交并看解析/ }).click()
  await page.waitForTimeout(450)
}
await snapshot('D at review')
await page.getByRole('button', { name: /抽一份奖品/ }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /摇一支签/ }).click()
await page.waitForTimeout(1600)
await snapshot('D after draw')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await snapshot('D after refresh')
const dPrize = await page.locator('.prize__label').innerText().catch(() => 'n/a')
log(`D after refresh prize label = ${dPrize}`)

// ---- 场景 E: 解析页刷新 ----
log('\n===== E: 解析页刷新 =====')
await page.evaluate(() => localStorage.clear())
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').first().click()
  await page.waitForTimeout(650)
}
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(500)
for (let i = 0; i < 5; i++) {
  await page.locator('.opt').nth(1).click()
  await page.waitForTimeout(450)
  await page.getByRole('button', { name: /下一题|提交并看解析/ }).click()
  await page.waitForTimeout(450)
}
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await snapshot('E after refresh')
log('E expected: 解析页, score 可见')
const eScore = await page.locator('.score').innerText().catch(() => 'n/a')
log(`E score = ${eScore.replace(/\s+/g, ' ')}`)

log('\n===== ERRORS =====')
log(errors.length ? [...new Set(errors)].join('\n') : 'none')
await browser.close()
