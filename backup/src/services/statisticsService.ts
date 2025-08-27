/**
 * Statistics Service
 * ゴルフ統計の計算と分析
 */

import { Round, Score, Player, Course } from '@/types/models';
import { databaseManager } from '@/database/helpers';

export interface OverallStats {
  totalRounds: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  handicap: number;
  averagePutts: number;
  fairwayHitRate: number;
  parOrBetterRate: number;
  birdieRate: number;
}

export interface ScoreDistribution {
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  others: number;
}

export interface TrendData {
  dates: string[];
  scores: number[];
  averages: number[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface HoleStats {
  holeNumber: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  parRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

class StatisticsService {
  /**
   * 全体統計を計算
   */
  async calculateOverallStats(playerId: string): Promise<OverallStats> {
    // ダミーデータを使用（MVPのため）
    const rounds = this.getDummyRounds(playerId);
    const scores = this.getDummyScores(playerId);

    const totalScores = rounds.map(r => this.calculateRoundTotal(r.id, scores));
    const totalRounds = rounds.length;

    if (totalRounds === 0) {
      return {
        totalRounds: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        handicap: 0,
        averagePutts: 0,
        fairwayHitRate: 0,
        parOrBetterRate: 0,
        birdieRate: 0,
      };
    }

    const averageScore = totalScores.reduce((a, b) => a + b, 0) / totalRounds;
    const bestScore = Math.min(...totalScores);
    const worstScore = Math.max(...totalScores);
    const handicap = this.calculateHandicap(totalScores);

    // パット統計
    const allPutts = scores.map(s => s.putts || 0);
    const averagePutts = allPutts.reduce((a, b) => a + b, 0) / allPutts.length;

    // フェアウェイヒット率
    const fairwayShots = scores.filter(s => s.holeNumber && s.holeNumber !== 1); // Par3以外
    const fairwayHits = fairwayShots.filter(s => s.fairwayHit).length;
    const fairwayHitRate = fairwayShots.length > 0 ? (fairwayHits / fairwayShots.length) * 100 : 0;

    // パー以下の率
    const parOrBetter = scores.filter(s => (s.strokes - 3) <= 0).length; // 簡易計算（Par3想定）
    const parOrBetterRate = (parOrBetter / scores.length) * 100;

    // バーディー率
    const birdies = scores.filter(s => (s.strokes - 3) === -1).length;
    const birdieRate = (birdies / scores.length) * 100;

    return {
      totalRounds,
      averageScore,
      bestScore,
      worstScore,
      handicap,
      averagePutts,
      fairwayHitRate,
      parOrBetterRate,
      birdieRate,
    };
  }

  /**
   * スコア分布を計算
   */
  calculateScoreDistribution(scores: Score[]): ScoreDistribution {
    const distribution: ScoreDistribution = {
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubleBogeys: 0,
      others: 0,
    };

    scores.forEach(score => {
      const diff = score.strokes - 3; // Par3と仮定
      
      if (diff <= -2) distribution.eagles++;
      else if (diff === -1) distribution.birdies++;
      else if (diff === 0) distribution.pars++;
      else if (diff === 1) distribution.bogeys++;
      else if (diff === 2) distribution.doubleBogeys++;
      else distribution.others++;
    });

    return distribution;
  }

  /**
   * トレンドデータを計算
   */
  calculateTrend(playerId: string): TrendData {
    const rounds = this.getDummyRounds(playerId);
    const scores = this.getDummyScores(playerId);

    // 直近10ラウンドのデータ
    const recentRounds = rounds.slice(-10);
    const dates = recentRounds.map(r => new Date(r.startTime).toLocaleDateString());
    const roundScores = recentRounds.map(r => this.calculateRoundTotal(r.id, scores));
    
    // 移動平均を計算
    const averages: number[] = [];
    for (let i = 0; i < roundScores.length; i++) {
      const windowStart = Math.max(0, i - 2);
      const windowEnd = i + 1;
      const window = roundScores.slice(windowStart, windowEnd);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      averages.push(Math.round(avg * 10) / 10);
    }

    // トレンド判定（最初の3ラウンドと最後の3ラウンドを比較）
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (roundScores.length >= 6) {
      const firstAvg = roundScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const lastAvg = roundScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
      
      if (lastAvg < firstAvg - 1) trend = 'improving';
      else if (lastAvg > firstAvg + 1) trend = 'declining';
    }

    return {
      dates,
      scores: roundScores,
      averages,
      trend,
    };
  }

  /**
   * ホール別統計を計算
   */
  calculateHoleStats(courseId: string, playerId: string): HoleStats[] {
    const scores = this.getDummyScores(playerId);
    const holeStats: HoleStats[] = [];

    // 18ホール分の統計を生成
    for (let hole = 1; hole <= 18; hole++) {
      const holeScores = scores.filter(s => s.holeNumber === hole);
      
      if (holeScores.length === 0) {
        holeStats.push({
          holeNumber: hole,
          averageScore: 3,
          bestScore: 3,
          worstScore: 3,
          parRate: 0,
          difficulty: 'medium',
        });
        continue;
      }

      const strokes = holeScores.map(s => s.strokes);
      const averageScore = strokes.reduce((a, b) => a + b, 0) / strokes.length;
      const bestScore = Math.min(...strokes);
      const worstScore = Math.max(...strokes);
      const parRate = (holeScores.filter(s => s.strokes === 3).length / holeScores.length) * 100;

      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      if (averageScore < 3.2) difficulty = 'easy';
      else if (averageScore > 3.8) difficulty = 'hard';

      holeStats.push({
        holeNumber: hole,
        averageScore: Math.round(averageScore * 10) / 10,
        bestScore,
        worstScore,
        parRate: Math.round(parRate),
        difficulty,
      });
    }

    return holeStats;
  }

  /**
   * ハンディキャップを計算
   */
  private calculateHandicap(scores: number[]): number {
    if (scores.length < 5) return 0;
    
    // 簡易計算：平均スコア - パー
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const coursePar = 54; // 18ホール×Par3
    const handicap = Math.round((averageScore - coursePar) * 0.8); // 0.8は調整係数
    
    return Math.max(0, Math.min(36, handicap)); // 0-36の範囲に制限
  }

  /**
   * ラウンドの合計スコアを計算
   */
  private calculateRoundTotal(roundId: string, scores: Score[]): number {
    const roundScores = scores.filter(s => s.roundId === roundId);
    return roundScores.reduce((total, score) => total + score.strokes, 0);
  }

  /**
   * ダミーラウンドデータを生成
   */
  private getDummyRounds(playerId: string): Round[] {
    const rounds: Round[] = [];
    const now = new Date();
    
    // 過去20ラウンドを生成
    for (let i = 19; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 3)); // 3日間隔
      
      rounds.push({
        id: `round_${i}`,
        courseId: 'course_1',
        playerIds: [playerId],
        startTime: date.toISOString(),
        endTime: new Date(date.getTime() + 3600000 * 2).toISOString(), // 2時間後
        weather: 'sunny',
        notes: `Round ${20 - i}`,
        isCompleted: true,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }
    
    return rounds;
  }

  /**
   * ダミースコアデータを生成
   */
  private getDummyScores(playerId: string): Score[] {
    const scores: Score[] = [];
    const rounds = this.getDummyRounds(playerId);
    
    rounds.forEach((round, roundIndex) => {
      // 各ラウンド18ホール
      for (let hole = 1; hole <= 18; hole++) {
        // スコアをランダムに生成（改善傾向を持たせる）
        const baseScore = 3;
        const skill = roundIndex * 0.02; // 徐々に上達
        const randomness = (Math.random() - 0.5) * 2;
        const strokes = Math.round(baseScore + randomness - skill);
        
        scores.push({
          id: `score_${round.id}_${hole}`,
          roundId: round.id,
          playerId,
          holeNumber: hole,
          strokes: Math.max(1, Math.min(7, strokes)), // 1-7の範囲
          putts: Math.max(0, Math.min(4, Math.floor(Math.random() * 3))),
          fairwayHit: Math.random() > 0.3,
          obCount: Math.random() > 0.8 ? 1 : 0,
        });
      }
    });
    
    return scores;
  }

  /**
   * 月別統計を取得
   */
  getMonthlyStats(playerId: string): { month: string; average: number; rounds: number }[] {
    const rounds = this.getDummyRounds(playerId);
    const scores = this.getDummyScores(playerId);
    const monthlyData: { [key: string]: { total: number; count: number } } = {};

    rounds.forEach(round => {
      const date = new Date(round.startTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, count: 0 };
      }
      
      const roundTotal = this.calculateRoundTotal(round.id, scores);
      monthlyData[monthKey].total += roundTotal;
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      average: Math.round(data.total / data.count * 10) / 10,
      rounds: data.count,
    }));
  }
}

// シングルトンインスタンス
export const statisticsService = new StatisticsService();