# 问卷星 → 腾讯收集表 → 腾讯文档

从问卷星导出表格，将新数据抄到腾讯收集表，以同步到腾讯文档中。

[![Is It Worth the Time?](https://imgs.xkcd.com/comics/is_it_worth_the_time.png)](https://www.xkcd.com/1205/)
<!-- https://www.zdic.net/hans/戢 -->

## 动机

整理学生会“[快来和暖暖一起解决权益问题！](https://www.wjx.cn/vm/h07Qc3E.aspx)”，同时为填写的同学保持问卷星的外观。

- 示例问卷星：[快来和暖暖一起](https://www.wjx.cn/vm/rr3ZnVV.aspx)
- 示例腾讯收集表：[测试](https://docs.qq.com/form/page/DT1lWYmlJWkZFZUto)

<!-- 一周更新几次，每学年几十条记录 -->

## 安装

```shell
pnpm install
pnpm exec playwright install firefox
```

## 使用方法

首先创建`config.toml`，记录各种地址。

```toml
# 问卷星管理后台页面地址中“activity=”后的一串数字
wjx = "299792458"
# 腾讯收集表填写页面中“/form/page/”后的一串字母数字
qq-form = "MetersPer5ec0nd"
```

然后运行`pnpm run main`。（初次使用需要登录）

```log
✅ 上次已登录问卷星。
🧾 已从问卷星下载。
📅 上次同步到 2024-09-13T13:36:17.000Z。
🔍 发现1条新记录。
✅ 上次已登录腾讯文档。
🚀 已上传到腾讯收集表。
```

运行时，程序会缓存信息到`./cache/`：

- `state.json`：登录信息，这样初次运行后可以自动登录
- `data.xlsx`：问卷星导出的表格，可用于检查，程序本身并不需要
- `last_updated.txt`：最后更新时刻，用于判断哪些是新记录

另外，如果已经登录过，不再需要扫码，可关闭图形化界面运行，这样会更快一些：

```toml
# 加到 config.toml
headless = true
```
