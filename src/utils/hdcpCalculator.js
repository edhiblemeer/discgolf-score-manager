/**
 * HDCP（ハンディキャップ）計算ユーティリティ
 * 直近20ラウンドの平均スコアとパーの差を基準に計算
 */

/**
 * HDCPを計算
 * @param {Array} recentScores - 直近のスコア配列 [{score: 60, par: 54, course: "コース名", date: "2025-01-22"}, ...]
 * @returns {number|null} 計算されたHDCP（小数点第1位まで）
 */
export const calculateHDCP = (recentScores) => {
  if (!recentScores || recentScores.length === 0) {
    return null;
  }

  // 最大20ラウンドまで使用
  const scoresToUse = recentScores.slice(0, 20);
  
  // 各ラウンドのパーからの差を計算
  const diffs = scoresToUse.map(round => {
    if (!round.score || !round.par) return null;
    // スコアとパーが正常な値かチェック
    if (round.score < 18 || round.score > 200 || round.par < 18 || round.par > 100) {
      console.warn('異常なスコアデータ:', round);
      return null;
    }
    return round.score - round.par;
  }).filter(diff => diff !== null);

  if (diffs.length === 0) {
    return null;
  }

  // 5ラウンド未満の場合は計算中として扱う
  if (diffs.length < 5) {
    return null; // getHDCPDisplayで処理
  }

  // 平均を計算（小数点第1位まで）
  const average = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
  const hdcp = Math.round(average * 10) / 10;
  
  // NaNチェックと異常値チェック
  if (isNaN(hdcp) || hdcp < -30 || hdcp > 50) {
    console.warn('異常なHDCP値:', hdcp, 'diffs:', diffs);
    return null;
  }
  
  console.log('HDCP計算結果:', {
    rounds: diffs.length,
    diffs,
    average,
    hdcp
  });
  
  return hdcp;
};

/**
 * 2人のプレイヤー間の推奨ハンディキャップを計算
 * @param {number} hdcp1 - プレイヤー1のHDCP
 * @param {number} hdcp2 - プレイヤー2のHDCP
 * @returns {object} 推奨ハンディキャップ情報
 */
export const getRecommendedHandicap = (hdcp1, hdcp2) => {
  if (hdcp1 === null || hdcp2 === null) {
    return {
      hasHandicap: false,
      message: 'HDCPデータが不足しています'
    };
  }

  const diff = Math.abs(hdcp1 - hdcp2);
  const roundedDiff = Math.round(diff);

  if (roundedDiff === 0) {
    return {
      hasHandicap: false,
      message: 'ハンディなし（実力が拮抗）'
    };
  }

  const higherHDCP = hdcp1 > hdcp2 ? 1 : 2;
  const lowerHDCP = hdcp1 > hdcp2 ? 2 : 1;

  return {
    hasHandicap: true,
    strokes: roundedDiff,
    giveToPlayer: higherHDCP,
    message: `プレイヤー${higherHDCP}に${roundedDiff}打のハンディ`,
    detail: `HDCP差: ${diff.toFixed(1)}打`
  };
};

/**
 * HDCPレベルを取得（初心者、中級者、上級者など）
 * @param {number} hdcp - HDCP値
 * @returns {object} レベル情報
 */
export const getHDCPLevel = (hdcp) => {
  if (hdcp === null) {
    return {
      level: '未計算',
      color: '#999',
      description: 'ラウンドデータが不足'
    };
  }

  if (hdcp <= 0) {
    return {
      level: 'プロ級',
      color: '#FFD700', // ゴールド
      description: 'パー以下でプレイ'
    };
  } else if (hdcp <= 3) {
    return {
      level: '上級者',
      color: '#4CAF50', // グリーン
      description: '安定したスコア'
    };
  } else if (hdcp <= 6) {
    return {
      level: '中級者',
      color: '#2196F3', // ブルー
      description: '着実に上達中'
    };
  } else if (hdcp <= 10) {
    return {
      level: '初級者',
      color: '#FF9800', // オレンジ
      description: '基礎を習得中'
    };
  } else {
    return {
      level: '初心者',
      color: '#9C27B0', // パープル
      description: '楽しみながら練習'
    };
  }
};

/**
 * 直近のスコアリストを更新（最大20件保持）
 * @param {Array} currentScores - 現在のスコアリスト
 * @param {object} newScore - 新しいスコア
 * @returns {Array} 更新されたスコアリスト
 */
export const updateRecentScores = (currentScores = [], newScore) => {
  const updatedScores = [newScore, ...currentScores];
  return updatedScores.slice(0, 20); // 最大20件
};

/**
 * HDCPの推移を計算（グラフ表示用）
 * @param {Array} recentScores - スコア配列
 * @returns {Array} HDCPの推移データ
 */
export const calculateHDCPTrend = (recentScores) => {
  if (!recentScores || recentScores.length === 0) {
    return [];
  }

  const trend = [];
  
  // 各ポイントでのHDCPを計算
  for (let i = Math.min(5, recentScores.length); i <= recentScores.length; i++) {
    const scores = recentScores.slice(0, i);
    const hdcp = calculateHDCP(scores);
    
    if (hdcp !== null && !isNaN(hdcp)) {
      trend.push({
        rounds: i,
        hdcp: hdcp,
        date: scores[scores.length - 1].date
      });
    }
  }

  return trend;
};

/**
 * HDCP表示用文字列を取得
 * @param {number|null} hdcp - HDCP値
 * @param {Array} recentScores - 直近のスコア配列
 * @returns {string} 表示用文字列
 */
export const getHDCPDisplay = (hdcp, recentScores = []) => {
  // HDCPが計算済みの場合
  if (hdcp !== null && hdcp !== undefined && !isNaN(hdcp)) {
    return hdcp > 0 ? `+${hdcp}` : `${hdcp}`;
  }
  
  // データがない場合
  if (!recentScores || recentScores.length === 0) {
    return '−';
  }
  
  // 有効なスコアをカウント
  const validScores = recentScores.filter(round => 
    round && round.score && round.par && !isNaN(round.score) && !isNaN(round.par)
  );
  
  // 1-4ラウンドの場合は計算中
  if (validScores.length > 0 && validScores.length < 5) {
    const remaining = 5 - validScores.length;
    return `計算中(残${remaining})`;
  }
  
  // その他の場合
  return '−';
};

/**
 * HDCPレベル選択用の推定値
 * @param {string} level - 'beginner' | 'intermediate' | 'advanced'
 * @returns {number} 推定HDCP値
 */
export const getEstimatedHDCP = (level) => {
  switch(level) {
    case 'beginner':
      return 10; // 初心者: +10前後
    case 'intermediate':
      return 5;  // 中級者: +5前後
    case 'advanced':
      return 0;  // 上級者: 0前後
    default:
      return 5;
  }
};