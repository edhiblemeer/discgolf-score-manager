// アプリケーション定数

export const APP_NAME = 'DiscGolf Score';
export const APP_VERSION = '1.0.0';

export const MAX_PLAYERS = 4;
export const DEFAULT_HOLES = 18;

export const DISC_TYPES = {
  P: { name: 'Putter', shortName: 'P', color: '#4CAF50' },
  M: { name: 'Midrange', shortName: 'M', color: '#2196F3' },
  FD: { name: 'Fairway Driver', shortName: 'FD', color: '#FF9800' },
  DD: { name: 'Distance Driver', shortName: 'DD', color: '#F44336' },
} as const;

export const SCORE_NAMES = {
  '-3': 'Albatross',
  '-2': 'Eagle',
  '-1': 'Birdie',
  '0': 'Par',
  '1': 'Bogey',
  '2': 'Double Bogey',
  '3': 'Triple Bogey',
} as const;

export const BADGE_TYPES = {
  FIRST_BIRDIE: 'first_birdie',
  FIRST_EAGLE: 'first_eagle',
  FIRST_ACE: 'first_ace',
  ROUNDS_10: 'rounds_10',
  ROUNDS_50: 'rounds_50',
  ROUNDS_100: 'rounds_100',
  PERSONAL_BEST: 'personal_best',
  PERFECT_ROUND: 'perfect_round',
} as const;

export const SYNC_INTERVAL = 30000; // 30秒ごとに同期チェック

export const COLORS = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  success: '#8BC34A',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
} as const;