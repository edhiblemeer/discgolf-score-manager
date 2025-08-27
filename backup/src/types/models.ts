// ゲーム関連の型定義

export type DiscType = 'P' | 'M' | 'FD' | 'DD'; // Putter, Midrange, Fairway Driver, Distance Driver

export interface Player {
  id: string;
  name: string;
  hdcp?: number;
  avatarUrl?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  holes: number;
  totalPar: number;
  location?: string;
  createdAt: string;
}

export interface Round {
  id: string;
  courseId: string;
  courseName?: string;
  date: string;
  weather?: string;
  totalScore?: number;
  totalPutts?: number;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Score {
  id: string;
  roundId: string;
  playerId: string;
  holeNumber: number;
  par: number;
  score: number;
  putts: number;
  obCount: number;
  fairwayHit: boolean;
  discType?: DiscType;
  notes?: string;
}

export interface GameState {
  currentRound?: Round;
  currentHole: number;
  players: Player[];
  scores: Score[];
  isPlaying: boolean;
}

export interface Settings {
  inputMode: 'relative' | 'absolute'; // PAR基準 or 絶対値
  showGhostMode: boolean;
  enableAnimations: boolean;
  syncEnabled: boolean;
  lastSyncDate?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface Statistics {
  averageScore: number;
  averagePutts: number;
  birdieCount: number;
  parCount: number;
  bogeyCount: number;
  fairwayHitRate: number;
  bestRound?: Round;
  favoriteHoles: number[];
}