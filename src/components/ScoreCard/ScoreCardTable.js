import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { calculateOutScore, calculateInScore, calculateTotalScore } from '../../utils/scoreHelpers';

const ScoreCardTable = ({
  scores,
  holeData,
  onHoleSelect,
  isCompact = false, // 履歴画面用のコンパクト表示
  isReadOnly = false, // 読み取り専用モード
}) => {
  // OUT (1-9H) の計算
  const outTotal = calculateOutScore(scores, holeData);
  
  // IN (10-18H) の計算
  const inTotal = calculateInScore(scores, holeData);
  
  // 総合計の計算
  const grandTotal = calculateTotalScore(scores, holeData);

  // スコア表示
  const getScore = (hole) => {
    const score = scores[`${hole}-0`]?.score;
    return score || '-';
  };

  // パー表示
  const getPar = (hole) => {
    return holeData[hole]?.par || 4;
  };

  // パット数表示
  const getPutts = (hole) => {
    const putts = scores[`${hole}-0`]?.putts;
    return putts || '-';
  };

  // スコアの色を取得
  const getScoreColor = (hole) => {
    const score = scores[`${hole}-0`]?.score;
    const par = holeData[hole]?.par || 4;
    if (!score) return colors.dark;
    
    const diff = score - par;
    if (diff <= -2) return colors.eagle;
    if (diff === -1) return colors.birdie;
    if (diff === 0) return colors.par;
    if (diff === 1) return colors.bogey;
    if (diff === 2) return colors.doubleBogey;
    return colors.tripleBogey;
  };

  // OB表示
  const hasOB = (hole) => {
    return scores[`${hole}-0`]?.ob;
  };

  // フェアウェイキープ表示
  const hasFairway = (hole) => {
    return scores[`${hole}-0`]?.fairway;
  };

  const styles = isCompact ? compactStyles : normalStyles;

  return (
    <View style={styles.tableContainer}>
      {/* OUT (1-9H) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OUT (1-9H)</Text>
        <View style={styles.table}>
          {/* ホール番号行 */}
          <View style={styles.row}>
            <Text style={styles.headerCell}>Hole</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
              <Text key={hole} style={styles.holeCell}>{hole}</Text>
            ))}
            <Text style={styles.totalHeaderCell}>計</Text>
          </View>
          
          {/* パー行 */}
          <View style={styles.row}>
            <Text style={styles.headerCell}>Par</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
              <Text key={hole} style={styles.parCell}>{getPar(hole)}</Text>
            ))}
            <Text style={styles.totalCell}>{outTotal?.parTotal || '-'}</Text>
          </View>
          
          {/* スコア行 */}
          <View style={styles.row}>
            <Text style={styles.headerCell}>Score</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
              isReadOnly ? (
                <View key={hole} style={styles.scoreCellContainer}>
                  <Text style={[
                    styles.scoreCell,
                    { color: getScoreColor(hole) },
                    !scores[`${hole}-0`]?.score && styles.missingCell
                  ]}>
                    {getScore(hole)}
                  </Text>
                  {hasOB(hole) && <Text style={styles.obIndicator}>OB</Text>}
                </View>
              ) : (
                <TouchableOpacity
                  key={hole}
                  onPress={() => onHoleSelect && onHoleSelect(hole)}
                  style={styles.scoreCellContainer}
                >
                  <Text style={[
                    styles.scoreCell,
                    { color: getScoreColor(hole) },
                    !scores[`${hole}-0`]?.score && styles.missingCell
                  ]}>
                    {getScore(hole)}
                  </Text>
                  {hasOB(hole) && <Text style={styles.obIndicator}>OB</Text>}
                </TouchableOpacity>
              )
            ))}
            <Text style={styles.totalCell}>
              {outTotal?.total || '-'}
            </Text>
          </View>

          {/* パット数行 */}
          <View style={styles.rowLast}>
            <Text style={styles.headerCell}>Putt</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
              <Text key={hole} style={styles.puttCell}>
                {getPutts(hole)}
              </Text>
            ))}
            <Text style={styles.totalCell}>
              {outTotal?.puttsTotal || '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* IN (10-18H) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IN (10-18H)</Text>
        <View style={styles.table}>
          {/* ホール番号行 */}
          <View style={styles.row}>
            <Text style={styles.headerCell}>Hole</Text>
            {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
              <Text key={hole} style={styles.holeCell}>{hole}</Text>
            ))}
            <Text style={styles.totalHeaderCell}>計</Text>
          </View>
          
          {/* パー行 */}
          <View style={styles.row}>
            <Text style={styles.headerCell}>Par</Text>
            {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
              <Text key={hole} style={styles.parCell}>{getPar(hole)}</Text>
            ))}
            <Text style={styles.totalCell}>{inTotal?.parTotal || '-'}</Text>
          </View>
          
          {/* スコア行 */}
          <View style={styles.row}>
            <Text style={styles.headerCell}>Score</Text>
            {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
              isReadOnly ? (
                <View key={hole} style={styles.scoreCellContainer}>
                  <Text style={[
                    styles.scoreCell,
                    { color: getScoreColor(hole) },
                    !scores[`${hole}-0`]?.score && styles.missingCell
                  ]}>
                    {getScore(hole)}
                  </Text>
                  {hasOB(hole) && <Text style={styles.obIndicator}>OB</Text>}
                </View>
              ) : (
                <TouchableOpacity
                  key={hole}
                  onPress={() => onHoleSelect && onHoleSelect(hole)}
                  style={styles.scoreCellContainer}
                >
                  <Text style={[
                    styles.scoreCell,
                    { color: getScoreColor(hole) },
                    !scores[`${hole}-0`]?.score && styles.missingCell
                  ]}>
                    {getScore(hole)}
                  </Text>
                  {hasOB(hole) && <Text style={styles.obIndicator}>OB</Text>}
                </TouchableOpacity>
              )
            ))}
            <Text style={styles.totalCell}>
              {inTotal?.total || '-'}
            </Text>
          </View>

          {/* パット数行 */}
          <View style={styles.rowLast}>
            <Text style={styles.headerCell}>Putt</Text>
            {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
              <Text key={hole} style={styles.puttCell}>
                {getPutts(hole)}
              </Text>
            ))}
            <Text style={styles.totalCell}>
              {inTotal?.puttsTotal || '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* 総合計 */}
      {grandTotal && grandTotal.total > 0 && (
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>TOTAL</Text>
          <Text style={styles.grandTotalScore}>
            {grandTotal.total} ({grandTotal.diff >= 0 ? '+' : ''}{grandTotal.diff})
          </Text>
        </View>
      )}
    </View>
  );
};

