/**
 * バリデーション関連のユーティリティ関数
 */

/**
 * プレイヤー名のバリデーション
 */
export const validatePlayerName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'プレイヤー名を入力してください' };
  }
  if (name.length > 20) {
    return { isValid: false, error: 'プレイヤー名は20文字以内で入力してください' };
  }
  return { isValid: true, error: null };
};

/**
 * スコアのバリデーション
 */
export const validateScore = (score, min = 1, max = 15) => {
  if (score === null || score === undefined) {
    return { isValid: false, error: 'スコアを入力してください' };
  }
  if (score < min || score > max) {
    return { isValid: false, error: `スコアは${min}〜${max}の範囲で入力してください` };
  }
  return { isValid: true, error: null };
};

/**
 * パット数のバリデーション
 */
export const validatePutts = (putts) => {
  if (putts === null || putts === undefined) {
    return { isValid: true, error: null }; // パット数は任意
  }
  if (putts < 0 || putts > 10) {
    return { isValid: false, error: 'パット数は0〜10の範囲で入力してください' };
  }
  return { isValid: true, error: null };
};

/**
 * ホール番号のバリデーション
 */
export const validateHoleNumber = (hole, max = 18) => {
  if (hole < 1 || hole > max) {
    return { isValid: false, error: `ホール番号は1〜${max}の範囲で入力してください` };
  }
  return { isValid: true, error: null };
};

/**
 * PAR値のバリデーション
 */
export const validatePar = (par) => {
  if (par < 3 || par > 5) {
    return { isValid: false, error: 'PARは3〜5の範囲で入力してください' };
  }
  return { isValid: true, error: null };
};

/**
 * 距離のバリデーション
 */
export const validateDistance = (distance) => {
  if (distance < 50 || distance > 600) {
    return { isValid: false, error: '距離は50〜600ヤードの範囲で入力してください' };
  }
  return { isValid: true, error: null };
};

/**
 * プレイヤー数のバリデーション
 */
export const validatePlayerCount = (count, min = 1, max = 4) => {
  if (count < min || count > max) {
    return { isValid: false, error: `プレイヤー数は${min}〜${max}人の範囲で設定してください` };
  }
  return { isValid: true, error: null };
};

/**
 * スタートホールのバリデーション
 */
export const validateStartHole = (startHole) => {
  if (startHole !== 1 && startHole !== 10) {
    return { isValid: false, error: 'スタートホールは1番または10番を選択してください' };
  }
  return { isValid: true, error: null };
};