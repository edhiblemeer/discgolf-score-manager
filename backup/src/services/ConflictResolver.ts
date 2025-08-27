/**
 * Conflict Resolver Service
 * データ競合の検出と解決戦略の実装
 */

import { Round, Score, Player, Course } from '@/types/models';
import { ConflictItem, ConflictStrategy } from './SyncServiceV2';

export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedData: any;
  metadata: {
    resolvedAt: string;
    resolvedBy: 'automatic' | 'manual';
    conflictType: string;
    mergeDiffs?: string[];
  };
}

export interface MergeOptions {
  preferLocal?: string[]; // ローカルを優先するフィールド名
  preferRemote?: string[]; // リモートを優先するフィールド名
  customMerge?: (local: any, remote: any) => any; // カスタムマージ関数
}

class ConflictResolver {
  /**
   * 競合を解決
   */
  async resolve(
    conflict: ConflictItem,
    strategy: ConflictStrategy,
    options?: MergeOptions
  ): Promise<ConflictResolution> {
    let resolvedData: any;
    let mergeDiffs: string[] = [];

    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        resolvedData = this.resolveLastWriteWins(conflict);
        break;
      
      case ConflictStrategy.MERGE:
        const mergeResult = this.resolveMerge(conflict, options);
        resolvedData = mergeResult.data;
        mergeDiffs = mergeResult.diffs;
        break;
      
      case ConflictStrategy.LOCAL_FIRST:
        resolvedData = conflict.localData;
        break;
      
      case ConflictStrategy.REMOTE_FIRST:
        resolvedData = conflict.remoteData;
        break;
      
      case ConflictStrategy.MANUAL:
        // 手動解決の場合は呼び出し側で処理
        throw new Error('Manual resolution requires user intervention');
      
      default:
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }

