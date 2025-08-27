import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { calculateOutScore, calculateInScore, calculateTotalScore } from '../../utils/scoreHelpers';

const ScoreCardOverviewScreen = ({
  scores,
  holeData,
  onHoleSelect,
  onContinue,
  onFinish
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>スコアカード確認</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>続ける</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
            <Text style={styles.finishButtonText}>終了する</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
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
                  <TouchableOpacity
                    key={hole}
                    onPress={() => onHoleSelect(hole)}
                    style={styles.scoreCellContainer}
                  >
                    <Text style={[
                      styles.scoreCell,
                      !scores[`${hole}-0`]?.score && styles.missingCell
                    ]}>
                      {getScore(hole)}
                    </Text>
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    key={hole}
                    onPress={() => onHoleSelect(hole)}
                    style={styles.scoreCellContainer}
                  >
                    <Text style={[
                      styles.scoreCell,
                      !scores[`${hole}-0`]?.score && styles.missingCell
                    ]}>
                      {getScore(hole)}
                    </Text>
                  </TouchableOpacity>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  continueButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  finishButton: {
    flex: 1,
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  finishButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
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
  },
  scoreCell: {
    padding: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
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

export default ScoreCardOverviewScreen;