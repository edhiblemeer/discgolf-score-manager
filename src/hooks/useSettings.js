import { useState, useEffect, useCallback } from 'react';
import { 
  loadSettings, 
  saveSettings, 
  getSetting, 
  updateSetting,
  resetSettings,
  defaultSettings 
} from '../utils/settingsStorage';

/**
 * 設定管理用カスタムフック
 */
export const useSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 設定を読み込み
  const loadSettingsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回読み込み
  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  // 設定全体を保存
  const save = useCallback(async (newSettings) => {
    try {
      const success = await saveSettings(newSettings);
      if (success) {
        setSettings(newSettings);
      }
      return success;
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      return false;
    }
  }, []);

  // 特定の設定を更新
  const update = useCallback(async (path, value) => {
    try {
      const success = await updateSetting(path, value);
      if (success) {
        await loadSettingsData();
      }
      return success;
    } catch (error) {
      console.error('設定の更新に失敗:', error);
      return false;
    }
  }, [loadSettingsData]);

  // 特定の設定値を取得
  const get = useCallback(async (path) => {
    try {
      return await getSetting(path);
    } catch (error) {
      console.error('設定値の取得に失敗:', error);
      return null;
    }
  }, []);

  // 設定をリセット
  const reset = useCallback(async () => {
    try {
      const success = await resetSettings();
      if (success) {
        setSettings(defaultSettings);
      }
      return success;
    } catch (error) {
      console.error('設定のリセットに失敗:', error);
      return false;
    }
  }, []);

  // 個別の設定値を取得するヘルパー関数
  const getDefaultPlayerName = () => settings.profile.defaultPlayerName;
  const getFavoriteCourses = () => settings.profile.favoriteCourses || [];
  const isGhostModeEnabled = () => settings.app.ghostMode;
  const getDetailedStatsSettings = () => settings.app.detailedStats;
  const isStatEnabled = (statName) => settings.app.detailedStats[statName] ?? true;
  
  // お気に入りコース管理
  const isFavorite = (courseName) => {
    const favorites = settings.profile.favoriteCourses || [];
    return favorites.includes(courseName);
  };
  
  const toggleFavorite = useCallback(async (courseName) => {
    const currentFavorites = settings.profile.favoriteCourses || [];
    let newFavorites;
    
    if (currentFavorites.includes(courseName)) {
      // お気に入りから削除
      newFavorites = currentFavorites.filter(name => name !== courseName);
    } else {
      // お気に入りに追加
      newFavorites = [...currentFavorites, courseName];
    }
    
    const newSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        favoriteCourses: newFavorites
      }
    };
    
    const success = await save(newSettings);
    if (success) {
      setSettings(newSettings);
    }
    return success;
  }, [settings, save]);

  return {
    settings,
    isLoading,
    loadSettings: loadSettingsData,
    saveSettings: save,
    updateSetting: update,
    getSetting: get,
    resetSettings: reset,
    // ヘルパー関数
    getDefaultPlayerName,
    getFavoriteCourses,
    isGhostModeEnabled,
    getDetailedStatsSettings,
    isStatEnabled,
    // お気に入り管理
    isFavorite,
    toggleFavorite,
  };
};