    return {
      strategy,
      resolvedData,
      metadata: {
        resolvedAt: new Date().toISOString(),
        resolvedBy: strategy === ConflictStrategy.MANUAL ? 'manual' : 'automatic',
        conflictType: conflict.type,
        mergeDiffs: mergeDiffs.length > 0 ? mergeDiffs : undefined,
      },
    };
  }

  /**
   * Last Write Wins戦略での解決
   */
  private resolveLastWriteWins(conflict: ConflictItem): any {
    const localTime = new Date(conflict.localTimestamp).getTime();
    const remoteTime = new Date(conflict.remoteTimestamp).getTime();
    
    return remoteTime > localTime ? conflict.remoteData : conflict.localData;
  }

  /**
   * マージ戦略での解決
   */
  private resolveMerge(
    conflict: ConflictItem,
    options?: MergeOptions
  ): { data: any; diffs: string[] } {
    const diffs: string[] = [];
    
    // カスタムマージ関数が提供されている場合
    if (options?.customMerge) {
      return {
        data: options.customMerge(conflict.localData, conflict.remoteData),
        diffs: ['Custom merge applied'],
      };
    }

    // タイプ別のマージロジック
    switch (conflict.type) {
      case 'round':
        return this.mergeRounds(
          conflict.localData as Round,
          conflict.remoteData as Round,
          options
        );
      
      case 'score':
        return this.mergeScores(
          conflict.localData as Score,
          conflict.remoteData as Score,
          options
        );
      
      case 'player':
        return this.mergePlayers(
          conflict.localData as Player,
          conflict.remoteData as Player,
          options
        );
      
      case 'course':
        return this.mergeCourses(
          conflict.localData as Course,
          conflict.remoteData as Course,
          options
        );
      
      default:
        // デフォルトのマージ（フィールド単位で新しい方を採用）
        return this.defaultMerge(conflict.localData, conflict.remoteData, options);
    }
  }

  /**
   * Roundのマージ
   */
  private mergeRounds(
    local: Round,
    remote: Round,
    options?: MergeOptions
  ): { data: Round; diffs: string[] } {
    const merged: Round = { ...local };
    const diffs: string[] = [];

    // 基本フィールドのマージ
    if (local.courseId !== remote.courseId) {
      // コースIDが異なる場合は新しい方を採用
      const useRemote = new Date(remote.updatedAt) > new Date(local.updatedAt);
      merged.courseId = useRemote ? remote.courseId : local.courseId;
      diffs.push(`courseId: ${useRemote ? 'remote' : 'local'}`);
    }

    // プレイヤーリストのマージ（重複排除）
    const allPlayerIds = new Set([...local.playerIds, ...remote.playerIds]);
    merged.playerIds = Array.from(allPlayerIds);
    if (merged.playerIds.length !== local.playerIds.length) {
      diffs.push('playerIds: merged');
    }

    // 時間フィールドのマージ
    if (local.startTime !== remote.startTime) {
      // 早い方を採用
      merged.startTime = local.startTime < remote.startTime ? local.startTime : remote.startTime;
      diffs.push(`startTime: ${merged.startTime === local.startTime ? 'local' : 'remote'}`);
    }

    if (local.endTime !== remote.endTime && remote.endTime) {
      // 遅い方を採用（より完全なラウンド）
      merged.endTime = local.endTime && local.endTime > remote.endTime ? local.endTime : remote.endTime;
      diffs.push(`endTime: ${merged.endTime === local.endTime ? 'local' : 'remote'}`);
    }

    // ノートのマージ（両方を結合）
    if (local.notes !== remote.notes) {
      if (local.notes && remote.notes) {
        merged.notes = `${local.notes}\n---\n${remote.notes}`;
        diffs.push('notes: combined');
      } else {
        merged.notes = local.notes || remote.notes;
        diffs.push(`notes: ${local.notes ? 'local' : 'remote'}`);
      }
    }

    // 完了フラグ（どちらかが完了していれば完了）
    merged.isCompleted = local.isCompleted || remote.isCompleted;
    if (merged.isCompleted !== local.isCompleted) {
      diffs.push('isCompleted: remote');
    }

    // タイムスタンプは新しい方
    merged.updatedAt = new Date().toISOString();

    return { data: merged, diffs };
  }

  /**
   * Scoreのマージ
   */
  private mergeScores(
    local: Score,
    remote: Score,
    options?: MergeOptions
  ): { data: Score; diffs: string[] } {
    const merged: Score = { ...local };
    const diffs: string[] = [];

    // ストローク数（競合時は少ない方を採用 - より良いスコア）
    if (local.strokes !== remote.strokes) {
      merged.strokes = Math.min(local.strokes, remote.strokes);
      diffs.push(`strokes: ${merged.strokes === local.strokes ? 'local' : 'remote'} (better score)`);
    }

    // パット数（より詳細な記録がある方）
    if (local.putts !== remote.putts) {
      if (local.putts === 0 && remote.putts > 0) {
        merged.putts = remote.putts;
        diffs.push('putts: remote (has data)');
      } else if (remote.putts === 0 && local.putts > 0) {
        merged.putts = local.putts;
        diffs.push('putts: local (has data)');
      } else {
        // 両方にデータがある場合は新しい方
        const useRemote = new Date(remote.updatedAt || 0) > new Date(local.updatedAt || 0);
        merged.putts = useRemote ? remote.putts : local.putts;
        diffs.push(`putts: ${useRemote ? 'remote' : 'local'}`);
      }
    }

    // OBカウント（多い方を採用 - より完全な記録）
    if ((local.obCount || 0) !== (remote.obCount || 0)) {
      merged.obCount = Math.max(local.obCount || 0, remote.obCount || 0);
      diffs.push(`obCount: ${merged.obCount === local.obCount ? 'local' : 'remote'} (max)`);
    }

    // フェアウェイヒット（どちらかがtrueならtrue）
    merged.fairwayHit = local.fairwayHit || remote.fairwayHit;
    if (merged.fairwayHit !== local.fairwayHit) {
      diffs.push('fairwayHit: remote');
    }

    return { data: merged, diffs };
  }

  /**
   * Playerのマージ
   */
  private mergePlayers(
    local: Player,
    remote: Player,
    options?: MergeOptions
  ): { data: Player; diffs: string[] } {
    const merged: Player = { ...local };
    const diffs: string[] = [];

    // 名前（新しい方を採用）
    if (local.name !== remote.name) {
      const useRemote = new Date(remote.updatedAt || 0) > new Date(local.updatedAt || 0);
      merged.name = useRemote ? remote.name : local.name;
      diffs.push(`name: ${useRemote ? 'remote' : 'local'}`);
    }

    // ハンディキャップ（より最近の計算を採用）
    if (local.handicap !== remote.handicap) {
      const useRemote = new Date(remote.updatedAt || 0) > new Date(local.updatedAt || 0);
      merged.handicap = useRemote ? remote.handicap : local.handicap;
      diffs.push(`handicap: ${useRemote ? 'remote' : 'local'}`);
    }

    return { data: merged, diffs };
  }

  /**
   * Courseのマージ
   */
  private mergeCourses(
    local: Course,
    remote: Course,
    options?: MergeOptions
  ): { data: Course; diffs: string[] } {
    const merged: Course = { ...local };
    const diffs: string[] = [];

    // コース情報は基本的にリモートを信頼（マスターデータ）
    if (JSON.stringify(local.holes) !== JSON.stringify(remote.holes)) {
      merged.holes = remote.holes;
      diffs.push('holes: remote (master data)');
    }

    if (local.totalPar !== remote.totalPar) {
      merged.totalPar = remote.totalPar;
      diffs.push('totalPar: remote (master data)');
    }

    return { data: merged, diffs };
  }

  /**
   * デフォルトのマージ（フィールド単位で新しい方を採用）
   */
  private defaultMerge(
    local: any,
    remote: any,
    options?: MergeOptions
  ): { data: any; diffs: string[] } {
    const merged: any = {};
    const diffs: string[] = [];

    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      // 優先設定がある場合
      if (options?.preferLocal?.includes(key)) {
        merged[key] = local[key];
        if (local[key] !== remote[key]) {
          diffs.push(`${key}: local (preferred)`);
        }
      } else if (options?.preferRemote?.includes(key)) {
        merged[key] = remote[key];
        if (local[key] !== remote[key]) {
          diffs.push(`${key}: remote (preferred)`);
        }
      } else {
        // デフォルト：値が異なる場合は新しい方を採用
        if (local[key] !== remote[key]) {
          // タイムスタンプフィールドで判断
          const localTime = local.updatedAt || local.createdAt;
          const remoteTime = remote.updatedAt || remote.createdAt;
          const useRemote = new Date(remoteTime) > new Date(localTime);
          
          merged[key] = useRemote ? remote[key] : local[key];
          diffs.push(`${key}: ${useRemote ? 'remote' : 'local'}`);
        } else {
          merged[key] = local[key];
        }
      }
    }

    return { data: merged, diffs };
  }

  /**
   * 競合の自動解決可能性をチェック
   */
  canAutoResolve(conflict: ConflictItem, strategy: ConflictStrategy): boolean {
    // 手動解決以外は自動解決可能
    return strategy !== ConflictStrategy.MANUAL;
  }

  /**
   * 競合の重要度を判定
   */
  getConflictSeverity(conflict: ConflictItem): 'low' | 'medium' | 'high' {
    // スコアの競合は高重要度
    if (conflict.type === 'score') {
      const localScore = conflict.localData as Score;
      const remoteScore = conflict.remoteData as Score;
      
      // ストローク数が大きく異なる場合は高重要度
      if (Math.abs(localScore.strokes - remoteScore.strokes) > 2) {
        return 'high';
      }
      
      return 'medium';
    }

    // ラウンドの競合は中重要度
    if (conflict.type === 'round') {
      return 'medium';
    }

    // その他は低重要度
    return 'low';
  }

  /**
   * 競合のサマリーを生成
   */
  generateConflictSummary(conflict: ConflictItem): string {
    const localTime = new Date(conflict.localTimestamp).toLocaleString();
    const remoteTime = new Date(conflict.remoteTimestamp).toLocaleString();
    
    return `${conflict.type} conflict detected:\n` +
           `Local (${localTime}): ${JSON.stringify(conflict.localData, null, 2)}\n` +
           `Remote (${remoteTime}): ${JSON.stringify(conflict.remoteData, null, 2)}`;
  }
}

// シングルトンインスタンス
export const conflictResolver = new ConflictResolver();