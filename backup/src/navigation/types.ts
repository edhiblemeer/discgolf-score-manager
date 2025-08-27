// ナビゲーション型定義

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { Course, Player } from '@/types/models';

// ルートスタックのパラメータ
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  CourseSelect: undefined;
  PlayerSetup: { courseId: string };
  ScoreCard: { courseId: string; players: Player[] };
  RoundSummary: { roundId: string };
};

// メインタブのパラメータ
export type MainTabParamList = {
  Home: undefined;
  Play: undefined;
  History: undefined;
  Statistics: undefined;
  Settings: undefined;
};

// プレイスタックのパラメータ
export type PlayStackParamList = {
  PlayHome: undefined;
  CourseSelect: undefined;
  PlayerSetup: { courseId: string };
  ScoreCard: { courseId: string; players: Player[] };
  RoundSummary: { roundId: string };
};

// 履歴スタックのパラメータ
export type HistoryStackParamList = {
  HistoryList: undefined;
  RoundDetail: { roundId: string };
  Statistics: { playerId?: string };
};

// 設定スタックのパラメータ
export type SettingsStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
  DataManagement: undefined;
  About: undefined;
};

// ナビゲーションプロップの型定義
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<'Main'>
  >;

export type PlayStackScreenProps<T extends keyof PlayStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<PlayStackParamList, T>,
    MainTabScreenProps<'Play'>
  >;

export type HistoryStackScreenProps<T extends keyof HistoryStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<HistoryStackParamList, T>,
    MainTabScreenProps<'History'>
  >;

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> = 
  CompositeScreenProps<
    StackScreenProps<SettingsStackParamList, T>,
    MainTabScreenProps<'Settings'>
  >;