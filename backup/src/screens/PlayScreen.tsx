// プレイ開始画面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { PlayStackScreenProps } from '@/navigation/types';
import { useAppSelector } from '@/store';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = PlayStackScreenProps<'PlayHome'>;

export default function PlayScreen({ navigation }: Props) {
  const { isPlaying, currentRound } = useAppSelector(state => state.game);
  const ghostRound = useAppSelector(state => state.rounds.ghostRound);
  const settings = useAppSelector(state => state.settings);

  const handleStartNewRound = () => {
    navigation.navigate('CourseSelect');
  };

  const handleContinueRound = () => {
    // TODO: Resume current round
    if (currentRound) {
      navigation.navigate('ScoreCard', {
        courseId: currentRound.courseId,
        players: [],
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Round Status */}
      {isPlaying && currentRound && (
        <View style={styles.currentRoundCard}>
          <View style={styles.currentRoundHeader}>
            <Ionicons name="play-circle" size={24} color={COLORS.primary} />
            <Text style={styles.currentRoundTitle}>Round in Progress</Text>
          </View>
          <Text style={styles.currentRoundCourse}>{currentRound.courseName}</Text>
          <Text style={styles.currentRoundDate}>
            Started: {new Date(currentRound.date).toLocaleTimeString()}
          </Text>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinueRound}
          >
            <Text style={styles.continueButtonText}>Continue Round</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Start New Round */}
      <TouchableOpacity 
        style={styles.primaryActionCard}
        onPress={handleStartNewRound}
      >
        <Ionicons name="add-circle" size={48} color={COLORS.primary} />
        <Text style={styles.primaryActionTitle}>Start New Round</Text>
        <Text style={styles.primaryActionSubtitle}>
          Begin a new scoring session
        </Text>
      </TouchableOpacity>

      {/* Ghost Mode Info */}
      {settings.showGhostMode && ghostRound && (
        <View style={styles.ghostModeCard}>
          <View style={styles.ghostModeHeader}>
            <Ionicons name="contrast" size={24} color={COLORS.secondary} />
            <Text style={styles.ghostModeTitle}>Ghost Mode Available</Text>
          </View>
          <Text style={styles.ghostModeText}>
            Compare with your last round at {ghostRound.courseName}
          </Text>
          <Text style={styles.ghostModeScore}>
            Previous Score: {ghostRound.totalScore || '-'}
          </Text>
        </View>
      )}

      {/* Quick Settings */}
      <View style={styles.quickSettings}>
        <Text style={styles.quickSettingsTitle}>Quick Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="calculator" size={20} color={COLORS.text} />
            <Text style={styles.settingLabel}>Input Mode</Text>
          </View>
          <Text style={styles.settingValue}>
            {settings.inputMode === 'relative' ? 'PAR-based (+/-)' : 'Absolute'}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="people" size={20} color={COLORS.text} />
            <Text style={styles.settingLabel}>Max Players</Text>
          </View>
          <Text style={styles.settingValue}>4 Players</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="sync" size={20} color={COLORS.text} />
            <Text style={styles.settingLabel}>Auto Sync</Text>
          </View>
          <Text style={styles.settingValue}>
            {settings.syncEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color={COLORS.warning} />
          <Text style={styles.tipText}>
            Enable Ghost Mode to compare your performance with previous rounds
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  currentRoundCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  currentRoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentRoundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 10,
  },
  currentRoundCourse: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  currentRoundDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryActionCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    marginTop: 10,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  ghostModeCard: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  ghostModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ghostModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  ghostModeText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },
  ghostModeScore: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  quickSettings: {
    margin: 20,
    marginTop: 10,
  },
  quickSettingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tipsSection: {
    margin: 20,
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
  },
});