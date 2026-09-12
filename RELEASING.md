# RELEASING · 版本与发布约定

## 0. 唯一事实来源
- 一切改动先进 main 分支（git push）；只留在个人电脑上的改动不算数。
- node_modules/、dist/ 永不入库。

## 1. 日常两条路径
- 最新版试玩（日常）：git pull 后——Mac 双击 启动游戏.command；Windows 双击 启动游戏.bat。
- 给别人玩的成品：发 GitHub Release（见下）。

## 2. 什么时候发 Release（不是每次提交）
① 想让非开发成员玩到新包；② 攒了一批修复值得一试；③ 赛前代码冻结的正式版。

## 3. 版本号规则
- v主.次.修：修 bug→末位+1；新内容→中间+1；正式交付→v1.0.0。
- 已发布的版本号不复用、不覆盖；package.json 里的版本号与 tag 一致，只在发版时改。

## 4. 每次发版的同步清单
| # | 事项 | 要求 |
|---|------|------|
| 1 | package.json version | 与 tag 相同 |
| 2 | Tag + Release | tag＝版本号；说明含平台、打开方法（未签名提示）、SHA-256、已知限制 |
| 3 | 附件命名 | 最后一次选择-mac-arm64-vX.Y.Z.zip；最后一次选择-win-x64-vX.Y.Z.zip |
| 4 | SHA-256 | 每个附件值写进 Release 说明 |
| 5 | CHANGELOG.md | 加一条：日期／版本／≤3 行改动 |
| 6 | 群内通报 | 一句话："新测试版 vX.Y.Z 已发布" |
| 7 | README | 下载链接用 releases/latest 永链，无需随版本改 |

## 5. 打包责任
- Mac 包只能在 Mac 上打；Windows 包在 Windows 上打。
- 两个平台都从同一个 tag 构建；只发一个平台时，Release 说明中写明。

## 6. 红线
- 不 force push；不提交 dist/、node_modules/；已发布的附件不偷换（要改发新版本）。
