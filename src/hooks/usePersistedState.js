import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorageと連携した永続化State管理フック
 * @param {string} key - ストレージキー
 * @param {any} defaultValue - デフォルト値
 * @param {number} debounceMs - デバウンス時間（ミリ秒）
 * @returns {[any, Function, boolean]} - [値, 更新関数, 読み込み中フラグ]
 */
export const usePersistedState = (key, defaultValue, debounceMs = 500) => {
  const [state, setState] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef(null);
  const isMounted = useRef(true);

  // 初回読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue !== null && isMounted.current) {
          const parsedValue = JSON.parse(jsonValue);
          setState(parsedValue);
        }
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [key]);

  // データ保存（デバウンス付き）
  useEffect(() => {
    if (isLoading) return; // 初回読み込み中は保存しない

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const saveData = async () => {
        try {
          const jsonValue = JSON.stringify(state);
          await AsyncStorage.setItem(key, jsonValue);
          console.log(`Saved ${key} to storage`);
        } catch (error) {
          console.error(`Failed to save ${key}:`, error);
        }
      };

      saveData();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [state, key, debounceMs, isLoading]);

  // 即座に保存する関数
  const saveImmediately = async () => {
    try {
      const jsonValue = JSON.stringify(state);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`Immediately saved ${key} to storage`);
      return true;
    } catch (error) {
      console.error(`Failed to immediately save ${key}:`, error);
      return false;
    }
  };

  return [state, setState, isLoading, saveImmediately];
};

/**
 * 複数のキーを一度に永続化するフック
 * @param {Object} keysAndDefaults - {key: defaultValue} の形式のオブジェクト
 * @returns {Object} - 各キーの状態と更新関数を含むオブジェクト
 */
export const useMultiplePersistedState = (keysAndDefaults) => {
  const [states, setStates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef({});

  // 初回読み込み
  useEffect(() => {
    const loadAllData = async () => {
      const loadedStates = {};
      
      for (const [key, defaultValue] of Object.entries(keysAndDefaults)) {
        try {
          const jsonValue = await AsyncStorage.getItem(key);
          if (jsonValue !== null) {
            loadedStates[key] = JSON.parse(jsonValue);
          } else {
            loadedStates[key] = defaultValue;
          }
        } catch (error) {
          console.error(`Failed to load ${key}:`, error);
          loadedStates[key] = defaultValue;
        }
      }
      
      setStates(loadedStates);
      setIsLoading(false);
    };

    loadAllData();
  }, []);

  // 個別のstateを更新する関数を生成
  const createSetter = (key) => {
    return (newValue) => {
      setStates(prev => ({
        ...prev,
        [key]: typeof newValue === 'function' ? newValue(prev[key]) : newValue
      }));

      // デバウンス付き保存
      if (debounceTimer.current[key]) {
        clearTimeout(debounceTimer.current[key]);
      }

      debounceTimer.current[key] = setTimeout(() => {
        const saveData = async () => {
          try {
            const valueToSave = typeof newValue === 'function' 
              ? newValue(states[key]) 
              : newValue;
            await AsyncStorage.setItem(key, JSON.stringify(valueToSave));
            console.log(`Saved ${key} to storage`);
          } catch (error) {
            console.error(`Failed to save ${key}:`, error);
          }
        };
        saveData();
      }, 500);
    };
  };

  // 全データを一度に保存
  const saveAll = async () => {
    try {
      const pairs = Object.entries(states).map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(pairs);
      console.log('Saved all states to storage');
      return true;
    } catch (error) {
      console.error('Failed to save all states:', error);
      return false;
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      Object.values(debounceTimer.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // 各キーのstateとsetterを含むオブジェクトを返す
  const result = { isLoading, saveAll };
  
  Object.keys(keysAndDefaults).forEach(key => {
    result[key] = {
      value: states[key],
      setValue: createSetter(key)
    };
  });

  return result;
};