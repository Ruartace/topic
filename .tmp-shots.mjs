import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const log = (...a) => console.log(...a)

const segs = [0, 4.4, 8.8, 13.2, 17.6, 22.0]
const labels = ['开场', '心率', '用药', '蔬菜', '睡眠', '骨骼']

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (await browser.newContext()).newPage()
page.on('pageerror', (e) => log('[pageerror]', e.message))

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  document.body.innerHTML = '<video id="v" src="/media/health-brief.mp4" preload="auto" style="width:360px"></video>'
})
await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2, null, { timeout: 20000 })

for (const [i, t] of segs.entries()) {
  const mid = t + 2.2
  await page.evaluate((mm) => { document.querySelector('video').currentTime = mm }, mid)
  await page.waitForTimeout(900)
  await page.locator('#v').screenshot({ path: `.shots/vseg${i}.png` })
  log(`seg${i}(${labels[i]}) t=${mid}`)
}
await browser.close()
