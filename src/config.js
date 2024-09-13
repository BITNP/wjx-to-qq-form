import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@std/toml'

/**
 * @returns {{wjx: string, qq_form: string, cache: { state: string, data: string, last: string } }}
 */
export function load_config() {
  const {
    cache_dir = './cache/',
    wjx,
    'qq-form': qq_form,
  } = parse(readFileSync('config.toml', 'utf-8'))

  mkdirSync(cache_dir, { recursive: true })

  return {
    wjx,
    qq_form,
    cache: {
      // 登录信息
      state: join(cache_dir, 'state.json'),
      // 问卷星导出的表格，只写不读
      data: join(cache_dir, 'data.xlsx'),
      // 最后更新时刻
      last: join(cache_dir, 'last_updated.txt'),
    },
  }
}
