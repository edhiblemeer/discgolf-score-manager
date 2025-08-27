// ラウンド履歴管理Slice

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Round } from '@/types/models';
import { databaseManager } from '@/database/helpers';

interface RoundsState {
  items: Round[];
  loading: boolean;
  error: string | null;
  ghostRound: Round | null; // ゴーストモード用の直近ラウンド
}

const initialState: RoundsState = {
  items: [],
  loading: false,
  error: null,
  ghostRound: null,
};

// 非同期アクション: ラウンド取得
export const fetchRounds = createAsyncThunk(
  'rounds/fetchRounds',
  async (limit: number = 20) => {
    const rounds = await databaseManager.getRounds(limit);
    return rounds;
  }
);

// 非同期アクション: ラウンド作成
export const createRound = createAsyncThunk(
  'rounds/createRound',
  async (round: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await databaseManager.createRound(round);
    return { ...round, id };
  }
);

const roundsSlice = createSlice({
  name: 'rounds',
  initialState,
  reducers: {
    // ラウンド追加
    addRound: (state, action: PayloadAction<Round>) => {
      state.items.unshift(action.payload);
    },

    // ラウンド更新
    updateRound: (state, action: PayloadAction<{ id: string; updates: Partial<Round> }>) => {
      const index = state.items.findIndex(r => r.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...action.payload.updates };
      }
    },

    // ラウンド削除
    deleteRound: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(r => r.id !== action.payload);
    },

    // ゴーストラウンド設定
    setGhostRound: (state, action: PayloadAction<Round | null>) => {
      state.ghostRound = action.payload;
    },

    // エラークリア
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRounds
      .addCase(fetchRounds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRounds.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // 直近のラウンドをゴーストラウンドに設定
        if (action.payload.length > 0) {
          state.ghostRound = action.payload[0];
        }
      })
      .addCase(fetchRounds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rounds';
      })
      // createRound
      .addCase(createRound.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRound.fulfilled, (state, action) => {
        state.loading = false;
        // 新しいラウンドを最初に追加
        state.items.unshift(action.payload as Round);
      })
      .addCase(createRound.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create round';
      });
  },
});

export const {
  addRound,
  updateRound,
  deleteRound,
  setGhostRound,
  clearError,
} = roundsSlice.actions;

export default roundsSlice.reducer;