/**
 * Enhanced Sync Service with Firebase Integration
 * Firebase Firestore/Realtime Databaseとの同期管理
 */

import { databaseManager, storageManager } from '@/database/helpers';
import { networkManager } from './NetworkManager';
import { offlineQueue } from './OfflineQueue';
import { authService } from './authService';
import { store } from '@/store';
import { 
  fetchUnsyncedData, 
  syncSuccess, 
  setSyncError,
  resetSyncState,
  setSyncStatus,
  updateConflicts
} from '@/store/syncSlice';
import { updateLastSync } from '@/store/settingsSlice';
import { Round, Score, Player, Course } from '@/types/models';
import { firebaseFirestore, firebaseDatabase, setupNetworkListener } from '@/firebase/config';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: ConflictItem[];
  errors: string[];
}

export interface ConflictItem {
  id: string;
  type: 'round' | 'score' | 'player' | 'course';
  localData: any;
  remoteData: any;
  localTimestamp: string;
  remoteTimestamp: string;
}

export enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual',
  LOCAL_FIRST = 'local_first',
  REMOTE_FIRST = 'remote_first'
}

interface CloudRound extends Round {
  userId: string;
  syncedAt: string;
  deviceId: string;
  version: number;
}

class EnhancedSyncService {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30秒
  private realtimeListeners: (() => void)[] = [];
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.initialize();
  }

  /**
   * デバイスIDの生成（ユニーク識別用）
   */
  private generateDeviceId(): string {
    // React Native Device Info等を使用して実装する場合はここを変更
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 初期化
   */
  private async initialize() {
    // Firebase接続状態の監視
    setupNetworkListener((isConnected) => {
      if (isConnected && !this.isSyncing) {
        const { syncEnabled } = store.getState().settings;
        if (syncEnabled && authService.isAuthenticated()) {
          this.performSync();
        }
      }
    });

    // ネットワーク状態の監視（従来のものも維持）
    networkManager.addListener(async (status) => {
      if (status.isConnected && !this.isSyncing) {
        const { syncEnabled } = store.getState().settings;
        if (syncEnabled && authService.isAuthenticated()) {
          await this.performSync();
        }
      }
    });

    // 認証状態の監視
    authService.onAuthStateChanged((user) => {
      if (user) {
        this.setupRealtimeSync();
        this.startPeriodicSync();
      } else {
        this.cleanupRealtimeSync();
        this.stopPeriodicSync();
      }
    });
  }

  /**
   * リアルタイム同期のセットアップ
   */
  private setupRealtimeSync() {
    const user = authService.getCurrentUser();
    if (!user) return;

    // Roundsのリアルタイム監視
    const roundsListener = firebaseFirestore
      .collection('rounds')
      .where('userId', '==', user.uid)
      .where('deviceId', '!=', this.deviceId) // 他デバイスからの変更のみ
      .orderBy('deviceId')
      .orderBy('updatedAt', 'desc')
      .limit(10)
      .onSnapshot(
        async (snapshot) => {
          if (!snapshot.empty) {
            await this.handleRemoteChanges(snapshot);
          }
        },
        (error) => {
          console.error('Realtime sync error:', error);
        }
      );

    this.realtimeListeners.push(roundsListener);
  }

  /**
   * リモート変更の処理
   */
  private async handleRemoteChanges(
    snapshot: FirebaseFirestoreTypes.QuerySnapshot
  ) {
    const conflicts: ConflictItem[] = [];
    
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added' || change.type === 'modified') {
        const remoteData = change.doc.data() as CloudRound;
        const localData = await databaseManager.getRoundById(change.doc.id);
        
        if (localData) {
          // 競合の検出
          const conflict = await this.detectConflict(localData, remoteData);
          if (conflict) {
            conflicts.push(conflict);
          }
        } else {
          // 新規データとして保存
          await this.saveRemoteRound(remoteData);
        }
      }
    }

    if (conflicts.length > 0) {
      store.dispatch(updateConflicts(conflicts));
      // 自動解決または手動解決の処理
      await this.resolveConflicts(conflicts, ConflictStrategy.LAST_WRITE_WINS);
    }
  }

  /**
   * 競合の検出
   */
  private async detectConflict(
    localData: Round,
    remoteData: CloudRound
  ): Promise<ConflictItem | null> {
    const localTimestamp = new Date(localData.updatedAt).getTime();
    const remoteTimestamp = new Date(remoteData.updatedAt).getTime();
    
    // タイムスタンプが異なる場合は競合
    if (Math.abs(localTimestamp - remoteTimestamp) > 1000) {
      return {
        id: localData.id,
        type: 'round',
        localData,
        remoteData,
        localTimestamp: localData.updatedAt,
        remoteTimestamp: remoteData.updatedAt,
      };
    }
    
    return null;
  }

  /**
   * リモートラウンドの保存
   */
  private async saveRemoteRound(remoteRound: CloudRound): Promise<void> {
    const round: Round = {
      id: remoteRound.id,
      courseId: remoteRound.courseId,
      playerIds: remoteRound.playerIds,
      startTime: remoteRound.startTime,
      endTime: remoteRound.endTime,
      weather: remoteRound.weather,
      notes: remoteRound.notes,
      isCompleted: remoteRound.isCompleted,
      createdAt: remoteRound.createdAt,
      updatedAt: remoteRound.updatedAt,
    };
    
    await databaseManager.saveRound(round);
    // すでに同期済みとしてマーク
    await databaseManager.markRoundAsSynced(round.id);
  }

  /**
   * 競合解決
   */
  async resolveConflicts(
    conflicts: ConflictItem[],
    strategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS
  ): Promise<void> {
    for (const conflict of conflicts) {
      switch (strategy) {
        case ConflictStrategy.LAST_WRITE_WINS:
          await this.resolveLastWriteWins(conflict);
          break;
        case ConflictStrategy.MERGE:
          await this.resolveMerge(conflict);
          break;
        case ConflictStrategy.LOCAL_FIRST:
          // ローカルデータを優先（何もしない）
          break;
        case ConflictStrategy.REMOTE_FIRST:
          await this.resolveRemoteFirst(conflict);
          break;
        case ConflictStrategy.MANUAL:
          // 手動解決のためUIに通知（別途実装が必要）
          break;
      }
    }
  }

  /**
   * Last Write Wins戦略での解決
   */
  private async resolveLastWriteWins(conflict: ConflictItem): Promise<void> {
    const localTime = new Date(conflict.localTimestamp).getTime();
    const remoteTime = new Date(conflict.remoteTimestamp).getTime();
    
    if (remoteTime > localTime) {
      // リモートデータで上書き
      await this.saveRemoteRound(conflict.remoteData);
    } else {
      // ローカルデータをクラウドに送信
      await this.syncRoundToCloud(conflict.localData);
    }
  }

  /**
   * マージ戦略での解決
   */
  private async resolveMerge(conflict: ConflictItem): Promise<void> {
    // 簡単なマージロジック（より詳細な実装が必要）
    const merged = {
      ...conflict.localData,
      ...conflict.remoteData,
      updatedAt: new Date().toISOString(),
    };
    
    await databaseManager.saveRound(merged);
    await this.syncRoundToCloud(merged);
  }

  /**
   * リモート優先での解決
   */
  private async resolveRemoteFirst(conflict: ConflictItem): Promise<void> {
    await this.saveRemoteRound(conflict.remoteData);
  }

  /**
   * 定期同期の開始
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      const { syncEnabled } = store.getState().settings;
      if (syncEnabled && networkManager.isOnlineNow() && !this.isSyncing && authService.isAuthenticated()) {
        await this.performSync();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * 定期同期の停止
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 同期の実行
   */
  async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
      };
    }

    const user = authService.getCurrentUser();
    if (!user) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: ['User not authenticated'],
      };
    }

    if (!networkManager.isOnlineNow()) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: ['No network connection'],
      };
    }

    this.isSyncing = true;
    store.dispatch(setSyncStatus('syncing'));

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: [],
    };

    try {
      // 未同期データの取得
      await store.dispatch(fetchUnsyncedData());
      const unsyncedRounds = await databaseManager.getUnsyncedRounds();

      // バッチ処理の準備
      const batch = firebaseFirestore.batch();
      
      // 各ラウンドを同期
      for (const round of unsyncedRounds) {
        try {
          await this.syncRoundToCloud(round, batch);
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

      // バッチコミット
      if (result.syncedCount > 0) {
        await batch.commit();
        
        // ローカルDBの更新
        for (const round of unsyncedRounds.slice(0, result.syncedCount)) {
          await databaseManager.markRoundAsSynced(round.id);
        }
        
        const syncedIds = unsyncedRounds
          .slice(0, result.syncedCount)
          .map(r => r.id);
        
        store.dispatch(syncSuccess(syncedIds));
        store.dispatch(updateLastSync(new Date().toISOString()));
        await storageManager.setLastSync(new Date().toISOString());
      }

      // オフラインキューの処理
      await offlineQueue.processQueue();

    } catch (error) {
      console.error('Sync failed:', error);
      store.dispatch(setSyncError(error instanceof Error ? error.message : 'Sync failed'));
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
      store.dispatch(setSyncStatus('idle'));
    }

    return result;
  }

  /**
   * ラウンドをクラウドに同期
   */
  private async syncRoundToCloud(
    round: Round,
    batch?: FirebaseFirestoreTypes.WriteBatch
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const cloudRound: CloudRound = {
      ...round,
      userId: user.uid,
      syncedAt: new Date().toISOString(),
      deviceId: this.deviceId,
      version: 1,
    };

    const docRef = firebaseFirestore.collection('rounds').doc(round.id);
    
    if (batch) {
      batch.set(docRef, cloudRound, { merge: true });
    } else {
      await docRef.set(cloudRound, { merge: true });
    }

    // スコアも同期
    const scores = await databaseManager.getScoresByRoundId(round.id);
    for (const score of scores) {
      const scoreRef = firebaseFirestore
        .collection('rounds')
        .doc(round.id)
        .collection('scores')
        .doc(score.id);
      
      if (batch) {
        batch.set(scoreRef, score, { merge: true });
      } else {
        await scoreRef.set(score, { merge: true });
      }
    }
  }

  /**
   * クラウドからデータを取得
   */
  async fetchFromCloud(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      // ラウンドを取得
      const roundsSnapshot = await firebaseFirestore
        .collection('rounds')
        .where('userId', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .get();

      for (const doc of roundsSnapshot.docs) {
        const cloudRound = doc.data() as CloudRound;
        await this.saveRemoteRound(cloudRound);
        
        // スコアも取得
        const scoresSnapshot = await doc.ref.collection('scores').get();
        for (const scoreDoc of scoresSnapshot.docs) {
          const score = scoreDoc.data() as Score;
          await databaseManager.saveScore(score);
        }
      }
    } catch (error) {
      console.error('Failed to fetch from cloud:', error);
      throw error;
    }
  }

  /**
   * リアルタイム同期のクリーンアップ
   */
  private cleanupRealtimeSync() {
    this.realtimeListeners.forEach(unsubscribe => unsubscribe());
    this.realtimeListeners = [];
  }

  /**
   * 手動同期
   */
  async manualSync(): Promise<SyncResult> {
    // まずクラウドから取得
    await this.fetchFromCloud();
    // その後ローカルの変更を送信
    return this.performSync();
  }

  /**
   * 同期状態の取得
   */
  getSyncStatus(): {
    isSyncing: boolean;
    isOnline: boolean;
    isAuthenticated: boolean;
    pendingCount: number;
    conflicts: ConflictItem[];
  } {
    const syncState = store.getState().sync;
    return {
      isSyncing: this.isSyncing,
      isOnline: networkManager.isOnlineNow(),
      isAuthenticated: authService.isAuthenticated(),
      pendingCount: syncState.pendingCount,
      conflicts: syncState.conflicts || [],
    };
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.stopPeriodicSync();
    this.cleanupRealtimeSync();
  }
}

// シングルトンインスタンス
export const enhancedSyncService = new EnhancedSyncService();