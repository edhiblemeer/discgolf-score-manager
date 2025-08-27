// データベースマイグレーション管理

import { databaseManager } from './helpers';

export interface Migration {
  version: number;
  name: string;
  up: string[];
  down?: string[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: [
      // Version 1の初期スキーマはschema.tsで定義済み
    ],
  },
  // 将来のマイグレーションはここに追加
  // {
  //   version: 2,
  //   name: 'add_wind_speed_column',
  //   up: [
  //     'ALTER TABLE rounds ADD COLUMN wind_speed INTEGER;'
  //   ],
  //   down: [
  //     'ALTER TABLE rounds DROP COLUMN wind_speed;'
  //   ]
  // }
];

export class MigrationManager {
  private readonly MIGRATION_TABLE = 'migrations';

  async createMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.MIGRATION_TABLE} (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return new Promise((resolve, reject) => {
      // @ts-ignore - SQLiteのprivateプロパティアクセス
      databaseManager.db.transaction(
        tx => {
          tx.executeSql(sql);
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  async getCurrentVersion(): Promise<number> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      databaseManager.db.transaction(tx => {
        tx.executeSql(
          `SELECT MAX(version) as version FROM ${this.MIGRATION_TABLE}`,
          [],
          (_, result) => {
            const version = result.rows.item(0)?.version || 0;
            resolve(version);
          },
          (_, error) => {
            // テーブルが存在しない場合は0を返す
            resolve(0);
            return false;
          }
        );
      });
    });
  }

  async applyMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      databaseManager.db.transaction(
        tx => {
          // マイグレーションのSQLを実行
          migration.up.forEach(sql => {
            if (sql) tx.executeSql(sql);
          });

          // マイグレーション記録を保存
          tx.executeSql(
            `INSERT INTO ${this.MIGRATION_TABLE} (version, name) VALUES (?, ?)`,
            [migration.version, migration.name]
          );
        },
        error => reject(error),
        () => {
          console.log(`Migration ${migration.name} (v${migration.version}) applied successfully`);
          resolve();
        }
      );
    });
  }

  async runMigrations(): Promise<void> {
    try {
      await this.createMigrationTable();
      const currentVersion = await this.getCurrentVersion();

      const pendingMigrations = migrations.filter(m => m.version > currentVersion);

      if (pendingMigrations.length === 0) {
        console.log('Database is up to date');
        return;
      }

      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }

      console.log(`Applied ${pendingMigrations.length} migrations`);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

export const migrationManager = new MigrationManager();