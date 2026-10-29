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

async function fresh() {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
}

async function toVideo() {
  await fresh()
  await page.getByRole('button', { name: '开始' }).click()
  await page.waitForTimeout(400)
  for (let i = 0; i < 5; i++) {
    await page.locator('.opt').first().click()
    await page.waitForTimeout(620)
  }
  await page.waitForSelector('.watch__poster')
}

async function toPost() {
  await toVideo()
  await page.getByRole('button', { name: /看完了/ }).click()
  await page.waitForTimeout(500)
}

const vstate = () =>
  page.evaluate(() => {
    const v = document.querySelector('video')
    return {
      cur: v ? +v.currentTime.toFixed(2) : null,
      paused: v?.paused,
      ended: v?.ended,
      done: !!document.querySelector('.watch__done'),
      poster: !!document.querySelector('.watch__poster'),
      hud: !!document.querySelector('.watch__hud'),
      controls: !!document.querySelector('.watch__controls'),
    }
  })

// ===== J: 暂停在 0 秒 =====
log('===== J: 暂停在 0 秒 =====')
await toVideo()
await page.locator('.watch__poster').click()
await page.waitForTimeout(800)
await page.getByRole('button', { name: /文字简介/ }).click()
await page.waitForTimeout(400)
await page.locator('.notes__jump').first().click()
await page.waitForTimeout(600)
await page.evaluate(() => document.querySelector('video').pause())
await page.waitForTimeout(700)
const j = await vstate()
log('J 暂停在 0 秒:', JSON.stringify(j))
log(`J 封面重新盖住视频: ${j.poster} | HUD 隐藏: ${!j.hud} | 控制条隐藏: ${!j.controls}`)
await page.screenshot({ path: 'shot-J-paused-zero.png' })

// ===== K: 回看返回后判定是否仍可见 =====
log('\n===== K: 回看返回后判定 =====')
await toPost()
await page.locator('.opt').nth(1).click()
await page.waitForTimeout(700)
log('K 回看前判定可见:', (await page.locator('.verdict').count()) === 1)
await page.getByRole('button', { name: /回看这一段/ }).click()
await page.waitForTimeout(1300)
log('K 回看中:', (await page.locator('.panel__eyebrow').innerText()).trim())
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(800)
const kc = await page.locator('.verdict').count()
log(`K 回来后判定可见: ${kc === 1} (count=${kc})`)
log('K 题号:', (await page.locator('.card__count').innerText()).replace(/\s/g, ''))

// ===== L: 第 3 题回看后停靠 =====
log('\n===== L: 第 3 题回看后停靠 =====')
await toPost()
await page.locator('.opt').nth(2).click()
await page.waitForTimeout(650)
await page.getByRole('button', { name: /下一题/ }).click()
await page.waitForTimeout(650)
await page.locator('.opt').nth(2).click()
await page.waitForTimeout(650)
await page.getByRole('button', { name: /回看这一段/ }).click()
await page.waitForTimeout(1300)
await page.getByRole('button', { name: /看完了/ }).click()
await page.waitForTimeout(800)
log('L 回来后题号:', (await page.locator('.card__count').innerText()).replace(/\s/g, ''), '(期望 03/05)')

// ===== M: 回看中视频自然播完, 是否自动回到原题 =====
log('\n===== M: 回看中自然播完 =====')
await toPost()
await page.locator('.opt').nth(1).click()
await page.waitForTimeout(650)
await page.getByRole('button', { name: /回看这一段/ }).click()
await page.waitForTimeout(800)
await page.evaluate(() => { document.querySelector('video').currentTime = 25.6 })
await page.waitForTimeout(3000)
log('M 播完后当前阶段:', (await page.locator('.panel__eyebrow').innerText()).trim())
log('M 期望: 回到"再答一次 · 这次判对错"')

// ===== N: 观前连点同一选项 (快速双击) =====
log('\n===== N: 观前快速双击 =====')
await fresh()
await page.getByRole('button', { name: '开始' }).click()
await page.waitForTimeout(400)
await page.locator('.opt').nth(2).dblclick()
await page.waitForTimeout(900)
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('hx.survey.session.v1')))
log('N pre 记录:', JSON.stringify(st.pre), '期望只有 q1 一条')

// ===== O: 观后快速双击同一选项 =====
log('\n===== O: 观后快速双击 =====')
await toPost()
await page.locator('.opt').nth(2).dblclick()
await page.waitForTimeout(800)
const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('hx.survey.session.v1')))
log('O post 记录:', JSON.stringify(st2.post), '期望 q1 只有一条且只记一个选项')

log('\n===== ERRORS =====')
log(errors.length ? [...new Set(errors)].join('\n') : 'none')
await browser.close()
