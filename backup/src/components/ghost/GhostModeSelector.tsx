import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  toggleGhostMode,
  setGhostType,
  loadGhostData,
} from '@/store/ghostSlice';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  courseId: string;
  playerId: string;
}

export default function GhostModeSelector({ courseId, playerId }: Props) {
  const dispatch = useAppDispatch();
  const { enabled, ghostData, ghostType, loading, error } = useAppSelector(
    state => state.ghost
  );
  const { showGhostMode } = useAppSelector(state => state.settings);

  // 設定でゴーストモードが無効の場合は表示しない
  if (!showGhostMode) {
    return null;
  }

  const handleToggle = async (value: boolean) => {
    if (value) {
      // ゴーストデータを読み込む
      await dispatch(loadGhostData({ courseId, playerId, type: ghostType }));
    }
    dispatch(toggleGhostMode());
  };

  const handleTypeChange = async (type: 'recent' | 'best') => {
    dispatch(setGhostType(type));
    if (enabled) {
      // タイプ変更時は再読み込み
      await dispatch(loadGhostData({ courseId, playerId, type }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.ghostIcon}>👻</Text>
          <Text style={styles.title}>Ghost Mode</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#767577', true: COLORS.primary }}
          thumbColor={enabled ? '#fff' : '#f4f3f4'}
          disabled={loading}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading ghost data...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {enabled && ghostData && (
        <View style={styles.content}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                ghostType === 'recent' && styles.typeButtonActive,
              ]}
              onPress={() => handleTypeChange('recent')}
            >
              <Ionicons 
                name="time" 
                size={16} 
                color={ghostType === 'recent' ? '#fff' : COLORS.text} 
              />
              <Text
                style={[
                  styles.typeButtonText,
                  ghostType === 'recent' && styles.typeButtonTextActive,
                ]}
              >
                Recent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                ghostType === 'best' && styles.typeButtonActive,
              ]}
              onPress={() => handleTypeChange('best')}
            >
              <Ionicons 
                name="trophy" 
                size={16} 
                color={ghostType === 'best' ? '#fff' : COLORS.text} 
              />
              <Text
                style={[
                  styles.typeButtonText,
                  ghostType === 'best' && styles.typeButtonTextActive,
                ]}
              >
                Best
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ghostInfo}>
            <Text style={styles.ghostDate}>
              {new Date(ghostData.date).toLocaleDateString()}
            </Text>
            <Text style={styles.ghostScore}>
              Total: {ghostData.totalScore} 
              ({ghostData.totalScore - ghostData.totalPar >= 0 ? '+' : ''}
              {ghostData.totalScore - ghostData.totalPar})
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEE',
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.error,
  },
  content: {
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  ghostInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  ghostDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ghostScore: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
});