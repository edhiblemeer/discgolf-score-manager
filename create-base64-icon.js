const fs = require('fs');

// 1x1のピクセル画像（緑色）
const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mMUqt9fDwADfAGBpzCCZQAAAABJRU5ErkJggg==';

// Base64をバイナリに変換してファイルに保存
const buffer = Buffer.from(base64Icon, 'base64');

// 各種アイコンファイルを作成
fs.writeFileSync('assets/icon.png', buffer);
fs.writeFileSync('assets/favicon.png', buffer);
fs.writeFileSync('assets/splash.png', buffer);
fs.writeFileSync('assets/adaptive-icon.png', buffer);

console.log('アイコンファイルを作成しました');