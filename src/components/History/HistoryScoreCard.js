import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import ScoreCardTable from '../ScoreCard/ScoreCardTable';

const HistoryScoreCard = ({ scores, holeData, playerNames, onViewSummary }) => {
  return (
    <View style={styles.container}>
      {/* ScoreCardTableをコンパクトモード、読み取り専用で表示 */}
      <ScoreCardTable
        scores={scores}
        holeData={holeData}
        isCompact={true}
        isReadOnly={true}
      />

      {/* サマリーを見るボタン */}
      <TouchableOpacity style={styles.summaryButton} onPress={onViewSummary}>
        <Text style={styles.summaryButtonText}>📊 サマリーを見る</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  summaryButton: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  summaryButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
});

export default HistoryScoreCard;