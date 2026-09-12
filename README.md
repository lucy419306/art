# 最后一次选择 · v1.1

纯本地 Electron 键盘交互游戏，依据《游戏脚本v1.1.md》实现。无需联网游玩。尚未放入正式配音和视频；当前为字幕、占位时长和轻微合成提示音。

## 在 Mac 运行

直接双击 `dist/mac-arm64/最后一次选择.app` 即可运行（本机 Apple Silicon 版本，已实际验证启动与 F1 复位）。

需要运行修改后的源码时，在 Finder 双击 `启动游戏.command`。也可以打开终端：

```sh
cd /Users/zhlmacbook/Documents/ChatGPT/art
npm ci
npm start
```

本次已安装依赖，直接 `npm start` 即可。首次换电脑需要先安装 Node.js LTS，再 `npm ci`。macOS 若把 F1 当亮度键，请按 Fn + F1；F11 同理。退出按 Command + Q。显示菜单也可切换全屏。

| 操作 | 按键 |
| --- | --- |
| 左侧冷白方案 | ← 或 A |
| 右侧暖黄方案 | → 或 D |
| 第三颗白色接管按钮 | 空格或 Enter |
| 随时复位 | F1 |
| 切换全屏 | F11 |

待机的“任意按钮”指上述三颗映射按钮。契约也用这三颗确认。长按产生的重复事件被忽略。开场不能跳过，所有翻页由流程自动完成。没有鼠标交互。

## 开发者模式

```sh
npm run dev
```

Ctrl+Shift+D 开关拍跳转面板（仅 `--dev`）。点列表直达该拍；按钮 [上一拍][下一拍][静音]；Ctrl+Shift+← / → 切相邻拍。`npm start` 不带 `--dev` 时面板与开发快捷键完全关闭。

## 时间与分支

`src/config.js` 集中配置时间（毫秒），`speed` 正式保持 1。七张开场卡默认总计 59 秒，之后有欢迎语。没有音轨时按文字长度估算朗读时长；加载正式音轨后，推进等待音轨播放结束。音轨出错回退到字幕占位计时。

- 三题：可选择后 10 秒催促、15 秒自动记左。三个左才通过。
- 通过：最后确认 30 秒催促、90 秒放弃；右进 C，左或超时进 A2。
- 驳回：宣读后开启 5 秒静默窗口，只有第三键有效；接管进契约，否则 A1。
- 契约：逐条朗读后允许确认并开始 5 秒犹豫计时。询问右键返回重读当前条，已打钩保留；左键或 15 秒无应答进 A3；可重复询问。
- 三项确认后静默光点 3 秒，进入 B。爱情右选反馈后静默 3 秒。
- 结局演出完成后停留 90 秒自动回待机。F1 中止所有流程计时、音轨并复位。
- A1/A2/A3 共同结尾使用独立的人生指导系统音轨目录。原文用户编号 `xxxxx` 原样保留。

脚本未规定的朗读间隙采用 1 秒，长停顿采用 5 秒；正式配音时可微调。P9R 的“任意时刻接管”按该段静默窗口解释，即宣读完接管提示后开放白色按钮。

## 素材接口

- `assets/voice/evaluation/`：评估系统配音
- `assets/voice/guidance/`：人生指导系统配音（结局 A 换声）
- `assets/sfx/`：提示音、闷响、确认声
- `assets/video/`：视频

把文件放进对应目录，在 `src/config.js` 的 `assets` 中登记路径。相对路径从 `src/index.html` 算起，例如：

```js
assets: {
  voice: {
    'p1.detect': '../assets/voice/evaluation/p1-detect.mp3',
    'a.thanks': '../assets/voice/guidance/a-thanks.mp3'
  },
  sfx: { ding: '../assets/sfx/ding.wav' },
  video: { intro: '../assets/video/intro.mp4' }
}
```

音轨编号和台词在 `src/game.js` 的 `say(编号, 台词)` 中；完整接入索引见 `assets/素材清单.md`。开场视频目前作为静音循环背景，字幕仍按七卡流程推进；若未来整段视频自带对白，需要同步调整七卡时长。请将对白放在 voice 音轨，避免重复播放。

尚无正式素材时，声音不使用系统 TTS，避免错误音色影响体验；因此结局 A 的“换声”目前以署名和视觉切换表达，放入两套录音后才有真实音色切换。没有持续底噪。

## 文件与未来扩展

`main.cjs` 为 Electron 窗口入口；`src/game.js` 为游戏流程；`src/rules.js` 为判定及键位；`src/style.css` 为视觉；`src/config.js` 为时间与媒体配置。未来本地 JS 模块放在 `src/` 并按需引入；硬件 hotkey 层之后接入，当前未实现。

`npm test` 运行虚拟时间分支测试，覆盖 A1/A2/A3/B/C、超时、重复犹豫和复位；它不代替真实配音的演出验收。

## 打包

Mac：`npm run pack:mac`，结果在 `dist/`。此版本未签名、公证。

以后在 Windows 安装 Node.js，在同一项目目录运行：

```sh
npm ci
npm run build:win
```

NSIS 安装程序输出到 `dist/`，包含 JS、CSS 和 assets。建议在 Windows 构建 Windows 安装包；本次未验证 Windows 实机运行。分发签名需之后单独配置。

Electron 打包机制参考：[官方文档](https://www.electronjs.org/docs/latest/tutorial/application-distribution)。
