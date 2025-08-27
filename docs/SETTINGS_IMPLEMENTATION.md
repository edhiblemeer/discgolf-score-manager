# 設定画面実装仕様書

## 概要
ディスクゴルフアプリの設定画面を実装し、ユーザーがアプリの動作をカスタマイズできるようにする。

## 設定項目

### 1. プロフィール設定
- **デフォルトプレイヤー名**: ラウンド開始時のプレイヤー1の初期名
- **ホームコース**: よく行くコース（デフォルト選択用）

### 2. アプリ設定
- **ゴーストモード**: ON/OFF（デフォルトの動作設定）
- **詳細統計記録**: 各項目のON/OFF
  - ショット種類（FH/BH）
  - パット数
  - OB記録
  - フェアウェイキープ

## データ構造

```javascript
const defaultSettings = {
  profile: {
    defaultPlayerName: 'プレイヤー1',
    homeCourse: null, // コース名
  },
  app: {
    ghostMode: true, // デフォルトON
    detailedStats: {
      shotType: true,    // FH/BH
      putts: true,       // パット数
      ob: true,          // OB記録
      fairway: true,     // FWキープ
    }
  }
};
```

## AsyncStorage キー
- `@settings`: 設定データ全体を保存

## 実装ファイル構成
1. `/src/components/Settings/SettingsScreen.js` - 設定画面UI
2. `/src/hooks/useSettings.js` - 設定管理カスタムフック
3. `/src/utils/settingsStorage.js` - AsyncStorage操作

## UI/UXデザイン
- セクション分けされた設定項目
- スイッチコンポーネントでON/OFF切り替え
- TextInputでテキスト入力
- ピッカーでコース選択
- 保存ボタンで確定

## 影響範囲
1. **PlayerSetupScreen**: デフォルトプレイヤー名の適用
2. **HomeScreen**: ホームコースの優先表示
3. **ScoreCardScreen**: 詳細統計項目の表示/非表示
4. **App.js**: ゴーストモードの自動有効化

## テスト項目
- [ ] 設定の保存と読み込み
- [ ] アプリ再起動後の設定永続化
- [ ] 各画面での設定反映
- [ ] デフォルト値の適用