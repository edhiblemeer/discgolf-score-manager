import AsyncStorage from '@react-native-async-storage/async-storage';

// ストレージキー定義
const STORAGE_KEYS = {
  CURRENT_ROUND: 'discgolf_current_round',
  ROUND_HISTORY: 'discgolf_round_history',
  PLAYER_NAMES: 'discgolf_player_names',
  APP_SETTINGS: 'discgolf_app_settings',
  COURSE_DATA: 'discgolf_course_data',
};

/**
 * 現在のラウンドデータを保存
 */
export const saveCurrentRound = async (roundData) => {
  try {
    const dataToSave = {
      scores: roundData.scores || {},
      playerNames: roundData.playerNames || ['プレイヤー1'],
      selectedCourse: roundData.selectedCourse || null,
      holeData: roundData.holeData || {},
      startHole: roundData.startHole || 1,
      currentHole: roundData.currentHole || 1,
      timestamp: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_ROUND,
      JSON.stringify(dataToSave)
    );
    console.log('ラウンドデータを保存しました');
    return true;
  } catch (error) {
    console.error('ラウンドデータの保存に失敗:', error);
    return false;
  }
};

/**
 * 現在のラウンドデータを読み込み
 */
export const loadCurrentRound = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_ROUND);
    if (jsonValue != null) {
      const data = JSON.parse(jsonValue);
      console.log('ラウンドデータを読み込みました');
      return data;
    }
    return null;
  } catch (error) {
    console.error('ラウンドデータの読み込みに失敗:', error);
    return null;
  }
};

/**
 * 現在のラウンドデータをクリア
 */
export const clearCurrentRound = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_ROUND);
    console.log('現在のラウンドデータをクリアしました');
    return true;
  } catch (error) {
    console.error('ラウンドデータのクリアに失敗:', error);
    return false;
  }
};

/**
 * 未完了のラウンドがあるか確認
 */
export const hasUnfinishedRound = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_ROUND);
    if (jsonValue != null) {
      const data = JSON.parse(jsonValue);
      // スコアが1つでも入力されているラウンドがあるか確認
      const hasScore = data.scores && Object.values(data.scores).some(s => s?.score);
      return hasScore;
    }
    return false;
  } catch (error) {
    console.error('未完了ラウンドの確認に失敗:', error);
    return false;
  }
};

/**
 * ラウンド履歴に追加
 */
export const addToHistory = async (roundData) => {
  try {
    // playerNamesから実際にプレイした人のみを抽出
    let actualPlayerNames = {};
    if (roundData.playerNames) {
      // playersの数に基づいて実際のプレイヤー名を抽出
      const playerCount = roundData.players ? roundData.players.length : 1;
      for (let i = 0; i < playerCount; i++) {
        if (roundData.playerNames[i]) {
          actualPlayerNames[i] = roundData.playerNames[i];
        }
      }
    } else {
      actualPlayerNames = { 0: 'プレイヤー1' };
    }

    // 履歴データの作成
    const historyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      courseName: roundData.selectedCourse || 'コース名なし',
      scores: roundData.scores || {},
      playerNames: actualPlayerNames,
      holeData: roundData.holeData || {},
      totalScore: calculateTotalScore(roundData.scores, roundData.holeData),
      stats: calculateStats(roundData.scores, roundData.holeData),
    };

    // 既存の履歴を取得
    const existingHistory = await loadHistory();
    const updatedHistory = [historyEntry, ...existingHistory];
    
    // 最大100件まで保存（古いものから削除）
    const limitedHistory = updatedHistory.slice(0, 100);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.ROUND_HISTORY,
      JSON.stringify(limitedHistory)
    );
    
    console.log('ラウンドを履歴に追加しました');
    return true;
  } catch (error) {
    console.error('履歴への追加に失敗:', error);
    return false;
  }
};

/**
 * ラウンド履歴を読み込み
 */
export const loadHistory = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.ROUND_HISTORY);
    if (jsonValue != null) {
      const history = JSON.parse(jsonValue);
      console.log(`${history.length}件の履歴を読み込みました`);
      return history;
    }
    return [];
  } catch (error) {
    console.error('履歴の読み込みに失敗:', error);
    return [];
  }
};

/**
 * 特定の履歴エントリを取得
 */
