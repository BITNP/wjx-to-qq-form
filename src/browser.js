import { assertGreater, assertLessOrEqual, assertStringIncludes } from '@std/assert'
import { zip } from 'es-toolkit'

/**
 * 从问卷星下载
 * @param {import('playwright').Page} page
 * @param {string} activity_id 管理后台页面地址中“activity=”后的一串数字
 * @returns {Promise<import('playwright').Download>}
 */
export async function download_from_wjx(page, activity_id) {
  await page.goto('https://www.wjx.cn')
  await Promise.race([
    // 若未登录，请手动登录（因为有时需要滑动验证码），然后会自动转到后台
    page
      .getByRole('link', { name: '登录' })
      .click()
      .then(() => console.log('🎭 请登录问卷星，建议勾选“下次自动登录”。')),
    // 若已登录，直接转到后台
    page
      .getByRole('link', { name: '进入管理后台' })
      .click()
      .then(() => console.log('✅ 上次已登录问卷星。')),
  ])
  // 手动登录很慢，故取消超时限制
  await page.waitForURL('https://www.wjx.cn/newwjx/manage/myquestionnaires.aspx', { timeout: 0 })

  await page.goto(
    `https://www.wjx.cn/wjx/activitystat/viewstatsummary.aspx?activity=${activity_id}`,
  )
  await page.getByRole('link', { name: '查看下载答卷' }).click()
  await page.getByRole('link', { name: '下载答卷数据' }).click()
  await page.getByRole('link', { name: '按序号下载Excel' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: '立即下载到本地' }).click()
  const download = await downloadPromise
  console.log('🧾 已从问卷星下载。')
  return download
}

/**
 * 登录腾讯收集表并确保切换到“填写”页面
 * @param {import('playwright').Page} page
 */
async function log_in_to_qq_form(page) {
  await page.getByText('使用腾讯文档打开').isVisible()

  if (page.url().endsWith('#/result')) {
    // 若是登录账号创建的问卷，会自动转到“统计”，要手动转到“填写”
    await page.goto(page.url().replace(/result$/, 'fill-detail'))
  }

  const logged_in = page.url().endsWith('#/fill-detail')
  // 未登录时是 #/fill
  if (logged_in) {
    console.log('✅ 上次已登录腾讯文档。')
  } else {
    await page.getByRole('button', { name: '登录腾讯文档' }).click()
    console.log('🎭 请登录腾讯文档。')
    // 等待扫码登录
    await page.waitForURL(/\?_t=/)

    if (page.url().endsWith('#/result')) {
      // 若是登录账号创建的问卷，会自动转到“统计”，要手动转到“填写”
      await page.goto(page.url().replace(/result$/, 'fill-detail'))
    }
  }
}

/**
 * 上传到腾讯收集表
 * @param {import('playwright').Page} page
 * @param {string} form_id 填写页面中“/form/page/”后的一串字母数字
 * @param {{ header: string[], records: (number|string)[][] }} data
 */
export async function upload_to_qq_form(page, form_id, data) {
  await page.goto(`https://docs.qq.com/form/page/${form_id}`, { waitUntil: 'load' })
  await log_in_to_qq_form(page)

  for (const record of data.records) {
    await Promise.race(['再填一份', '再填写一份'].map((t) => page.getByText(t).click()))

    const forms = await page.locator('.question').all()
    for (const [label, value, form] of zip(data.header, record, forms)) {
      assertStringIncludes(await form.locator('.question-title').textContent(), label)

      // 尝试理解按各种题型填写，有任一成功即可
      await Promise.any([
        // 问答题：若只填了数字，表格可能会存成 number，故需转换
        form
          .getByRole('textbox')
          .fill(String(value)),
        // 选择题
        form
          .getByRole('radio')
          .all()
          .then(async (choices) => {
            assertGreater(value, 0)
            assertLessOrEqual(value, choices.length)
            await choices[value - 1].click()
          }),
      ])
    }

    await page.getByRole('button', { name: '提交' }).click()
    await page.getByRole('button', { name: '确认' }).click()
    console.log('🚀 已上传到腾讯收集表。')
  }
}
