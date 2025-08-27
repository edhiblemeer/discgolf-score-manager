/**
 * Firebase Configuration
 * Firebase SDKの初期化と設定
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';

// Firebase設定（環境変数から取得するか、直接設定）
// 注意: 本番環境では環境変数を使用すること
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'disc-golf-app.firebaseapp.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://disc-golf-app.firebaseio.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'disc-golf-app',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'disc-golf-app.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Firebase services exports
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseDatabase = database();

// Firestore設定
firebaseFirestore.settings({
  persistence: true, // オフラインデータ永続化
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED, // キャッシュサイズ無制限
});

// エミュレーター設定（開発環境用）
if (__DEV__) {
  // Firestoreエミュレーター
  // firebaseFirestore.useEmulator('localhost', 8080);
  
  // Authエミュレーター
  // firebaseAuth.useEmulator('http://localhost:9099');
  
  // Realtime Databaseエミュレーター
  // firebaseDatabase.useEmulator('localhost', 9000);
}

/**
 * Firebase初期化状態の確認
 */
export const isFirebaseInitialized = (): boolean => {
  try {
    return !!(firebaseAuth && firebaseFirestore && firebaseDatabase);
  } catch (error) {
    console.error('Firebase initialization check failed:', error);
    return false;
  }
};

/**
 * ネットワーク接続状態の監視
 */
export const setupNetworkListener = (callback: (isConnected: boolean) => void) => {
  const connectedRef = firebaseDatabase.ref('.info/connected');
  
  const unsubscribe = connectedRef.on('value', (snapshot) => {
    const connected = snapshot.val() === true;
    callback(connected);
  });

  return () => connectedRef.off('value', unsubscribe);
};

// デフォルトエクスポート
export default {
  auth: firebaseAuth,
  firestore: firebaseFirestore,
  database: firebaseDatabase,
  config: firebaseConfig,
};