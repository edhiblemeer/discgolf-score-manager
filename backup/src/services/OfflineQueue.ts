// オフラインキュー管理

import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkManager } from './NetworkManager';

export interface QueueItem {
  id: string;
  type: 'CREATE_ROUND' | 'UPDATE_SCORE' | 'DELETE_ROUND' | 'UPDATE_SETTINGS';
  payload: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

const QUEUE_STORAGE_KEY = '@discgolf_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

class OfflineQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private processingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  // キューの読み込み
  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  // キューの保存
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // ネットワークリスナーの設定
  private setupNetworkListener() {
    networkManager.addListener((status) => {
      if (status.isConnected && this.queue.length > 0 && !this.isProcessing) {
        console.log('Network available - processing offline queue');
        this.processQueue();
      }
    });
  }

  // アイテムをキューに追加
  async addToQueue(
    type: QueueItem['type'],
    payload: any
  ): Promise<void> {
    const item: QueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    };

    this.queue.push(item);
    await this.saveQueue();

    console.log(`Added ${type} to offline queue`);

    // オンラインの場合は即座に処理
    if (networkManager.isOnlineNow() && !this.isProcessing) {
      this.processQueue();
    }
  }

  // キューの処理
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (!networkManager.isOnlineNow()) {
      console.log('Cannot process queue - offline');
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        
        try {
          await this.processItem(item);
          // 成功したらキューから削除
          this.queue.shift();
          await this.saveQueue();
          console.log(`Processed ${item.type} from offline queue`);
        } catch (error) {
          console.error(`Failed to process ${item.type}:`, error);
          
          // リトライ回数を増やす
          item.retryCount++;
          
          if (item.retryCount >= item.maxRetries) {
            // 最大リトライ回数に達したら削除
            console.error(`Max retries reached for ${item.type} - removing from queue`);
            this.queue.shift();
            await this.saveQueue();
            // TODO: エラー通知をユーザーに表示
          } else {
            // リトライのため後ろに移動
            this.queue.shift();
            this.queue.push(item);
            await this.saveQueue();
            
            // 少し待ってから次を処理
            await this.delay(RETRY_DELAY * item.retryCount);
          }
        }

        // オフラインになったら中断
        if (!networkManager.isOnlineNow()) {
          console.log('Network lost - pausing queue processing');
          break;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // アイテムの処理
  private async processItem(item: QueueItem): Promise<void> {
    // TODO: APIサーバーへの実際のリクエスト処理
    switch (item.type) {
      case 'CREATE_ROUND':
        // await api.createRound(item.payload);
        console.log('Processing CREATE_ROUND:', item.payload);
        break;
      
      case 'UPDATE_SCORE':
        // await api.updateScore(item.payload);
        console.log('Processing UPDATE_SCORE:', item.payload);
        break;
      
      case 'DELETE_ROUND':
        // await api.deleteRound(item.payload);
        console.log('Processing DELETE_ROUND:', item.payload);
        break;
      
      case 'UPDATE_SETTINGS':
        // await api.updateSettings(item.payload);
        console.log('Processing UPDATE_SETTINGS:', item.payload);
        break;
      
      default:
        throw new Error(`Unknown queue item type: ${(item as any).type}`);
    }
  }

  // 遅延処理
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // キューの状態を取得
  getQueueStatus(): {
    count: number;
    items: QueueItem[];
    isProcessing: boolean;
  } {
    return {
      count: this.queue.length,
      items: [...this.queue],
      isProcessing: this.isProcessing,
    };
  }

  // キューをクリア
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('Offline queue cleared');
  }

  // 特定のアイテムを削除
  async removeFromQueue(id: string): Promise<boolean> {
    const index = this.queue.findIndex(item => item.id === id);
    if (index > -1) {
      this.queue.splice(index, 1);
      await this.saveQueue();
      return true;
    }
    return false;
  }
}

// シングルトンインスタンス
export const offlineQueue = new OfflineQueue();