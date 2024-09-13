import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { firefox } from 'playwright'
import readXlsxFile from 'read-excel-file/node'

import { download_from_wjx, upload_to_qq_form } from './browser.js'
import { load_config } from './config.js'

const { wjx, qq_form, cache } = load_config()

const browser = await firefox.launch({ headless: false, slowMo: 50 })
const context = await browser.newContext({
  storageState: existsSync(cache.state) ? cache.state : undefined,
})

// 1. 从问卷星下载

const download = await download_from_wjx(await context.newPage(), wjx)
await context.storageState({ path: cache.state })

/** @type {(number | string)[][]} 不含序号 */
const [header, ...records] = (await readXlsxFile(await download.createReadStream())).map((row) =>
  row.slice(1),
)

// Only for back up
await download.saveAs(cache.data)

// 2. 筛选出新记录

/** @type {(number|string)[][] | undefined} */
let new_records
try {
  const last = new Date(readFileSync(cache.last, 'utf-8').trim())
  console.log(`📅 上次同步到 ${last.toISOString()}。`)

  new_records = records.filter((r) => new Date(r[1]) > last)
} catch (error) {
  new_records = records
}

// 3. 上传到腾讯收集表

if (new_records.length > 0) {
  console.log(`🔍 发现${new_records.length}条新记录。`)

  await upload_to_qq_form(await context.newPage(), qq_form, { header, records: new_records })

  // 记录最后同步时刻
  new_records.sort((a, b) => new Date(a[1]) - new Date(b[1]))
  writeFileSync(cache.last, new_records.at(-1)[1], 'utf-8')

  await context.storageState({ path: cache.state })
} else {
  console.log('😊 没有新记录。')
}

await context.close()
await browser.close()
