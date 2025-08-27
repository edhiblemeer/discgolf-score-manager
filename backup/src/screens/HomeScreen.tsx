// ホーム画面（ダッシュボード）

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MainTabScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRounds } from '@/store/roundsSlice';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = MainTabScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items: rounds, loading } = useAppSelector(state => state.rounds);
  const settings = useAppSelector(state => state.settings);

  useEffect(() => {
    // 初回ロード時にラウンドデータを取得
    dispatch(fetchRounds(5));
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchRounds(5));
  };

  const renderStatCard = (title: string, value: string | number, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderRecentRound = (round: any, index: number) => (
    <TouchableOpacity 
      key={round.id || index}
      style={styles.recentRoundCard}
      onPress={() => {/* TODO: Navigate to round detail */}}
    >
      <View style={styles.roundHeader}>
        <Text style={styles.roundCourse}>{round.courseName || 'Unknown Course'}</Text>
        <Text style={styles.roundDate}>{new Date(round.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.roundStats}>
        <Text style={styles.roundScore}>Score: {round.totalScore || '-'}</Text>
        <Text style={styles.roundPutts}>Putts: {round.totalPutts || '-'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.subText}>Ready for your next round?</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Play')}
        >
          <Ionicons name="play-circle" size={32} color="#fff" />
          <Text style={styles.actionButtonText}>Start Round</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          {renderStatCard('Total Rounds', rounds.length, 'golf')}
          {renderStatCard('Best Score', '-', 'trophy')}
          {renderStatCard('Avg Score', '-', 'stats-chart')}
          {renderStatCard('HDCP', '-', 'speedometer')}
        </View>
      </View>

      {/* Recent Rounds */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Rounds</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {rounds.length > 0 ? (
          rounds.slice(0, 3).map((round, index) => renderRecentRound(round, index))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="golf-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No rounds yet</Text>
            <Text style={styles.emptySubText}>Start your first round to see statistics</Text>
          </View>
        )}
      </View>

      {/* Settings Info */}
      <View style={styles.settingsInfo}>
        <Text style={styles.settingsInfoText}>
          Input Mode: {settings.inputMode === 'relative' ? 'PAR-based' : 'Absolute'}
        </Text>
        <Text style={styles.settingsInfoText}>
          Ghost Mode: {settings.showGhostMode ? 'Enabled' : 'Disabled'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
    marginTop: -30,
  },
  actionButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 5,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recentRoundCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roundCourse: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  roundDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  roundStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundScore: {
    fontSize: 14,
    color: COLORS.text,
  },
  roundPutts: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  settingsInfo: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  settingsInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
});