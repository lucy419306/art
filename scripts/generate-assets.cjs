// 从实际台词生成录音清单，避免手工文档与代码不同步。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {}; context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/dialogue.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/voice-cues.js'), 'utf8'), context);
let text = '# v1.6 MP3 素材清单\n\n由 `npm run assets:list` 从 `src/dialogue.js` 和 `src/voice-cues.js` 生成。配音内容与文件映射以 `voice-cues.js` 为准；屏幕文字可与配音不同。\n\n运行 `npm run voice:import` 可把项目根目录 `voice/` 中的原始录音逐字节复制到游戏素材目录，不转码、不裁切、不改变速度。缺文件时字幕照常显示并使用静默计时；打包版需要重新打包后生效。\n\nP2 前七张卡是可选配音槽位。契约页显示完整条款，但只播放提取表规定的短句；`b.accept` 全流程只播一次。\n\n';
for (const [kind, paths] of Object.entries(context.GAME_ASSETS)) {
  text += `## ${kind}\n\n| 文件路径 | 内容 / 用途 |\n| --- | --- |\n`;
  const notes = { beep: '数据逐行提示', thud: '工作选黄：远处闷响', tick: '契约确认', ready: '红键设备就绪', paper: '证书每段纸张落定', confirm: '证书签收确认声', stamp: '证书最终落印', switch: '评估系统切换人生指导系统的电流声', evaluation: '评估环境底噪（循环）', guidance: '温馨日常背景（循环）', certificate: '交接证书环境底噪（低音量循环）', intro: 'P2 可选静音背景视频' };
  for (const [id, file] of Object.entries(paths)) {
    const cue = context.GAME_VOICE_CUES?.[id];
    const content = cue?.transcript || context.GAME_DIALOGUE[id] || notes[id] || id;
    const state = cue ? (cue.required ? '必需' : '可选') : '';
    text += `| ${file.replace('../', '')} | ${content}${state ? `（${state}）` : ''} |\n`;
  }
  text += '\n';
}
fs.writeFileSync(path.join(root, 'assets/素材清单.md'), text);
console.log('已更新 assets/素材清单.md');
