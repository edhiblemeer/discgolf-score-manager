import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useAppSelector } from '@/store';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  holeNumber: number;
  currentScore?: number;
}

export default function GhostScoreDisplay({ holeNumber, currentScore }: Props) {
  const { enabled, ghostData, comparisons } = useAppSelector(state => state.ghost);

  if (!enabled || !ghostData) {
    return null;
  }

  // 現在のホールのゴーストスコアを取得
  const ghostScore = ghostData.scores.find(s => s.holeNumber === holeNumber);
  if (!ghostScore) {
    return null;
  }

  // 比較データを取得
  const comparison = comparisons.find(c => c.holeNumber === holeNumber);
  const difference = comparison?.difference || 0;
  const cumulativeDiff = comparison?.cumulativeDifference || 0;

  const getDifferenceColor = (diff: number) => {
    if (diff < 0) return '#4CAF50'; // 改善（緑）
    if (diff === 0) return COLORS.textSecondary; // 同じ（グレー）
    return COLORS.error; // 悪化（赤）
  };

  const getDifferenceIcon = (diff: number) => {
    if (diff < 0) return 'trending-down'; // 改善
    if (diff === 0) return 'remove'; // 同じ
    return 'trending-up'; // 悪化
  };

  const getDifferenceText = (diff: number) => {
    if (diff === 0) return 'Even';
    const absDiff = Math.abs(diff);
    const strokeText = absDiff === 1 ? 'stroke' : 'strokes';
    if (diff < 0) return `${absDiff} ${strokeText} better`;
    return `${absDiff} ${strokeText} worse`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.ghostRow}>
        <Text style={styles.ghostIcon}>👻</Text>
        <Text style={styles.ghostLabel}>Ghost:</Text>
        <Text style={styles.ghostScore}>{ghostScore.strokes}</Text>
        <Text style={styles.ghostPar}>
          ({ghostScore.difference >= 0 ? '+' : ''}{ghostScore.difference})
        </Text>
      </View>

      {currentScore !== undefined && comparison && (
        <>
          <View style={styles.comparisonRow}>
            <Ionicons 
              name={getDifferenceIcon(difference)} 
              size={20} 
              color={getDifferenceColor(difference)} 
            />
            <Text style={[
              styles.differenceText,
              { color: getDifferenceColor(difference) }
            ]}>
              {getDifferenceText(difference)}
            </Text>
          </View>

          <View style={styles.cumulativeRow}>
            <Text style={styles.cumulativeLabel}>Total:</Text>
            <Text style={[
              styles.cumulativeValue,
              { color: getDifferenceColor(cumulativeDiff) }
            ]}>
              {cumulativeDiff > 0 ? '+' : ''}{cumulativeDiff}
            </Text>
            <Text style={styles.cumulativeText}>
              vs Ghost
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  ghostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  ghostLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  ghostScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 6,
  },
  ghostPar: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  differenceText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cumulativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
  },
  cumulativeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  cumulativeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  cumulativeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});