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

const download = await download_from_wjx(await context.newPage(), wjx)
await context.storageState({ path: cache.state })

/** @type {(number | string)[][]} */
const [header, ...records] = await readXlsxFile(await download.createReadStream())

// Only for back up
await download.saveAs(cache.data)

/** @type {(number|string)[][] | undefined} */
let new_records
try {
  const last = new Date(readFileSync(cache.last, 'utf-8').trim())
  console.log(`📅 上次同步到 ${last.toISOString()}。`)

  new_records = records.filter((r) => new Date(r[1]) > last)
} catch (error) {
  new_records = records
}
// 之后要找最后同步时刻，故排序
new_records.sort((a, b) => new Date(a[1]) - new Date(b[1]))

if (new_records.length > 0) {
  console.log(`🔍 发现${new_records.length}条新记录。`)

  await upload_to_qq_form(await context.newPage(), qq_form, new_records)
  writeFileSync(cache.last, new_records.at(-1)[1], 'utf-8')

  await context.storageState({ path: cache.state })
} else {
  console.log('😊 没有新记录。')
}

await context.close()
await browser.close()
