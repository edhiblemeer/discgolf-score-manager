/**
 * Sync Screen
 * データ同期の管理と競合解決のUI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import { enhancedSyncService } from '@/services/SyncServiceV2';
import { authService } from '@/services/authService';
import { conflictResolver } from '@/services/ConflictResolver';
import { ConflictStrategy } from '@/services/SyncServiceV2';
import {
  setOnlineStatus,
  setAuthStatus,
  setConflictStrategy,
  clearError,
  clearConflicts,
} from '@/store/syncSliceV2';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

export default function SyncScreen() {
  const dispatch = useAppDispatch();
  const syncState = useAppSelector(state => state.sync);
  const { syncEnabled } = useAppSelector(state => state.settings);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictStrategy>(
    ConflictStrategy.LAST_WRITE_WINS
  );

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = authService.onAuthStateChanged((user) => {
      dispatch(setAuthStatus(!!user));
    });

    return unsubscribe;
  }, [dispatch]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      const result = await enhancedSyncService.manualSync();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.syncedCount} items`
        );
      } else if (result.conflicts.length > 0) {
        Alert.alert(
          'Conflicts Detected',
          `${result.conflicts.length} conflicts need resolution`
        );
      } else if (result.errors.length > 0) {
        Alert.alert('Sync Failed', result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert('Sync Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    try {
      const conflict = syncState.conflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      let strategy: ConflictStrategy;
      switch (resolution) {
        case 'local':
          strategy = ConflictStrategy.LOCAL_FIRST;
          break;
        case 'remote':
          strategy = ConflictStrategy.REMOTE_FIRST;
          break;
        case 'merge':
          strategy = ConflictStrategy.MERGE;
          break;
        default:
          strategy = ConflictStrategy.LAST_WRITE_WINS;
      }

      const resolved = await conflictResolver.resolve(conflict, strategy);
      
      // TODO: 解決したデータを保存
      
      Alert.alert('Conflict Resolved', `Conflict resolved using ${resolution} strategy`);
    } catch (error) {
      Alert.alert('Resolution Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleStrategyChange = (strategy: ConflictStrategy) => {
    setSelectedStrategy(strategy);
    dispatch(setConflictStrategy(strategy));
  };

  const handleSignIn = () => {
    // Navigate to auth screen or show auth modal
    Alert.alert('Sign In', 'Authentication screen would be shown here');
  };

  const renderSyncStatus = () => {
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Sync Status</Text>
          {syncState.isSyncing && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
        
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={syncState.isOnline ? 'cloud-outline' : 'cloud-offline-outline'} 
              size={24} 
              color={syncState.isOnline ? COLORS.success : COLORS.error} 
            />
            <Text style={styles.statusLabel}>
              {syncState.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={syncState.isAuthenticated ? 'person' : 'person-outline'} 
              size={24} 
              color={syncState.isAuthenticated ? COLORS.success : COLORS.textSecondary} 
            />
            <Text style={styles.statusLabel}>
              {syncState.isAuthenticated ? 'Signed In' : 'Not Signed In'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name="sync" 
              size={24} 
              color={syncState.pendingCount > 0 ? COLORS.warning : COLORS.success} 
            />
            <Text style={styles.statusLabel}>
              {syncState.pendingCount} Pending
            </Text>
          </View>
        </View>

        {syncState.lastSyncTime && (
          <Text style={styles.lastSyncText}>
            Last synced: {new Date(syncState.lastSyncTime).toLocaleString()}
          </Text>
        )}

        {syncState.syncProgress.total > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {syncState.syncProgress.message}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(syncState.syncProgress.current / syncState.syncProgress.total) * 100}%` }
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderConflicts = () => {
    if (syncState.conflicts.length === 0) return null;

    return (
      <View style={styles.conflictsSection}>
        <Text style={styles.sectionTitle}>Conflicts ({syncState.conflicts.length})</Text>
        
        {syncState.conflicts.map((conflict) => {
          const severity = conflictResolver.getConflictSeverity(conflict);
          
          return (
            <View key={conflict.id} style={styles.conflictCard}>
              <View style={styles.conflictHeader}>
                <Text style={styles.conflictType}>{conflict.type}</Text>
                <View style={[styles.severityBadge, styles[`severity_${severity}`]]}>
                  <Text style={styles.severityText}>{severity}</Text>
                </View>
              </View>
              
              <View style={styles.conflictTimestamps}>
                <Text style={styles.timestampText}>
                  Local: {new Date(conflict.localTimestamp).toLocaleString()}
                </Text>
                <Text style={styles.timestampText}>
                  Remote: {new Date(conflict.remoteTimestamp).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.conflictActions}>
                <TouchableOpacity
                  style={[styles.resolveButton, styles.resolveLocal]}
                  onPress={() => handleResolveConflict(conflict.id, 'local')}
                >
                  <Text style={styles.resolveButtonText}>Use Local</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.resolveButton, styles.resolveRemote]}
                  onPress={() => handleResolveConflict(conflict.id, 'remote')}
                >
                  <Text style={styles.resolveButtonText}>Use Remote</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.resolveButton, styles.resolveMerge]}
                  onPress={() => handleResolveConflict(conflict.id, 'merge')}
                >
                  <Text style={styles.resolveButtonText}>Merge</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSettings = () => {
    return (
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Sync Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto Sync</Text>
          <Switch
            value={syncEnabled}
            onValueChange={(value) => {
              // TODO: Update settings
            }}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={syncEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.strategySection}>
          <Text style={styles.settingLabel}>Conflict Resolution Strategy</Text>
          
          {Object.values(ConflictStrategy).map((strategy) => (
            <TouchableOpacity
              key={strategy}
              style={[
                styles.strategyOption,
                selectedStrategy === strategy && styles.strategyOptionActive
              ]}
              onPress={() => handleStrategyChange(strategy)}
            >
              <View style={styles.radioButton}>
                {selectedStrategy === strategy && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <Text style={styles.strategyText}>
                {strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (!syncState.isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.authPromptTitle}>Sign In Required</Text>
          <Text style={styles.authPromptText}>
            Sign in to enable cloud sync and access your data across devices
          </Text>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleManualSync}
          colors={[COLORS.primary]}
        />
      }
    >
      {renderSyncStatus()}
      
      {syncState.error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{syncState.error}</Text>
          <TouchableOpacity onPress={() => dispatch(clearError())}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {renderConflicts()}
      {renderSettings()}
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.syncButton]}
          onPress={handleManualSync}
          disabled={syncState.isSyncing || !syncState.isOnline}
        >
          <Ionicons name="sync" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Sync Now</Text>
        </TouchableOpacity>
        
        {syncState.conflicts.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={() => dispatch(clearConflicts())}
          >
            <Text style={styles.actionButtonText}>Clear Conflicts</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  conflictsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  conflictCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severity_low: {
    backgroundColor: '#E8F5E9',
  },
  severity_medium: {
    backgroundColor: '#FFF3E0',
  },
  severity_high: {
    backgroundColor: '#FFEBEE',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  conflictTimestamps: {
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  conflictActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resolveButton: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  resolveLocal: {
    backgroundColor: COLORS.primary,
  },
  resolveRemote: {
    backgroundColor: COLORS.secondary,
  },
  resolveMerge: {
    backgroundColor: COLORS.success,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  strategySection: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  strategyOptionActive: {
    backgroundColor: COLORS.background,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  strategyText: {
    fontSize: 14,
    color: COLORS.text,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.error,
  },
  dismissText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actions: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  syncButton: {
    backgroundColor: COLORS.primary,
  },
  clearButton: {
    backgroundColor: COLORS.warning,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  authPromptText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});