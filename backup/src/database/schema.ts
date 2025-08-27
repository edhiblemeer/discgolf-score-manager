// SQLiteデータベーススキーマ定義

export const DATABASE_NAME = 'discgolf.db';
export const DATABASE_VERSION = 1;

export const TABLES = {
  ROUNDS: 'rounds',
  SCORES: 'scores',
  PLAYERS: 'players',
  COURSES: 'courses',
  SETTINGS: 'settings',
} as const;

export const CREATE_TABLES_SQL = [
  // ラウンド情報テーブル
  `CREATE TABLE IF NOT EXISTS ${TABLES.ROUNDS} (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    course_name TEXT,
    date TEXT NOT NULL,
    weather TEXT,
    total_score INTEGER,
    total_putts INTEGER,
    is_synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,

  // スコア詳細テーブル
  `CREATE TABLE IF NOT EXISTS ${TABLES.SCORES} (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    hole_number INTEGER NOT NULL,
    par INTEGER NOT NULL,
    score INTEGER NOT NULL,
    putts INTEGER DEFAULT 0,
    ob_count INTEGER DEFAULT 0,
    fairway_hit INTEGER DEFAULT 0,
    disc_type TEXT,
    notes TEXT,
    FOREIGN KEY (round_id) REFERENCES ${TABLES.ROUNDS}(id),
    FOREIGN KEY (player_id) REFERENCES ${TABLES.PLAYERS}(id)
  );`,

  // プレイヤー情報テーブル
  `CREATE TABLE IF NOT EXISTS ${TABLES.PLAYERS} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hdcp REAL,
    avatar_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,

  // コース情報テーブル
  `CREATE TABLE IF NOT EXISTS ${TABLES.COURSES} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    holes INTEGER DEFAULT 18,
    total_par INTEGER,
    location TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,

  // 設定情報テーブル
  `CREATE TABLE IF NOT EXISTS ${TABLES.SETTINGS} (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
];

// インデックスの作成
export const CREATE_INDEXES_SQL = [
  `CREATE INDEX IF NOT EXISTS idx_rounds_date ON ${TABLES.ROUNDS}(date DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_rounds_synced ON ${TABLES.ROUNDS}(is_synced);`,
  `CREATE INDEX IF NOT EXISTS idx_scores_round ON ${TABLES.SCORES}(round_id);`,
  `CREATE INDEX IF NOT EXISTS idx_scores_player ON ${TABLES.SCORES}(player_id);`,
];