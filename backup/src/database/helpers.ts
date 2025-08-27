// SQLiteデータベースヘルパー関数

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DATABASE_NAME, CREATE_TABLES_SQL, CREATE_INDEXES_SQL, TABLES } from './schema';
import { Round, Score, Player, Course, Settings } from '@/types/models';

class DatabaseManager {
  private db: SQLite.Database;
  private isInitialized: boolean = false;

  constructor() {
    this.db = SQLite.openDatabase(DATABASE_NAME);
  }

  // データベースの初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.createTables();
      await this.createIndexes();
      await this.seedInitialData();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // テーブル作成
  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          CREATE_TABLES_SQL.forEach(sql => {
            tx.executeSql(sql);
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  // インデックス作成
  private async createIndexes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          CREATE_INDEXES_SQL.forEach(sql => {
            tx.executeSql(sql);
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  // 初期データの投入
  private async seedInitialData(): Promise<void> {
    // デフォルト設定の挿入
    const defaultSettings = [
      { key: 'inputMode', value: 'relative' },
      { key: 'showGhostMode', value: 'true' },
      { key: 'enableAnimations', value: 'true' },
      { key: 'syncEnabled', value: 'true' },
    ];

    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          defaultSettings.forEach(setting => {
            tx.executeSql(
              `INSERT OR IGNORE INTO ${TABLES.SETTINGS} (key, value) VALUES (?, ?)`,
              [setting.key, setting.value]
            );
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  // ラウンド作成
  async createRound(round: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `INSERT INTO ${TABLES.ROUNDS} 
            (id, course_id, course_name, date, weather, total_score, total_putts, is_synced, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              round.courseId,
              round.courseName || null,
              round.date,
              round.weather || null,
              round.totalScore || null,
              round.totalPutts || null,
              round.isSynced ? 1 : 0,
              now,
              now,
            ],
            (_, result) => resolve(id),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        }
      );
    });
  }

  // ラウンド取得
  async getRounds(limit: number = 20): Promise<Round[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${TABLES.ROUNDS} ORDER BY date DESC LIMIT ?`,
          [limit],
          (_, result) => {
            const rounds: Round[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              rounds.push({
                ...row,
                isSynced: row.is_synced === 1,
              });
            }
            resolve(rounds);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // スコア保存
  async saveScore(score: Omit<Score, 'id'>): Promise<string> {
    const id = this.generateId();

    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO ${TABLES.SCORES}
            (id, round_id, player_id, hole_number, par, score, putts, ob_count, fairway_hit, disc_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              score.roundId,
              score.playerId,
              score.holeNumber,
              score.par,
              score.score,
              score.putts,
              score.obCount,
              score.fairwayHit ? 1 : 0,
              score.discType || null,
              score.notes || null,
            ],
            (_, result) => resolve(id),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        }
      );
    });
  }

  // 未同期ラウンドの取得
  async getUnsyncedRounds(): Promise<Round[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${TABLES.ROUNDS} WHERE is_synced = 0`,
          [],
          (_, result) => {
            const rounds: Round[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              rounds.push({
                ...row,
                isSynced: false,
              });
            }
            resolve(rounds);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // ラウンドを同期済みにマーク
  async markRoundAsSynced(roundId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `UPDATE ${TABLES.ROUNDS} SET is_synced = 1, updated_at = ? WHERE id = ?`,
            [new Date().toISOString(), roundId],
            () => resolve(),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        }
      );
    });
  }

  // ID生成
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// AsyncStorageラッパー
class StorageManager {
  private readonly STORAGE_KEYS = {
    SETTINGS: '@discgolf_settings',
    LAST_SYNC: '@discgolf_last_sync',
    USER_PROFILE: '@discgolf_user_profile',
  };

  // 設定の取得
  async getSettings(): Promise<Settings | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return null;
    }
  }

  // 設定の保存
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // 最終同期時刻の取得
  async getLastSync(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Failed to get last sync:', error);
      return null;
    }
  }

  // 最終同期時刻の設定
  async setLastSync(timestamp: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, timestamp);
    } catch (error) {
      console.error('Failed to set last sync:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスのエクスポート
export const databaseManager = new DatabaseManager();
export const storageManager = new StorageManager();