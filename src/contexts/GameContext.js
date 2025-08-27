import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useScoreManagement } from '../hooks/useScoreManagement';
import { usePlayerManagement } from '../hooks/usePlayerManagement';
import { 
  saveCurrentRound, 
  loadCurrentRound, 
  clearCurrentRound,
  addToHistory,
  loadHistory,
  getLatestRoundForCourse
} from '../services/storageService';

// Context作成
const GameContext = createContext(null);

/**
 * GameProviderコンポーネント
 * アプリケーション全体の状態を管理し、子コンポーネントに提供
 */
export const GameProvider = ({ children }) => {
  const gameState = useGameState();
  const scoreManagement = useScoreManagement();
  const playerManagement = usePlayerManagement();

  // アプリ起動時にデータを復元
  useEffect(() => {
    const restoreData = async () => {
      try {
        const savedRound = await loadCurrentRound();
        if (savedRound) {
          console.log('保存されたラウンドデータを復元します');
          
          // スコアデータの復元
          if (savedRound.scores) {
            scoreManagement.setScores(savedRound.scores);
          }
          
          // プレイヤー名の復元
          if (savedRound.playerNames) {
            playerManagement.setPlayerNames(savedRound.playerNames);
          }
          
          // ゲーム状態の復元
          if (savedRound.selectedCourse) {
            gameState.setSelectedCourse(savedRound.selectedCourse);
          }
          if (savedRound.holeData) {
            gameState.setHoleData(savedRound.holeData);
          }
          if (savedRound.currentHole) {
            gameState.setCurrentHole(savedRound.currentHole);
          }
          if (savedRound.startHole) {
            gameState.setStartHole(savedRound.startHole);
          }
        }
      } catch (error) {
        console.error('データの復元に失敗:', error);
      }
    };

    restoreData();
  }, []); // 初回のみ実行

  // ラウンドデータを自動保存（スコアが更新されたとき）
  useEffect(() => {
    const autoSave = async () => {
      // 履歴表示中は自動保存しない
      if (gameState.isViewingHistory) {
        return;
      }
      
      // 少なくとも1つのスコアが入力されている場合のみ保存
      const hasScore = Object.values(scoreManagement.scores).some(s => s?.score);
      if (hasScore) {
        await saveCurrentRound({
          scores: scoreManagement.scores,
          playerNames: playerManagement.playerNames,
          selectedCourse: gameState.selectedCourse,
          holeData: gameState.holeData,
          currentHole: gameState.currentHole,
          startHole: gameState.startHole,
        });
      }
    };

    // 500ms後に保存（頻繁な保存を防ぐ）
    const timer = setTimeout(autoSave, 500);
    return () => clearTimeout(timer);
  }, [
    scoreManagement.scores,
    playerManagement.playerNames,
    gameState.selectedCourse,
    gameState.holeData,
    gameState.currentHole,
    gameState.startHole,
    gameState.isViewingHistory,
  ]);

  // ラウンドを完了して履歴に保存
  const finishRound = useCallback(async () => {
    try {
      // 履歴に追加（playersも一緒に渡す）
      await addToHistory({
        scores: scoreManagement.scores,
        players: playerManagement.players,
        playerNames: playerManagement.playerNames,
        selectedCourse: gameState.selectedCourse,
        holeData: gameState.holeData,
      });

      // 現在のラウンドデータをクリア
      await clearCurrentRound();

      // 状態をリセット
      gameState.resetGame();
      scoreManagement.resetScores();
      playerManagement.resetPlayers();

      return true;
    } catch (error) {
      console.error('ラウンドの完了処理に失敗:', error);
      return false;
    }
  }, [
    scoreManagement.scores,
    playerManagement.playerNames,
    gameState.selectedCourse,
    gameState.holeData,
  ]);

  // 履歴データを取得
  const getHistory = useCallback(async () => {
    try {
      const history = await loadHistory();
      return history;
    } catch (error) {
      console.error('履歴の取得に失敗:', error);
      return [];
    }
  }, []);

  // 履歴データをゲーム状態にセット（読み取り専用表示用）
  const loadHistoryData = useCallback((historyEntry) => {
    if (!historyEntry) return;
    
    // 履歴表示モードを有効化
    gameState.setIsViewingHistory(true);
    
    // スコアデータをセット
    if (historyEntry.scores) {
      scoreManagement.setScores(historyEntry.scores);
    }
    
    // プレイヤー名をセット
    if (historyEntry.playerNames) {
      playerManagement.setPlayerNames(historyEntry.playerNames);
      
      // playerNamesからplayers配列を生成（実際に値があるもののみ）
      const playersArray = Object.keys(historyEntry.playerNames)
        .filter(index => historyEntry.playerNames[index]) // 値が存在するもののみ
        .map(index => ({
          name: historyEntry.playerNames[index]
        }));
      playerManagement.setPlayers(playersArray);
    }
    
    // コース情報をセット
    if (historyEntry.courseName) {
      gameState.setSelectedCourse(historyEntry.courseName);
    }
    
    // ホールデータをセット
    if (historyEntry.holeData) {
      gameState.setHoleData(historyEntry.holeData);
    }
  }, [scoreManagement, playerManagement, gameState]);

  // ゴーストデータを読み込み
  const loadGhostData = useCallback(async (courseName) => {
    try {
      const ghostRound = await getLatestRoundForCourse(courseName);
      if (ghostRound) {
        gameState.setGhostData(ghostRound);
        gameState.setIsGhostActive(true);
        console.log('ゴーストデータを読み込みました:', ghostRound.date);
      } else {
        gameState.setGhostData(null);
        gameState.setIsGhostActive(false);
        console.log('ゴーストデータがありません');
      }
    } catch (error) {
      console.error('ゴーストデータの読み込みに失敗:', error);
      gameState.setGhostData(null);
      gameState.setIsGhostActive(false);
    }
  }, [gameState]);

  // コンテキストに提供する値をまとめる
  const value = {
    // Game State
    ...gameState,
    totalHoles: gameState.totalHoles,
    setTotalHoles: gameState.setTotalHoles,
    playableHoles: gameState.playableHoles,
    setPlayableHoles: gameState.setPlayableHoles,
    selectedLayout: gameState.selectedLayout,
    setSelectedLayout: gameState.setSelectedLayout,
    
    // Score Management
    scores: scoreManagement.scores,
    setScores: scoreManagement.setScores,
    updateScore: scoreManagement.updateScore,
    updatePutts: scoreManagement.updatePutts,
    updateOB: scoreManagement.updateOB,
    updateFairway: scoreManagement.updateFairway,
    updateShotType: scoreManagement.updateShotType,
    updateScoreData: scoreManagement.updateScoreData,
    getScore: scoreManagement.getScore,
    getPutts: scoreManagement.getPutts,
    getOB: scoreManagement.getOB,
    getFairway: scoreManagement.getFairway,
    getHoleScoreData: scoreManagement.getHoleScoreData,
    resetScores: scoreManagement.resetScores,
    checkRoundCompletion: scoreManagement.checkRoundCompletion,
    getMissingScoreHoles: scoreManagement.getMissingScoreHoles,
    
    // Player Management
    players: playerManagement.players,
    playerNames: playerManagement.playerNames,
    playerHDCPSettings: playerManagement.playerHDCPSettings,
    setPlayers: playerManagement.setPlayers,
    setPlayerNames: playerManagement.setPlayerNames,
    setPlayerHDCPSettings: playerManagement.setPlayerHDCPSettings,
    addPlayer: playerManagement.addPlayer,
    removePlayer: playerManagement.removePlayer,
    updatePlayerName: playerManagement.updatePlayerName,
    updatePlayerHDCP: playerManagement.updatePlayerHDCP,
    resetPlayers: playerManagement.resetPlayers,
    resetPlayerNames: playerManagement.resetPlayerNames,
    getPlayerCount: playerManagement.getPlayerCount,
    getPlayerName: playerManagement.getPlayerName,
    isMaxPlayers: playerManagement.isMaxPlayers,
    isMinPlayers: playerManagement.isMinPlayers,
    
    // Storage Functions
    finishRound,
    getHistory,
    loadHistoryData,
    loadGhostData,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

/**
 * GameContextを使用するためのカスタムフック
 */
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export default GameContext;