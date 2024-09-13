import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@std/toml'
import { firefox } from 'playwright'
import readXlsxFile from 'read-excel-file/node'

import { download_from_wjx, upload_to_qq_form } from './browser.js'

/** @type {{"wjx": string, "qq-form": string, "cache_dir"?: "string"}} */
const config = parse(readFileSync('config.toml', 'utf8'))
const cache_dir = config.cache_dir ?? './cache/'
mkdirSync(cache_dir, { recursive: true })
const state_storage = join(cache_dir, 'user.json')

const browser = await firefox.launch({ headless: false, slowMo: 50 })
const context = await browser.newContext({
  storageState: existsSync(state_storage) ? state_storage : undefined,
})

const download = await download_from_wjx(await context.newPage(), config.wjx)
await context.storageState({ path: state_storage })

const [header, ...rows] = await readXlsxFile(await download.createReadStream())

// TODO: Only upload new rows
await upload_to_qq_form(await context.newPage(), config['qq-form'], rows)
await context.storageState({ path: state_storage })

await context.close()
await browser.close()
