// スコア計算関連のユーティリティ関数

/**
 * 指定されたホール範囲の合計スコアを計算
 */
export const calculateTotalScore = (scores, playerIndex, startHole, endHole) => {
  let total = 0;
  for (let i = startHole; i <= endHole; i++) {
    const score = scores[`${i}-${playerIndex}`]?.score;
    if (score) total += score;
  }
  return total;
};

/**
 * 指定されたホール範囲のPAR合計を計算
 */
export const calculateTotalPar = (holeData, startHole, endHole) => {
  let total = 0;
  for (let i = startHole; i <= endHole; i++) {
    const par = holeData[i]?.par || 4;
    total += par;
  }
  return total;
};

/**
 * 指定されたホール範囲のパット数合計を計算
 */
export const calculateTotalPutts = (scores, playerIndex, startHole, endHole) => {
  let total = 0;
  for (let i = startHole; i <= endHole; i++) {
    const putts = scores[`${i}-${playerIndex}`]?.putts;
    if (putts) total += putts;
  }
  return total;
};

/**
 * 指定されたホール範囲のOB数を計算
 */
export const calculateTotalOBs = (scores, playerIndex, startHole, endHole) => {
  let total = 0;
  for (let i = startHole; i <= endHole; i++) {
    if (scores[`${i}-${playerIndex}`]?.ob) total++;
  }
  return total;
};

/**
 * 指定されたホール範囲のフェアウェイキープ数を計算
 */
export const calculateFairwayKeeps = (scores, playerIndex, startHole, endHole) => {
  let total = 0;
  for (let i = startHole; i <= endHole; i++) {
    if (scores[`${i}-${playerIndex}`]?.fairway) total++;
  }
  return total;
};

/**
 * スコアに基づいて色を返す
 */
export const getScoreColor = (score, par) => {
  if (!score || !par) return '#000';
  
  const diff = score - par;
  if (diff <= -2) return '#ff6b6b'; // イーグル以下
  if (diff === -1) return '#4ecdc4'; // バーディー
  if (diff === 0) return '#95e77e'; // パー
  if (diff === 1) return '#ffd93d'; // ボギー
  if (diff === 2) return '#ffaa00'; // ダブルボギー
  return '#ff6b6b'; // トリプルボギー以上
};

/**
 * スコアの表示名を取得
 */
export const getScoreName = (score, par) => {
  if (!score || !par) return '';
  
  const diff = score - par;
  if (diff <= -2) return 'イーグル';
  if (diff === -1) return 'バーディー';
  if (diff === 0) return 'パー';
  if (diff === 1) return 'ボギー';
  if (diff === 2) return 'ダブルボギー';
  if (diff === 3) return 'トリプルボギー';
  return `+${diff}`;
};

/**
 * 全プレイヤーの全ホールのスコアが入力されているかチェック
 */
export const checkAllScoresEntered = (scores, players, totalHoles = 18) => {
  for (let hole = 1; hole <= totalHoles; hole++) {
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      if (!scores[`${hole}-${playerIndex}`]?.score) {
        return false;
      }
    }
  }
  return true;
};

/**
 * 記入漏れのホールを取得
 */
export const getMissingHoles = (scores, players, totalHoles = 18) => {
  const missingHoles = [];
  for (let hole = 1; hole <= totalHoles; hole++) {
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      if (!scores[`${hole}-${playerIndex}`]?.score) {
        if (!missingHoles.includes(hole)) {
          missingHoles.push(hole);
        }
      }
    }
  }
  return missingHoles;
};