// 通常サイズのスタイル
const normalStyles = StyleSheet.create({
  tableContainer: {
    padding: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.sm,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  rowLast: {
    flexDirection: 'row',
  },
  headerCell: {
    width: 50,
    padding: spacing.xs,
    backgroundColor: colors.light,
    borderRightWidth: 1,
    borderRightColor: colors.grayLight,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  holeCell: {
    flex: 1,
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: colors.grayLight,
  },
  parCell: {
    flex: 1,
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.sm,
    borderRightWidth: 1,
    borderRightColor: colors.grayLight,
  },
  scoreCellContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCell: {
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  obIndicator: {
    fontSize: 8,
    color: colors.danger,
    marginTop: -4,
  },
  puttCell: {
    flex: 1,
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.sm,
    borderRightWidth: 1,
    borderRightColor: colors.grayLight,
  },
  missingCell: {
    backgroundColor: colors.warning,
    opacity: 0.3,
  },
  totalHeaderCell: {
    width: 40,
    padding: spacing.xs,
    backgroundColor: colors.light,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalCell: {
    width: 40,
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    backgroundColor: colors.light,
  },
  grandTotal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  grandTotalScore: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.dark,
  },
});

// コンパクトサイズのスタイル（履歴画面用）
const compactStyles = StyleSheet.create({
  ...normalStyles,
  tableContainer: {
    padding: spacing.xs,
  },
  section: {
    ...normalStyles.section,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...normalStyles.sectionTitle,
    fontSize: fontSize.base,
  },
  headerCell: {
    ...normalStyles.headerCell,
    width: 40,
    padding: 4,
    fontSize: fontSize.xs,
  },
  holeCell: {
    ...normalStyles.holeCell,
    padding: 4,
    fontSize: fontSize.xs,
  },
  parCell: {
    ...normalStyles.parCell,
    padding: 4,
    fontSize: fontSize.xs,
  },
  scoreCell: {
    ...normalStyles.scoreCell,
    padding: 4,
    fontSize: fontSize.xs,
  },
  obIndicator: {
    fontSize: 6,
    color: colors.danger,
    marginTop: -2,
  },
  puttCell: {
    ...normalStyles.puttCell,
    padding: 4,
    fontSize: fontSize.xs,
  },
  totalHeaderCell: {
    ...normalStyles.totalHeaderCell,
    width: 32,
    padding: 4,
    fontSize: fontSize.xs,
  },
  totalCell: {
    ...normalStyles.totalCell,
    width: 32,
    padding: 4,
    fontSize: fontSize.xs,
  },
  grandTotal: {
    ...normalStyles.grandTotal,
    padding: spacing.sm,
  },
  grandTotalLabel: {
    ...normalStyles.grandTotalLabel,
    fontSize: fontSize.base,
  },
  grandTotalScore: {
    ...normalStyles.grandTotalScore,
    fontSize: fontSize.xl,
  },
});

export default ScoreCardTable;