export const getHistoryEntry = async (id) => {
  try {
    const history = await loadHistory();
    return history.find(entry => entry.id === id) || null;
  } catch (error) {
    console.error('履歴エントリの取得に失敗:', error);
    return null;
  }
};

/**
 * 履歴をクリア
 */
export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ROUND_HISTORY);
    console.log('履歴をクリアしました');
    return true;
  } catch (error) {
    console.error('履歴のクリアに失敗:', error);
    return false;
  }
};

/**
 * 特定コースの直近ラウンドを取得（ゴースト機能用）
 */
export const getLatestRoundForCourse = async (courseName) => {
  try {
    const history = await loadHistory();
    if (!history || history.length === 0) {
      console.log(`${courseName}の履歴がありません`);
      return null;
    }
    
    // 同じコースのラウンドをフィルタリング
    const courseRounds = history.filter(round => 
      round.courseName === courseName || round.selectedCourse === courseName
    );
    
    if (courseRounds.length === 0) {
      console.log(`${courseName}のラウンド履歴が見つかりません`);
      return null;
    }
    
    // 日付順でソート（新しい順）して最初の要素を返す
    courseRounds.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`${courseName}の直近ラウンドを取得:`, courseRounds[0].date);
    return courseRounds[0];
  } catch (error) {
    console.error('直近ラウンドの取得に失敗:', error);
    return null;
  }
};

/**
 * プレイヤー名を保存
 */
export const savePlayerNames = async (playerNames) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PLAYER_NAMES,
      JSON.stringify(playerNames)
    );
    console.log('プレイヤー名を保存しました');
    return true;
  } catch (error) {
    console.error('プレイヤー名の保存に失敗:', error);
    return false;
  }
};

/**
 * プレイヤー名を読み込み
 */
export const loadPlayerNames = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_NAMES);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return ['プレイヤー1'];
  } catch (error) {
    console.error('プレイヤー名の読み込みに失敗:', error);
    return ['プレイヤー1'];
  }
};

/**
 * アプリ設定を保存
 */
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.APP_SETTINGS,
      JSON.stringify(settings)
    );
    console.log('設定を保存しました');
    return true;
  } catch (error) {
    console.error('設定の保存に失敗:', error);
    return false;
  }
};

/**
 * アプリ設定を読み込み
 */
export const loadSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return {};
  } catch (error) {
    console.error('設定の読み込みに失敗:', error);
    return {};
  }
};

/**
 * 全データをクリア
 */
export const clearAllData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('全データをクリアしました');
    return true;
  } catch (error) {
    console.error('データのクリアに失敗:', error);
    return false;
  }
};

// ヘルパー関数：総スコア計算
const calculateTotalScore = (scores, holeData) => {
  let total = 0;
  let parTotal = 0;
  
  for (let h = 1; h <= 18; h++) {
    const score = scores[`${h}-0`]?.score;
    if (score) {
      total += score;
      parTotal += holeData[h]?.par || 4;
    }
  }
  
  return {
    total,
    parTotal,
    diff: total - parTotal,
  };
};

// ヘルパー関数：統計計算
const calculateStats = (scores, holeData) => {
  let totalOB = 0;
  let fairwayHits = 0;
  let fairwayAttempts = 0;
  let totalPutts = 0;
  let holesPlayed = 0;
  
  for (let h = 1; h <= 18; h++) {
    const scoreData = scores[`${h}-0`];
    if (scoreData?.score) {
      holesPlayed++;
      
      if (scoreData.ob) totalOB++;
      
      // ディスクゴルフでは全ホールでフェアウェイキープを集計
      fairwayAttempts++;
      if (scoreData.fairway) fairwayHits++;
      
      if (scoreData.putts) {
        totalPutts += scoreData.putts;
      }
    }
  }
  
  return {
    holesPlayed,
    totalOB,
    fairwayPercentage: fairwayAttempts > 0 ? Math.round((fairwayHits / fairwayAttempts) * 100) : 0,
    totalPutts,
    averagePutts: holesPlayed > 0 ? (totalPutts / holesPlayed).toFixed(1) : 0,
  };
};

// デバッグ用：全ストレージ内容を表示
export const debugShowAllStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    
    console.log('=== AsyncStorage Contents ===');
    result.forEach(([key, value]) => {
      console.log(`${key}:`, value ? JSON.parse(value) : null);
    });
    console.log('===========================');
  } catch (error) {
    console.error('ストレージ内容の表示に失敗:', error);
  }
};