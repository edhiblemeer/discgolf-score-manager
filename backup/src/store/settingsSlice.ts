// 設定管理Slice

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Settings } from '@/types/models';
import { storageManager } from '@/database/helpers';

interface SettingsState extends Settings {
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  inputMode: 'relative',
  showGhostMode: true,
  enableAnimations: true,
  syncEnabled: true,
  lastSyncDate: undefined,
  loading: false,
  error: null,
};

// 非同期アクション: 設定読み込み
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    const settings = await storageManager.getSettings();
    return settings;
  }
);

// 非同期アクション: 設定保存
export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Settings) => {
    await storageManager.saveSettings(settings);
    return settings;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // 入力モード切り替え
    toggleInputMode: (state) => {
      state.inputMode = state.inputMode === 'relative' ? 'absolute' : 'relative';
    },

    // ゴーストモード切り替え
    toggleGhostMode: (state) => {
      state.showGhostMode = !state.showGhostMode;
    },

    // アニメーション切り替え
    toggleAnimations: (state) => {
      state.enableAnimations = !state.enableAnimations;
    },

    // 同期切り替え
    toggleSync: (state) => {
      state.syncEnabled = !state.syncEnabled;
    },

    // 設定一括更新
    updateSettings: (state, action: PayloadAction<Partial<Settings>>) => {
      Object.assign(state, action.payload);
    },

    // 最終同期日時更新
    updateLastSync: (state, action: PayloadAction<string>) => {
      state.lastSyncDate = action.payload;
    },

    // エラークリア
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadSettings
      .addCase(loadSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          Object.assign(state, action.payload);
        }
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load settings';
      })
      // saveSettings
      .addCase(saveSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save settings';
      });
  },
});

export const {
  toggleInputMode,
  toggleGhostMode,
  toggleAnimations,
  toggleSync,
  updateSettings,
  updateLastSync,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;