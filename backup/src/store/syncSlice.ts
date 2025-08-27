// 同期管理Slice

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { databaseManager } from '@/database/helpers';
import { Round } from '@/types/models';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  syncQueue: string[]; // 同期待ちのラウンドID
  error: string | null;
  isOnline: boolean;
}

const initialState: SyncState = {
  isSyncing: false,
  lastSyncTime: null,
  pendingCount: 0,
  syncQueue: [],
  error: null,
  isOnline: true,
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
  async (_, { getState }) => {
    const state = getState() as { sync: SyncState };
    const unsyncedRounds = await databaseManager.getUnsyncedRounds();
    
    const syncResults = [];
    for (const round of unsyncedRounds) {
      try {
        // TODO: APIサーバーとの同期処理
        // await api.syncRound(round);
        
        // 成功したら同期済みフラグを更新
        await databaseManager.markRoundAsSynced(round.id);
        syncResults.push({ id: round.id, success: true });
      } catch (error) {
        syncResults.push({ id: round.id, success: false, error });
      }
    }
    
    return syncResults;
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // オンライン状態の更新
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload && state.syncQueue.length > 0) {
        // オンライン復帰時に同期を開始
        state.isSyncing = true;
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
    },

    // 同期エラー
    setSyncError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isSyncing = false;
    },

    // エラークリア
    clearError: (state) => {
      state.error = null;
    },

    // 同期状態のリセット
    resetSyncState: (state) => {
      state.isSyncing = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUnsyncedData
      .addCase(fetchUnsyncedData.fulfilled, (state, action) => {
        state.syncQueue = action.payload;
        state.pendingCount = action.payload.length;
      })
      // syncData
      .addCase(syncData.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncData.fulfilled, (state, action) => {
        state.isSyncing = false;
        const successfulSyncs = action.payload.filter(r => r.success).map(r => r.id);
        state.syncQueue = state.syncQueue.filter(id => !successfulSyncs.includes(id));
        state.pendingCount = state.syncQueue.length;
        if (successfulSyncs.length > 0) {
          state.lastSyncTime = new Date().toISOString();
        }
      })
      .addCase(syncData.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.error.message || 'Sync failed';
      });
  },
});

export const {
  setOnlineStatus,
  addToSyncQueue,
  removeFromSyncQueue,
  syncSuccess,
  setSyncError,
  clearError,
  resetSyncState,
} = syncSlice.actions;

export default syncSlice.reducer;