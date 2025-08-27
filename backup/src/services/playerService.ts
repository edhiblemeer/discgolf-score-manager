// プレイヤー管理サービス

import { Player } from '@/types/models';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@discgolf_players';

class PlayerService {
  private players: Player[] = [];
  private isInitialized = false;

  // 初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.players = JSON.parse(stored);
      } else {
        // デフォルトプレイヤーを作成
        await this.createDefaultPlayers();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize players:', error);
      this.players = [];
    }
  }

  // デフォルトプレイヤー作成
  private async createDefaultPlayers(): Promise<void> {
    const defaultPlayer: Player = {
      id: 'player_default',
      name: 'Me',
      hdcp: undefined,
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
    };

    this.players = [defaultPlayer];
    await this.savePlayers();
  }

  // プレイヤー一覧取得
  async getPlayers(): Promise<Player[]> {
    await this.initialize();
    return [...this.players];
  }

  // プレイヤーIDで取得
  async getPlayerById(id: string): Promise<Player | undefined> {
    await this.initialize();
    return this.players.find(p => p.id === id);
  }

  // プレイヤー追加
  async addPlayer(name: string, hdcp?: number): Promise<Player> {
    await this.initialize();

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      hdcp,
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
    };

    this.players.push(newPlayer);
    await this.savePlayers();

    return newPlayer;
  }

  // プレイヤー更新
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null> {
    await this.initialize();

    const index = this.players.findIndex(p => p.id === id);
    if (index >= 0) {
      this.players[index] = { ...this.players[index], ...updates };
      await this.savePlayers();
      return this.players[index];
    }

    return null;
  }

  // プレイヤー削除
  async deletePlayer(id: string): Promise<boolean> {
    await this.initialize();

    const index = this.players.findIndex(p => p.id === id);
    if (index >= 0) {
      this.players.splice(index, 1);
      await this.savePlayers();
      return true;
    }

    return false;
  }

  // HDCP計算
  calculateHDCP(scores: number[]): number {
    if (scores.length < 5) return 0;

    // 簡易HDCP計算（実際の計算はより複雑）
    const sortedScores = [...scores].sort((a, b) => a - b);
    const bestScores = sortedScores.slice(0, Math.floor(scores.length / 2));
    const average = bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length;
    
    // パー54を基準に計算
    const hdcp = Math.round((average - 54) * 0.96);
    return Math.max(0, hdcp);
  }

  // プレイヤー統計取得
  async getPlayerStatistics(playerId: string): Promise<{
    totalRounds: number;
    averageScore: number;
    bestScore: number;
    hdcp: number;
  } | null> {
    // TODO: データベースから統計を計算
    return {
      totalRounds: 0,
      averageScore: 0,
      bestScore: 0,
      hdcp: 0,
    };
  }

  // ストレージに保存
  private async savePlayers(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.players));
    } catch (error) {
      console.error('Failed to save players:', error);
    }
  }

  // 最近使用したプレイヤーを取得
  async getRecentPlayers(limit: number = 4): Promise<Player[]> {
    await this.initialize();
    // TODO: 使用履歴に基づいてソート
    return this.players.slice(0, limit);
  }

  // お気に入りプレイヤー設定
  async setFavoritePlayer(playerId: string): Promise<void> {
    await this.initialize();
    // プレイヤーを先頭に移動
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      this.players = [player, ...this.players.filter(p => p.id !== playerId)];
      await this.savePlayers();
    }
  }
}

export const playerService = new PlayerService();