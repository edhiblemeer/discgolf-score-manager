/**
 * プレイヤーID生成ユーティリティ
 * UUID v4とプレイヤーコードの生成
 */

/**
 * UUID v4を生成
 * @returns {string} UUID v4形式の文字列
 */
export const generatePlayerId = () => {
  // React Native環境でも動作するUUID v4生成
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  
  return `${s4()}${s4()}-${s4()}-4${s4().substr(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
};

/**
 * 8文字のプレイヤーコードを生成
 * 大文字英数字の組み合わせ（読みやすさを考慮してO,0,I,1を除外）
 * @returns {string} 8文字のプレイヤーコード
 */
export const generatePlayerCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 4文字-4文字の形式で読みやすくする
  return `${code.substr(0, 4)}-${code.substr(4, 4)}`;
};

/**
 * プレイヤーコードをQRコード用にフォーマット
 * @param {string} playerCode - プレイヤーコード
 * @param {string} displayName - 表示名
 * @param {string} playerId - プレイヤーID
 * @returns {object} QRコード用のデータ
 */
export const formatForQRCode = (playerCode, displayName, playerId) => {
  return {
    type: 'player',
    version: '1.0',
    data: {
      playerId,
      playerCode,
      displayName,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * QRコードデータをパース
 * @param {string} qrData - QRコードから読み取ったデータ
 * @returns {object|null} パースされたプレイヤーデータ
 */
export const parseQRCodeData = (qrData) => {
  try {
    const parsed = JSON.parse(qrData);
    
    // バージョンチェック
    if (parsed.type !== 'player' || !parsed.version) {
      return null;
    }
    
    // 必須フィールドのチェック
    if (!parsed.data?.playerId || !parsed.data?.playerCode || !parsed.data?.displayName) {
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('QRコードのパースエラー:', error);
    return null;
  }
};

/**
 * プレイヤーコードのバリデーション
 * @param {string} code - チェックするプレイヤーコード
 * @returns {boolean} 有効なコードかどうか
 */
export const validatePlayerCode = (code) => {
  // XXXX-XXXX形式のチェック
  const pattern = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return pattern.test(code);
};