import { useState } from 'react';
import { checkAllScoresEntered, getMissingHoles } from '../utils/scoreCalculations';
import { GAME_CONSTANTS } from '../utils/constants';

/**
 * スコア管理を行うカスタムフック
 */
export const useScoreManagement = () => {
  const [scores, setScores] = useState({});

  // スコアを更新
  const updateScore = (hole, playerIndex, score) => {
    setScores(prev => ({
      ...prev,
      [`${hole}-${playerIndex}`]: {
        ...prev[`${hole}-${playerIndex}`],
        score: score,
      }
    }));
  };

  // パット数を更新
  const updatePutts = (hole, playerIndex, putts) => {
    setScores(prev => ({
      ...prev,
      [`${hole}-${playerIndex}`]: {
        ...prev[`${hole}-${playerIndex}`],
        putts: putts,
      }
    }));
  };

  // OBフラグを更新（トグル対応）
  const updateOB = (hole, playerIndex, ob = null) => {
    setScores(prev => {
      const currentOB = prev[`${hole}-${playerIndex}`]?.ob || false;
      return {
        ...prev,
        [`${hole}-${playerIndex}`]: {
          ...prev[`${hole}-${playerIndex}`],
          ob: ob !== null ? ob : !currentOB,
        }
      };
    });
  };

  // フェアウェイキープフラグを更新（トグル対応）
  const updateFairway = (hole, playerIndex, fairway = null) => {
    setScores(prev => {
      const currentFairway = prev[`${hole}-${playerIndex}`]?.fairway || false;
      return {
        ...prev,
        [`${hole}-${playerIndex}`]: {
          ...prev[`${hole}-${playerIndex}`],
          fairway: fairway !== null ? fairway : !currentFairway,
        }
      };
    });
  };

  // ショットタイプを更新
  const updateShotType = (hole, playerIndex, shotType) => {
    setScores(prev => ({
      ...prev,
      [`${hole}-${playerIndex}`]: {
        ...prev[`${hole}-${playerIndex}`],
        shotType: shotType,
      }
    }));
  };

  // スコアデータを一括更新
  const updateScoreData = (hole, playerIndex, data) => {
    setScores(prev => ({
      ...prev,
      [`${hole}-${playerIndex}`]: {
        score: data.score || prev[`${hole}-${playerIndex}`]?.score || null,
        putts: data.putts !== undefined ? data.putts : prev[`${hole}-${playerIndex}`]?.putts || null,
        ob: data.ob !== undefined ? data.ob : prev[`${hole}-${playerIndex}`]?.ob || false,
        fairway: data.fairway !== undefined ? data.fairway : prev[`${hole}-${playerIndex}`]?.fairway || false,
        shotType: data.shotType || prev[`${hole}-${playerIndex}`]?.shotType || null,
      }
    }));
  };

  // スコアを取得
  const getScore = (hole, playerIndex) => {
    return scores[`${hole}-${playerIndex}`]?.score || null;
  };

  // パット数を取得
  const getPutts = (hole, playerIndex) => {
    return scores[`${hole}-${playerIndex}`]?.putts || null;
  };

  // OBフラグを取得
  const getOB = (hole, playerIndex) => {
    return scores[`${hole}-${playerIndex}`]?.ob || false;
  };

  // フェアウェイキープフラグを取得
  const getFairway = (hole, playerIndex) => {
    return scores[`${hole}-${playerIndex}`]?.fairway || false;
  };

  // ホールのスコアデータを取得
  const getHoleScoreData = (hole, playerIndex) => {
    return scores[`${hole}-${playerIndex}`] || {
      score: null,
      putts: null,
      ob: false,
      fairway: false,
    };
  };

  // スコアをリセット
  const resetScores = () => {
    setScores({});
  };

  // ラウンド完了チェック
  const checkRoundCompletion = (players, totalHoles = GAME_CONSTANTS.MAX_HOLES) => {
    return checkAllScoresEntered(scores, players, totalHoles);
  };

  // 記入漏れホールを取得
  const getMissingScoreHoles = (players, totalHoles = GAME_CONSTANTS.MAX_HOLES) => {
    return getMissingHoles(scores, players, totalHoles);
  };

  return {
    // State
    scores,
    
    // Setters
    setScores,
    
    // Update functions
    updateScore,
    updatePutts,
    updateOB,
    updateFairway,
    updateShotType,
    updateScoreData,
    
    // Getter functions
    getScore,
    getPutts,
    getOB,
    getFairway,
    getHoleScoreData,
    
    // Actions
    resetScores,
    checkRoundCompletion,
    getMissingScoreHoles,
  };
};