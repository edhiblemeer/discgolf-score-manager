import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/store';
import AppNavigator from '@/navigation/AppNavigator';
import { databaseManager } from '@/database/helpers';
import { playerService } from '@/services/playerService';
import { courseService } from '@/services/courseService';
import { networkManager } from '@/services/NetworkManager';
import { syncService } from '@/services/SyncService';
import { loadSettings } from '@/store/settingsSlice';
import { fetchRounds } from '@/store/roundsSlice';
// テスト用画面
import SimpleTestScreen from '@/screens/SimpleTestScreen';

export default function App() {
  useEffect(() => {
    // アプリ初期化
    initializeApp();

    // クリーンアップ
    return () => {
      syncService.cleanup();
      networkManager.cleanup();
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      
      // データベース初期化
      await databaseManager.initialize();
      
      // プレイヤーサービス初期化
      await playerService.initialize();
      
      // コースサービス初期化
      await courseService.initializeDefaultCourses();
      
      // 設定の読み込み
      store.dispatch(loadSettings());
      
      // 最初のラウンドデータ取得
      store.dispatch(fetchRounds(20));
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
    }
  };

  // テスト用に一時的にSimpleTestScreenを表示
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SimpleTestScreen />
    </SafeAreaProvider>
  );
  
  // 本番用コード（後で戻す）
  // return (
  //   <Provider store={store}>
  //     <SafeAreaProvider>
  //       <StatusBar style="auto" />
  //       <AppNavigator />
  //     </SafeAreaProvider>
  //   </Provider>
  // );
}