// ゴーストモード用サービス

import { databaseManager } from '@/database/helpers';
import { Round, Score } from '@/types/models';

export interface GhostData {
  roundId: string;
  courseId: string;
  playerId: string;
  date: string;
  scores: GhostScore[];
  totalScore: number;
  totalPar: number;
}

export interface GhostScore {
  holeNumber: number;
  strokes: number;
  putts: number;
  par: number;
  difference: number; // パーとの差分
}

export interface GhostComparison {
  holeNumber: number;
  currentScore: number;
  ghostScore: number;
  difference: number; // 現在 - ゴースト（マイナスが改善）
  cumulativeDifference: number;
}

class GhostService {
  /**
   * 指定コース・プレイヤーの直近ラウンドを取得
   */
  async getRecentGhostData(
    courseId: string, 
    playerId: string
  ): Promise<GhostData | null> {
    try {
      // 直近のラウンドを取得
      const rounds = await databaseManager.getRounds(10);
      
      // 同じコース・プレイヤーのラウンドをフィルタ
      const matchingRounds = rounds.filter(
        r => r.courseId === courseId && 
             r.status === 'completed'
      );

      if (matchingRounds.length === 0) {
        return null;
      }

      // 最新のラウンドを選択
      const recentRound = matchingRounds[0];
      
      // そのラウンドのスコアを取得
      const scores = await this.getScoresForRound(
        recentRound.id, 
        playerId
      );

      if (scores.length === 0) {
        return null;
      }

      // ゴーストデータを構築
      const ghostData = this.buildGhostData(
        recentRound, 
        scores, 
        playerId
      );

      return ghostData;
    } catch (error) {
      console.error('Failed to get ghost data:', error);
      return null;
    }
  }

  /**
   * 特定ラウンドのスコアを取得
   */
  private async getScoresForRound(
    roundId: string, 
    playerId: string
  ): Promise<Score[]> {
    try {
      // 実際のデータベースクエリに置き換える必要あり
      // 仮実装：ダミーデータを返す
      const dummyScores: Score[] = [];
      for (let i = 1; i <= 18; i++) {
        dummyScores.push({
          id: `score_${i}`,
          roundId,
          playerId,
          holeNumber: i,
          strokes: Math.floor(Math.random() * 3) + 3, // 3-5のランダム
          putts: Math.floor(Math.random() * 3) + 1,   // 1-3のランダム
          obCount: Math.random() > 0.8 ? 1 : 0,
          fairwayHit: Math.random() > 0.5,
        });
      }
      return dummyScores;
    } catch (error) {
      console.error('Failed to get scores for round:', error);
      return [];
    }
  }

  /**
   * ゴーストデータを構築
   */
  private buildGhostData(
    round: Round,
    scores: Score[],
    playerId: string
  ): GhostData {
    // パー情報（仮：すべてパー3と仮定）
    const parPerHole = 3;
    const totalPar = parPerHole * scores.length;

    const ghostScores: GhostScore[] = scores.map(score => ({
      holeNumber: score.holeNumber,
      strokes: score.strokes,
      putts: score.putts || 0,
      par: parPerHole,
      difference: score.strokes - parPerHole,
    }));

    const totalScore = ghostScores.reduce(
      (sum, score) => sum + score.strokes, 
      0
    );

    return {
      roundId: round.id,
      courseId: round.courseId,
      playerId,
      date: round.date,
      scores: ghostScores,
      totalScore,
      totalPar,
    };
  }

  /**
   * 現在のスコアとゴーストスコアを比較
   */
  compareWithGhost(
    currentScores: { holeNumber: number; strokes: number }[],
    ghostData: GhostData
  ): GhostComparison[] {
    const comparisons: GhostComparison[] = [];
    let cumulativeDiff = 0;

    currentScores.forEach(current => {
      const ghostScore = ghostData.scores.find(
        gs => gs.holeNumber === current.holeNumber
      );

      if (ghostScore) {
        const diff = current.strokes - ghostScore.strokes;
        cumulativeDiff += diff;

        comparisons.push({
          holeNumber: current.holeNumber,
          currentScore: current.strokes,
          ghostScore: ghostScore.strokes,
          difference: diff,
          cumulativeDifference: cumulativeDiff,
        });
      }
    });

    return comparisons;
  }

  /**
   * ゴーストデータの保存（ラウンド完了時）
   */
  async saveGhostData(
    roundId: string,
    scores: Score[]
  ): Promise<void> {
    try {
      // ラウンド完了時にスコアを保存
      // これは既存のdatabaseManager.saveScoreで行われる
      console.log('Ghost data will be available for next round');
    } catch (error) {
      console.error('Failed to save ghost data:', error);
    }
  }

  /**
   * プレイヤーのベストゴーストを取得
   */
  async getBestGhostData(
    courseId: string,
    playerId: string
  ): Promise<GhostData | null> {
    try {
      // すべてのラウンドを取得
      const rounds = await databaseManager.getRounds(50);
      
      // 同じコース・プレイヤーのラウンドをフィルタ
      const matchingRounds = rounds.filter(
        r => r.courseId === courseId && 
             r.status === 'completed'
      );

      if (matchingRounds.length === 0) {
        return null;
      }

      // 各ラウンドのスコアを取得してベストを見つける
      let bestGhostData: GhostData | null = null;
      let bestTotalScore = Infinity;

      for (const round of matchingRounds) {
        const scores = await this.getScoresForRound(round.id, playerId);
        if (scores.length > 0) {
          const ghostData = this.buildGhostData(round, scores, playerId);
          if (ghostData.totalScore < bestTotalScore) {
            bestTotalScore = ghostData.totalScore;
            bestGhostData = ghostData;
          }
        }
      }

      return bestGhostData;
    } catch (error) {
      console.error('Failed to get best ghost data:', error);
      return null;
    }
  }
}

export const ghostService = new GhostService();