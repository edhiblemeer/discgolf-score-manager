// Redux Store設定

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import gameReducer from './gameSlice';
import roundsReducer from './roundsSlice';
import settingsReducer from './settingsSlice';
import syncReducer from './syncSlice';
import ghostReducer from './ghostSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    rounds: roundsReducer,
    settings: settingsReducer,
    sync: syncReducer,
    ghost: ghostReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Date型のシリアライゼーションチェックを無効化
        ignoredActions: ['game/setCurrentRound', 'rounds/addRound'],
        ignoredPaths: ['game.currentRound.createdAt', 'rounds.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 型付きフック
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;