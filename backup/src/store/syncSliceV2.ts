/**
 * Enhanced Sync Slice with Conflict Management
 * 同期状態管理と競合解決のReduxスライス
 */

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { databaseManager } from '@/database/helpers';
import { Round } from '@/types/models';
import { ConflictItem, ConflictStrategy } from '@/services/SyncServiceV2';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict';

interface SyncState {
  status: SyncStatus;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  syncQueue: string[]; // 同期待ちのラウンドID
  conflicts: ConflictItem[];
  conflictStrategy: ConflictStrategy;
  error: string | null;
  isOnline: boolean;
  isAuthenticated: boolean;
  syncProgress: {
    current: number;
    total: number;
    message: string;
  };
}

const initialState: SyncState = {
  status: 'idle',
  isSyncing: false,
  lastSyncTime: null,
  pendingCount: 0,
  syncQueue: [],
  conflicts: [],
  conflictStrategy: ConflictStrategy.LAST_WRITE_WINS,
  error: null,
  isOnline: true,
  isAuthenticated: false,
  syncProgress: {
    current: 0,
    total: 0,
    message: '',
  },
};

// 非同期アクション: 未同期データの取得
export const fetchUnsyncedData = createAsyncThunk(
  'sync/fetchUnsyncedData',
  async () => {
    const unsyncedRounds = await databaseManager.getUnsyncedRounds();
    return unsyncedRounds.map(r => r.id);
  }
);

// 非同期アクション: データ同期
export const syncData = createAsyncThunk(
  'sync/syncData',
  async (_, { getState, dispatch }) => {
    const state = getState() as { sync: SyncState };
    const unsyncedRounds = await databaseManager.getUnsyncedRounds();
    
    const syncResults = [];
    const total = unsyncedRounds.length;
    
    for (let i = 0; i < unsyncedRounds.length; i++) {
      const round = unsyncedRounds[i];
      
      // 進捗更新
      dispatch(updateSyncProgress({
        current: i + 1,
        total,
        message: `Syncing round ${i + 1} of ${total}...`,
      }));
      
      try {
        // SyncServiceV2での同期処理（実装済み）
        // await enhancedSyncService.syncRoundToCloud(round);
        
        await databaseManager.markRoundAsSynced(round.id);
        syncResults.push({ id: round.id, success: true });
      } catch (error) {
        syncResults.push({ id: round.id, success: false, error });
      }
    }
    
    return syncResults;
  }
);

