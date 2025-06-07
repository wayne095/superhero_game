// resize.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targets = [
  { name: 'bg1.png',       w: 640,  h: 480 },
  { name: 'bg2.png',       w: 640,  h: 480 },
  { name: 'bg3.png',       w: 640,  h: 480 },
  { name: 'hero.png',      w: 32,   h: 32  },
  { name: 'missile.png',   w: 16,   h: 16  },
  { name: 'villain.png',   w: 32,   h: 32  },
  { name: 'victory.png',   w: 400,  h: 150 },
  { name: 'game_over.png', w: 400,  h: 150 },
  { name: 'homebg.png',    w: 1280, h: 720 },   // ← 新增首頁背景
  { name: 'explosion.png', w: 50,  h: 50 },   // ← 新增爆炸特效
];

(async () => {
  for (const { name, w, h } of targets) {
    const src = path.join('public', name);
    const tmp = path.join('public', 'tmp_' + name); // 先輸出到 tmp
    if (!fs.existsSync(src)) {
      console.warn('❌  找不到檔案:', src);
      continue;
    }
    await sharp(src)
      .resize(w, h, { fit: 'fill' })       // 需要保持比例可改 fit:'inside'
      .png({ compressionLevel: 9 })
      .toFile(tmp);
    fs.renameSync(tmp, src);               // 覆蓋原檔
    console.log(`✔  ${name} → ${w}×${h}`);
  }
})();
