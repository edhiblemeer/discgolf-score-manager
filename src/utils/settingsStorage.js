import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePlayerId, generatePlayerCode } from './playerIdGenerator';

const SETTINGS_KEY = '@settings';
const FRIENDS_KEY = '@friends';

// デフォルト設定
export const defaultSettings = {
  profile: {
    playerId: null, // 初回起動時に生成
    playerCode: null, // 初回起動時に生成
    displayName: 'プレイヤー1', // defaultPlayerNameから変更
    avatar: null,
    stats: {
      totalRounds: 0,
      bestScore: null,
      averageScore: null,
      recentScores: [], // 直近20ラウンドのスコア
      hdcp: null, // 計算されたHDCP
      favoriteDisc: null,
    },
    createdAt: new Date().toISOString(),
    favoriteCourses: [],
  },
  app: {
    ghostMode: true,
    detailedStats: {
      shotType: true,
      putts: true,
      ob: true,
      fairway: true,
    }
  }
};

// 設定を読み込み
export const loadSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue != null) {
      const settings = JSON.parse(jsonValue);
      let needsSave = false;
      
      // homeCourseからfavoriteCoursesへの移行処理
      if (settings.profile?.homeCourse && !settings.profile?.favoriteCourses) {
        settings.profile.favoriteCourses = [settings.profile.homeCourse];
        delete settings.profile.homeCourse;
        needsSave = true;
      }
      
      // defaultPlayerNameからdisplayNameへの移行
      if (settings.profile?.defaultPlayerName && !settings.profile?.displayName) {
        settings.profile.displayName = settings.profile.defaultPlayerName;
        delete settings.profile.defaultPlayerName;
        needsSave = true;
      }
      
      // playerId, playerCodeの生成（初回のみ）
      if (!settings.profile?.playerId) {
        settings.profile = {
          ...settings.profile,
          playerId: generatePlayerId(),
          playerCode: generatePlayerCode(),
          createdAt: settings.profile?.createdAt || new Date().toISOString(),
          stats: settings.profile?.stats || defaultSettings.profile.stats,
        };
        needsSave = true;
      }
      
      // 変更があれば保存
      if (needsSave) {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
      
      // デフォルト値とマージ（新しい設定項目が追加された場合の対応）
      return {
        ...defaultSettings,
        ...settings,
        profile: {
          ...defaultSettings.profile,
          ...settings.profile,
          favoriteCourses: settings.profile?.favoriteCourses || [],
        },
        app: {
          ...defaultSettings.app,
          ...settings.app,
          detailedStats: {
            ...defaultSettings.app.detailedStats,
            ...settings.app?.detailedStats,
          }
        }
      };
    }
    
    // 初回起動時はIDを生成
    const initialSettings = {
      ...defaultSettings,
      profile: {
        ...defaultSettings.profile,
        playerId: generatePlayerId(),
        playerCode: generatePlayerCode(),
      }
    };
    return initialSettings;
  } catch (error) {
    console.error('設定の読み込みエラー:', error);
    return defaultSettings;
  }
};

// 設定を保存
export const saveSettings = async (settings) => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('設定の保存エラー:', error);
    return false;
  }
};

// 特定の設定値を取得
export const getSetting = async (path) => {
  try {
    const settings = await loadSettings();
    const keys = path.split('.');
    let value = settings;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        return null;
      }
    }
    
    return value;
  } catch (error) {
    console.error('設定値の取得エラー:', error);
    return null;
  }
};

// 特定の設定値を更新
export const updateSetting = async (path, value) => {
  try {
    const settings = await loadSettings();
    const keys = path.split('.');
    let current = settings;
    
    // 最後のキーの前まで辿る
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    // 最後のキーに値を設定
    current[keys[keys.length - 1]] = value;
    
    // 保存
    return await saveSettings(settings);
  } catch (error) {
    console.error('設定値の更新エラー:', error);
    return false;
  }
};

// 設定をリセット
export const resetSettings = async () => {
  try {
    await saveSettings(defaultSettings);
    return true;
  } catch (error) {
    console.error('設定のリセットエラー:', error);
    return false;
  }
};

// フレンドリストを読み込み
export const loadFriends = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FRIENDS_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (error) {
    console.error('フレンドリストの読み込みエラー:', error);
    return [];
  }
};

// フレンドリストを保存
export const saveFriends = async (friends) => {
  try {
    const jsonValue = JSON.stringify(friends);
    await AsyncStorage.setItem(FRIENDS_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('フレンドリストの保存エラー:', error);
    return false;
  }
};

// フレンドを追加
export const addFriend = async (friendData) => {
  try {
    const friends = await loadFriends();
    
    // 既に追加済みかチェック
    const exists = friends.some(f => f.playerId === friendData.playerId);
    if (exists) {
      return { success: false, message: '既に登録済みのフレンドです' };
    }
    
    // フレンドデータを作成
    const newFriend = {
      playerId: friendData.playerId,
      playerCode: friendData.playerCode,
      displayName: friendData.displayName,
      avatar: friendData.avatar || null,
      addedAt: new Date().toISOString(),
      lastPlayed: null,
      hdcp: friendData.hdcp || null, // HDCP情報
      stats: {
        roundsTogether: 0,
        wins: 0,
        losses: 0,
      }
    };
    
    // 最大3名まで
    if (friends.length >= 3) {
      return { success: false, message: 'フレンドは最大3名まで登録できます' };
    }
    
    friends.push(newFriend);
    await saveFriends(friends);
    
    return { success: true, friend: newFriend };
  } catch (error) {
    console.error('フレンド追加エラー:', error);
    return { success: false, message: 'フレンドの追加に失敗しました' };
  }
};

// フレンドを削除
export const removeFriend = async (playerId) => {
  try {
    const friends = await loadFriends();
    const filtered = friends.filter(f => f.playerId !== playerId);
    await saveFriends(filtered);
    return true;
  } catch (error) {
    console.error('フレンド削除エラー:', error);
    return false;
  }
};