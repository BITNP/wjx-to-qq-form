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
      .then(() => console.log('✅ 已登录问卷星。')),
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
  return download
}
/**
 * 上传到腾讯收集表
 * @param {import('playwright').Page} page
 * @param {string} form_id 填写页面中“/form/page/”后的一串字母数字
 * @param {Array} new_rows
 */
export async function upload_to_qq_form(page, form_id, new_rows) {
  await page.goto(`https://docs.qq.com/form/page/${form_id}`, { waitUntil: 'load' })
  await page.getByText('使用腾讯文档打开').isVisible()

  const logged_in = page.url().endsWith('#/fill-detail')
  // 未登录时是 #/fill
  if (logged_in) {
    console.log('✅ 已登录腾讯文档。')
  } else {
    await page.getByRole('button', { name: '登录腾讯文档' }).click()
    console.log('🎭 请登录腾讯文档。')
    await page.waitForURL(/\?_t=/) // 等待扫码登录
  }

  await page.getByText('再填一份').click()

  // TODO: fill rows
  await page.getByText('1A').click()
  await page.getByText('2A').click()
  await page.getByPlaceholder('请输入').fill(JSON.stringify(new_rows))

  await page.getByRole('button', { name: '提交' }).click()
  await page.getByRole('button', { name: '确认' }).click()
}
