// ゲーム状態管理Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Player, Round, Score } from '@/types/models';

const initialState: GameState = {
  currentRound: undefined,
  currentHole: 1,
  players: [],
  scores: [],
  isPlaying: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // ゲーム開始
    startGame: (state, action: PayloadAction<{ round: Round; players: Player[] }>) => {
      state.currentRound = action.payload.round;
      state.players = action.payload.players;
      state.currentHole = 1;
      state.scores = [];
      state.isPlaying = true;
    },

    // ゲーム終了
    endGame: (state) => {
      state.currentRound = undefined;
      state.currentHole = 1;
      state.players = [];
      state.scores = [];
      state.isPlaying = false;
    },

    // 現在のホールを設定
    setCurrentHole: (state, action: PayloadAction<number>) => {
      state.currentHole = action.payload;
    },

    // 次のホールへ
    nextHole: (state) => {
      if (state.currentHole < 18) {
        state.currentHole += 1;
      }
    },

    // 前のホールへ
    previousHole: (state) => {
      if (state.currentHole > 1) {
        state.currentHole -= 1;
      }
    },

    // スコア追加・更新
    updateScore: (state, action: PayloadAction<Score>) => {
      const index = state.scores.findIndex(
        s => s.playerId === action.payload.playerId && s.holeNumber === action.payload.holeNumber
      );

      if (index >= 0) {
        state.scores[index] = action.payload;
      } else {
        state.scores.push(action.payload);
      }
    },

    // プレイヤー追加
    addPlayer: (state, action: PayloadAction<Player>) => {
      if (state.players.length < 4) {
        state.players.push(action.payload);
      }
    },

    // プレイヤー削除
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter(p => p.id !== action.payload);
      state.scores = state.scores.filter(s => s.playerId !== action.payload);
    },

    // ラウンド情報更新
    updateRoundInfo: (state, action: PayloadAction<Partial<Round>>) => {
      if (state.currentRound) {
        state.currentRound = { ...state.currentRound, ...action.payload };
      }
    },
  },
});

export const {
  startGame,
  endGame,
  setCurrentHole,
  nextHole,
  previousHole,
  updateScore,
  addPlayer,
  removePlayer,
  updateRoundInfo,
} = gameSlice.actions;

export default gameSlice.reducer;