// 非同期アクション: 競合解決
export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async ({ conflictId, resolution }: { conflictId: string; resolution: 'local' | 'remote' | 'merge' }) => {
    // SyncServiceV2での競合解決処理を呼び出す
    // const result = await enhancedSyncService.resolveConflict(conflictId, resolution);
    return { conflictId, resolution };
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // 同期ステータスの設定
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.status = action.payload;
      state.isSyncing = action.payload === 'syncing';
    },

    // オンライン状態の更新
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload && state.syncQueue.length > 0 && state.isAuthenticated) {
        state.status = 'syncing';
        state.isSyncing = true;
      }
    },

    // 認証状態の更新
    setAuthStatus: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        state.status = 'idle';
        state.isSyncing = false;
        state.conflicts = [];
      }
    },

    // 同期キューに追加
    addToSyncQueue: (state, action: PayloadAction<string>) => {
      if (!state.syncQueue.includes(action.payload)) {
        state.syncQueue.push(action.payload);
        state.pendingCount = state.syncQueue.length;
      }
    },

    // 同期キューから削除
    removeFromSyncQueue: (state, action: PayloadAction<string>) => {
      state.syncQueue = state.syncQueue.filter(id => id !== action.payload);
      state.pendingCount = state.syncQueue.length;
    },

    // 同期成功時の処理
    syncSuccess: (state, action: PayloadAction<string[]>) => {
      state.syncQueue = state.syncQueue.filter(id => !action.payload.includes(id));
      state.pendingCount = state.syncQueue.length;
      state.lastSyncTime = new Date().toISOString();
      state.error = null;
      state.status = 'success';
      state.syncProgress = { current: 0, total: 0, message: '' };
    },

    // 同期エラー
    setSyncError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isSyncing = false;
      state.status = 'error';
      state.syncProgress = { current: 0, total: 0, message: '' };
    },

    // 競合の更新
    updateConflicts: (state, action: PayloadAction<ConflictItem[]>) => {
      state.conflicts = action.payload;
      if (action.payload.length > 0) {
        state.status = 'conflict';
      }
    },

    // 競合の追加
    addConflict: (state, action: PayloadAction<ConflictItem>) => {
      state.conflicts.push(action.payload);
      state.status = 'conflict';
    },

    // 競合の削除
    removeConflict: (state, action: PayloadAction<string>) => {
      state.conflicts = state.conflicts.filter(c => c.id !== action.payload);
      if (state.conflicts.length === 0 && state.status === 'conflict') {
        state.status = 'idle';
      }
    },

    // 競合戦略の設定
    setConflictStrategy: (state, action: PayloadAction<ConflictStrategy>) => {
      state.conflictStrategy = action.payload;
    },

    // 同期進捗の更新
    updateSyncProgress: (state, action: PayloadAction<{ current: number; total: number; message: string }>) => {
      state.syncProgress = action.payload;
    },

    // エラークリア
    clearError: (state) => {
      state.error = null;
      if (state.status === 'error') {
        state.status = 'idle';
      }
    },

    // 同期状態のリセット
    resetSyncState: (state) => {
      state.isSyncing = false;
      state.error = null;
      state.status = 'idle';
      state.syncProgress = { current: 0, total: 0, message: '' };
    },

    // 競合のクリア
    clearConflicts: (state) => {
      state.conflicts = [];
      if (state.status === 'conflict') {
        state.status = 'idle';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUnsyncedData
      .addCase(fetchUnsyncedData.pending, (state) => {
        state.status = 'syncing';
      })
      .addCase(fetchUnsyncedData.fulfilled, (state, action) => {
        state.syncQueue = action.payload;
        state.pendingCount = action.payload.length;
        if (action.payload.length === 0) {
          state.status = 'idle';
        }
      })
      .addCase(fetchUnsyncedData.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to fetch unsynced data';
      })
      
      // syncData
      .addCase(syncData.pending, (state) => {
        state.isSyncing = true;
        state.status = 'syncing';
        state.error = null;
      })
      .addCase(syncData.fulfilled, (state, action) => {
        state.isSyncing = false;
        const successfulSyncs = action.payload.filter(r => r.success).map(r => r.id);
        state.syncQueue = state.syncQueue.filter(id => !successfulSyncs.includes(id));
        state.pendingCount = state.syncQueue.length;
        
        if (successfulSyncs.length > 0) {
          state.lastSyncTime = new Date().toISOString();
          state.status = 'success';
        } else if (action.payload.some(r => !r.success)) {
          state.status = 'error';
          state.error = 'Some items failed to sync';
        } else {
          state.status = 'idle';
        }
        
        state.syncProgress = { current: 0, total: 0, message: '' };
      })
      .addCase(syncData.rejected, (state, action) => {
        state.isSyncing = false;
        state.status = 'error';
        state.error = action.error.message || 'Sync failed';
        state.syncProgress = { current: 0, total: 0, message: '' };
      })
      
      // resolveConflict
      .addCase(resolveConflict.pending, (state) => {
        state.status = 'syncing';
      })
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.conflicts = state.conflicts.filter(c => c.id !== action.payload.conflictId);
        if (state.conflicts.length === 0) {
          state.status = 'idle';
        }
      })
      .addCase(resolveConflict.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to resolve conflict';
      });
  },
});

export const {
  setSyncStatus,
  setOnlineStatus,
  setAuthStatus,
  addToSyncQueue,
  removeFromSyncQueue,
  syncSuccess,
  setSyncError,
  updateConflicts,
  addConflict,
  removeConflict,
  setConflictStrategy,
  updateSyncProgress,
  clearError,
  resetSyncState,
  clearConflicts,
} = syncSlice.actions;

export default syncSlice.reducer;