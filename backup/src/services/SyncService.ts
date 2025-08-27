// データ同期サービス

import { databaseManager, storageManager } from '@/database/helpers';
import { networkManager } from './NetworkManager';
import { offlineQueue } from './OfflineQueue';
import { store } from '@/store';
import { 
  fetchUnsyncedData, 
  syncSuccess, 
  setSyncError,
  resetSyncState 
} from '@/store/syncSlice';
import { updateLastSync } from '@/store/settingsSlice';
import { Round, Score } from '@/types/models';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

class SyncService {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30秒

  constructor() {
    this.initialize();
  }

  // 初期化
  private async initialize() {
    // ネットワーク状態の監視
    networkManager.addListener(async (status) => {
      if (status.isConnected && !this.isSyncing) {
        const { syncEnabled } = store.getState().settings;
        if (syncEnabled) {
          await this.performSync();
        }
      }
    });

    // 定期同期の開始
    this.startPeriodicSync();
  }

  // 定期同期の開始
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      const { syncEnabled } = store.getState().settings;
      if (syncEnabled && networkManager.isOnlineNow() && !this.isSyncing) {
        await this.performSync();
      }
    }, this.SYNC_INTERVAL);
  }

  // 定期同期の停止
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 同期の実行
  async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['Sync already in progress'],
      };
    }

    if (!networkManager.isOnlineNow()) {
      console.log('Cannot sync - offline');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['No network connection'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      console.log('Starting sync...');

      // 未同期データの取得
      await store.dispatch(fetchUnsyncedData());
      const unsyncedRounds = await databaseManager.getUnsyncedRounds();

      console.log(`Found ${unsyncedRounds.length} unsynced rounds`);

      // 各ラウンドを同期
      for (const round of unsyncedRounds) {
        try {
          await this.syncRound(round);
          await databaseManager.markRoundAsSynced(round.id);
          result.syncedCount++;
        } catch (error) {
          console.error(`Failed to sync round ${round.id}:`, error);
          result.failedCount++;
          result.errors.push(`Round ${round.id}: ${error}`);
          result.success = false;

          // オフラインキューに追加
          await offlineQueue.addToQueue('CREATE_ROUND', round);
        }
      }

      // 成功した場合の処理
      if (result.syncedCount > 0) {
        const syncedIds = unsyncedRounds
          .slice(0, result.syncedCount)
          .map(r => r.id);
        
        store.dispatch(syncSuccess(syncedIds));
        store.dispatch(updateLastSync(new Date().toISOString()));
        await storageManager.setLastSync(new Date().toISOString());
      }

      // オフラインキューの処理
      await offlineQueue.processQueue();

      console.log(`Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);

    } catch (error) {
      console.error('Sync failed:', error);
      store.dispatch(setSyncError(error instanceof Error ? error.message : 'Sync failed'));
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
      store.dispatch(resetSyncState());
    }

    return result;
  }

  // ラウンドの同期
  private async syncRound(round: Round): Promise<void> {
    // TODO: 実際のAPIエンドポイントへの送信
    // const response = await api.syncRound(round);
    
    // シミュレーション用の遅延
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ランダムにエラーをシミュレート（10%の確率）
    if (Math.random() < 0.1) {
      throw new Error('Simulated sync error');
    }

    console.log(`Synced round ${round.id}`);
  }

  // 手動同期
  async manualSync(): Promise<SyncResult> {
    console.log('Manual sync triggered');
    return this.performSync();
  }

  // 同期状態の取得
  getSyncStatus(): {
    isSyncing: boolean;
    isOnline: boolean;
    pendingCount: number;
  } {
    const syncState = store.getState().sync;
    return {
      isSyncing: this.isSyncing,
      isOnline: networkManager.isOnlineNow(),
      pendingCount: syncState.pendingCount,
    };
  }

  // 特定のラウンドを即座に同期
  async syncRoundImmediate(roundId: string): Promise<boolean> {
    if (!networkManager.isOnlineNow()) {
      // オフラインキューに追加
      const round = await databaseManager.getRounds(1);
      if (round.length > 0) {
        await offlineQueue.addToQueue('CREATE_ROUND', round[0]);
      }
      return false;
    }

    try {
      // TODO: 実際の同期処理
      await databaseManager.markRoundAsSynced(roundId);
      return true;
    } catch (error) {
      console.error(`Failed to sync round ${roundId}:`, error);
      return false;
    }
  }

  // クリーンアップ
  cleanup() {
    this.stopPeriodicSync();
  }
}

// シングルトンインスタンス
export const syncService = new SyncService();