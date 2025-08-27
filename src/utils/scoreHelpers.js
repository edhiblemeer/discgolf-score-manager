// スコア計算のヘルパー関数

// スコア差分によるスタイル取得
export const getScoreStyle = (score, par) => {
  if (!score || !par) return null;
  
  const diff = score - par;
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'doubleBogey';
  return 'tripleBogey';
};

// 総合スコア計算
export const calculateTotalScore = (scores, holeData, playerIndex = 0) => {
  let total = 0;
  let parTotal = 0;
  let holesPlayed = 0;
  
  for (let h = 1; h <= 18; h++) {
    const score = scores[`${h}-${playerIndex}`]?.score;
    if (score) {
      total += score;
      parTotal += holeData[h]?.par || 4;
      holesPlayed++;
    }
  }
  
  return { 
    total, 
    parTotal, 
    diff: total - parTotal,
    holesPlayed 
  };
};

// OUT（1-9ホール）のスコア計算
export const calculateOutScore = (scores, holeData, playerIndex = 0) => {
  let total = 0;
  let parTotal = 0;
  let puttsTotal = 0;
  
  for (let h = 1; h <= 9; h++) {
    const scoreData = scores[`${h}-${playerIndex}`];
    if (scoreData?.score) {
      total += scoreData.score;
      parTotal += holeData[h]?.par || 4;
      puttsTotal += scoreData.putts || 0;
    }
  }
  
  return { total, parTotal, puttsTotal };
};

// IN（10-18ホール）のスコア計算
export const calculateInScore = (scores, holeData, playerIndex = 0) => {
  let total = 0;
  let parTotal = 0;
  let puttsTotal = 0;
  
  for (let h = 10; h <= 18; h++) {
    const scoreData = scores[`${h}-${playerIndex}`];
    if (scoreData?.score) {
      total += scoreData.score;
      parTotal += holeData[h]?.par || 4;
      puttsTotal += scoreData.putts || 0;
    }
  }
  
  return { total, parTotal, puttsTotal };
};

// ラウンド統計の計算
export const calculateRoundStats = (scores, holeData, playerIndex = 0) => {
  let eagles = 0;
  let birdies = 0;
  let pars = 0;
  let bogeys = 0;
  let doubleBogeys = 0;
  let others = 0;
  let totalOB = 0;
  let fairwayHits = 0;
  let fairwayAttempts = 0;
  let totalPutts = 0;
  let holesWithPutts = 0;
  
  for (let h = 1; h <= 18; h++) {
    const scoreData = scores[`${h}-${playerIndex}`];
    if (scoreData?.score) {
      const par = holeData[h]?.par || 4;
      const diff = scoreData.score - par;
      
      if (diff <= -2) eagles++;
      else if (diff === -1) birdies++;
      else if (diff === 0) pars++;
      else if (diff === 1) bogeys++;
      else if (diff === 2) doubleBogeys++;
      else others++;
      
      if (scoreData.ob) totalOB++;
      
      // ディスクゴルフでは全ホールでフェアウェイキープを集計
      fairwayAttempts++;
      if (scoreData.fairway) fairwayHits++;
      
      if (scoreData.putts) {
        totalPutts += scoreData.putts;
        holesWithPutts++;
      }
    }
  }
  
  return {
    eagles,
    birdies,
    pars,
    bogeys,
    doubleBogeys,
    others,
    totalOB,
    fairwayHits,
    fairwayAttempts,
    fairwayPercentage: fairwayAttempts > 0 ? Math.round((fairwayHits / fairwayAttempts) * 100) : 0,
    totalPutts,
    averagePutts: holesWithPutts > 0 ? (totalPutts / holesWithPutts).toFixed(1) : 0
  };
};

// 未入力ホールのチェック
export const checkMissingHoles = (scores, players) => {
  const missingHoles = [];
  
  for (let h = 1; h <= 18; h++) {
    for (let p = 0; p < players.length; p++) {
      if (!scores[`${h}-${p}`]?.score) {
        if (!missingHoles.includes(h)) {
          missingHoles.push(h);
        }
      }
    }
  }
  
  return missingHoles;
};