// ネットワーク状態管理サービス

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { store } from '@/store';
import { setOnlineStatus } from '@/store/syncSlice';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: any;
}

class NetworkManager {
  private isOnline: boolean = true;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  // 初期化
  private async initialize() {
    // 初回の状態を取得
    const state = await NetInfo.fetch();
    this.handleConnectivityChange(state);

    // リスナーを設定
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.handleConnectivityChange(state);
    });
  }

  // 接続状態の変更処理
  private handleConnectivityChange(state: NetInfoState) {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected ?? false;

    const status: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    };

    // Reduxストアを更新
    store.dispatch(setOnlineStatus(this.isOnline));

    // リスナーに通知
    this.notifyListeners(status);

    // オンライン復帰時の処理
    if (!wasOnline && this.isOnline) {
      console.log('Network restored - triggering sync');
      this.onNetworkRestored();
    } else if (wasOnline && !this.isOnline) {
      console.log('Network lost - switching to offline mode');
      this.onNetworkLost();
    }
  }

  // ネットワーク復帰時の処理
  private async onNetworkRestored() {
    // 自動同期をトリガー
    const { syncEnabled } = store.getState().settings;
    if (syncEnabled) {
      // TODO: 同期処理を開始
      console.log('Starting automatic sync...');
    }
  }

  // ネットワーク喪失時の処理
  private onNetworkLost() {
    // オフラインモードの準備
    console.log('Preparing offline mode...');
  }

  // リスナーに通知
  private notifyListeners(status: NetworkStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  // 現在のネットワーク状態を取得
  async getCurrentStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    };
  }

  // オンラインかどうかを確認
  isOnlineNow(): boolean {
    return this.isOnline;
  }

  // リスナーを追加
  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    
    // 削除用の関数を返す
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // クリーンアップ
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

// シングルトンインスタンス
export const networkManager = new NetworkManager();