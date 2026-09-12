// 从实际台词生成录音清单，避免手工文档与代码不同步。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {}; context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/dialogue.js'), 'utf8'), context);
let text = '# v1.4 MP3 素材清单\n\n由 `npm run assets:list` 从 `src/dialogue.js` 生成。文件名区分大小写。所有文件均为待制作槽位，未附带空壳 MP3；缺文件时完全静音。\n\n把文件按表放到项目中，重新启动源码版即可识别。打包版需要重新打包后生效。音轨不包含脚本要求的额外停顿：代码会在播放结束后执行停顿。\n\nP2 前六张卡按脚本无需配音，槽位仅供以后可选制作；第七张欢迎语留有正式录音槽位。契约只录三条短句，b.accept 全流程只播一次。\n\n';
for (const [kind, paths] of Object.entries(context.GAME_ASSETS)) {
  text += `## ${kind}\n\n| 文件路径 | 内容 / 用途 |\n| --- | --- |\n`;
  const notes = { beep: '数据逐行提示', thud: '工作选黄：远处闷响', tick: '契约确认', ready: '红键设备就绪', paper: '证书每段纸张落定', confirm: '证书签收确认声', stamp: '证书最终落印', switch: '评估系统切换人生指导系统的电流声', glitch: 'P7 留白段轻度信号不良（很轻，≤1s）', evaluation: '评估环境底噪（循环）', guidance: '温馨日常背景（循环）', certificate: '交接证书环境底噪（低音量循环）', intro: 'P2 可选静音背景视频' };
  for (const [id, file] of Object.entries(paths)) text += `| ${file.replace('../', '')} | ${context.GAME_DIALOGUE[id] || notes[id] || id} |\n`;
  text += '\n';
}
fs.writeFileSync(path.join(root, 'assets/素材清单.md'), text);
console.log('已更新 assets/素材清单.md');
