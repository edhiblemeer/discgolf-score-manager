// ゴーストモード状態管理Slice

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GhostData, GhostComparison, ghostService } from '@/services/ghostService';

interface GhostState {
  enabled: boolean;
  ghostData: GhostData | null;
  comparisons: GhostComparison[];
  loading: boolean;
  error: string | null;
  ghostType: 'recent' | 'best'; // 直近 or ベスト
}

const initialState: GhostState = {
  enabled: false,
  ghostData: null,
  comparisons: [],
  loading: false,
  error: null,
  ghostType: 'recent',
};

// 非同期アクション: ゴーストデータ読み込み
export const loadGhostData = createAsyncThunk(
  'ghost/loadGhostData',
  async ({ courseId, playerId, type }: { 
    courseId: string; 
    playerId: string; 
    type: 'recent' | 'best';
  }) => {
    if (type === 'best') {
      return await ghostService.getBestGhostData(courseId, playerId);
    } else {
      return await ghostService.getRecentGhostData(courseId, playerId);
    }
  }
);

const ghostSlice = createSlice({
  name: 'ghost',
  initialState,
  reducers: {
    // ゴーストモード有効/無効切り替え
    toggleGhostMode: (state) => {
      state.enabled = !state.enabled;
      if (!state.enabled) {
        // 無効化時はデータをクリア
        state.ghostData = null;
        state.comparisons = [];
      }
    },

    // ゴーストモード有効化
    enableGhostMode: (state) => {
      state.enabled = true;
    },

    // ゴーストモード無効化
    disableGhostMode: (state) => {
      state.enabled = false;
      state.ghostData = null;
      state.comparisons = [];
    },

    // ゴーストタイプ切り替え
    setGhostType: (state, action: PayloadAction<'recent' | 'best'>) => {
      state.ghostType = action.payload;
    },

    // 比較データ更新
    updateComparisons: (state, action: PayloadAction<GhostComparison[]>) => {
      state.comparisons = action.payload;
    },

    // 現在のホールの比較を追加
    addComparison: (state, action: PayloadAction<GhostComparison>) => {
      const existingIndex = state.comparisons.findIndex(
        c => c.holeNumber === action.payload.holeNumber
      );

      if (existingIndex >= 0) {
        state.comparisons[existingIndex] = action.payload;
      } else {
        state.comparisons.push(action.payload);
      }

      // 累積差分を再計算
      let cumulative = 0;
      state.comparisons.sort((a, b) => a.holeNumber - b.holeNumber);
      state.comparisons.forEach(comp => {
        cumulative += comp.difference;
        comp.cumulativeDifference = cumulative;
      });
    },

    // エラークリア
    clearError: (state) => {
      state.error = null;
    },

    // ゴーストデータクリア
    clearGhostData: (state) => {
      state.ghostData = null;
      state.comparisons = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadGhostData
      .addCase(loadGhostData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadGhostData.fulfilled, (state, action) => {
        state.loading = false;
        state.ghostData = action.payload;
        if (!action.payload) {
          state.error = 'No ghost data available for this course';
          state.enabled = false;
        }
      })
      .addCase(loadGhostData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load ghost data';
        state.enabled = false;
      });
  },
});

export const {
  toggleGhostMode,
  enableGhostMode,
  disableGhostMode,
  setGhostType,
  updateComparisons,
  addComparison,
  clearError,
  clearGhostData,
} = ghostSlice.actions;

export default ghostSlice.reducer;