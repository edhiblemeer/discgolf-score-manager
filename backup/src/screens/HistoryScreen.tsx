// 履歴画面

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MainTabScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRounds } from '@/store/roundsSlice';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { Round } from '@/types/models';

type Props = MainTabScreenProps<'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items: rounds, loading } = useAppSelector(state => state.rounds);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'synced' | 'unsynced'>('all');

  useEffect(() => {
    dispatch(fetchRounds(50));
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchRounds(50));
  };

  const getFilteredRounds = () => {
    if (selectedFilter === 'synced') {
      return rounds.filter(r => r.isSynced);
    } else if (selectedFilter === 'unsynced') {
      return rounds.filter(r => !r.isSynced);
    }
    return rounds;
  };

  const renderRoundItem = ({ item }: { item: Round }) => {
    const scoreColor = !item.totalScore ? COLORS.textSecondary :
      item.totalScore < 54 ? COLORS.success :
      item.totalScore === 54 ? COLORS.text :
      COLORS.error;

    return (
      <TouchableOpacity 
        style={styles.roundCard}
        onPress={() => {/* TODO: Navigate to round detail */}}
      >
        <View style={styles.roundHeader}>
          <View>
            <Text style={styles.courseName}>{item.courseName || 'Unknown Course'}</Text>
            <Text style={styles.roundDate}>
              {new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          {!item.isSynced && (
            <View style={styles.unsyncedBadge}>
              <Ionicons name="cloud-offline" size={16} color={COLORS.warning} />
            </View>
          )}
        </View>

        <View style={styles.roundStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={[styles.statValue, { color: scoreColor }]}>
              {item.totalScore || '-'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Putts</Text>
            <Text style={styles.statValue}>{item.totalPutts || '-'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Weather</Text>
            <Text style={styles.statValue}>{item.weather || '-'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Round History</Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'synced' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('synced')}
        >
          <Text style={[styles.filterText, selectedFilter === 'synced' && styles.filterTextActive]}>
            Synced
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'unsynced' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('unsynced')}
        >
          <Text style={[styles.filterText, selectedFilter === 'unsynced' && styles.filterTextActive]}>
            Offline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="golf-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Rounds Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start playing to see your history here
      </Text>
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => navigation.navigate('Play')}
      >
        <Text style={styles.startButtonText}>Start First Round</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredRounds = getFilteredRounds();

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredRounds}
        renderItem={renderRoundItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        contentContainerStyle={filteredRounds.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  roundCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  roundDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unsyncedBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roundStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});