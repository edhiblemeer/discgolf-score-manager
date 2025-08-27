import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  RefreshControl
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { useGameContext } from '../../contexts/GameContext';

const StatisticsScreen = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { getHistory } = useGameContext();

  // 履歴データを読み込んで統計を計算
  const calculateStatistics = useCallback(async () => {
    try {
      const data = await getHistory();
      setHistory(data);
      
      if (data.length === 0) {
        setStats(null);
        return;
      }

      // 統計計算
      let totalRounds = data.length;
      let totalScore = 0;
      let bestScore = Infinity;
      let worstScore = -Infinity;
      let totalOB = 0;
      let totalFairwayHits = 0;
      let totalFairwayAttempts = 0;
      let totalPutts = 0;
      let totalHolesPlayed = 0;
      
      // スコア分布
      let eagles = 0;
      let birdies = 0;
      let pars = 0;
      let bogeys = 0;
      let doubleBogeys = 0;
      let others = 0;

      data.forEach(round => {
        // 総スコア
        if (round.totalScore?.total) {
          totalScore += round.totalScore.total;
          bestScore = Math.min(bestScore, round.totalScore.total);
          worstScore = Math.max(worstScore, round.totalScore.total);
        }

        // 統計データ
        if (round.stats) {
          totalOB += round.stats.totalOB || 0;
          totalPutts += round.stats.totalPutts || 0;
          totalHolesPlayed += round.stats.holesPlayed || 0;
          
          // フェアウェイキープ
          const fairwayHits = Math.round((round.stats.fairwayPercentage || 0) * (round.stats.holesPlayed || 0) / 100);
          totalFairwayHits += fairwayHits;
          totalFairwayAttempts += round.stats.holesPlayed || 0;
        }

        // スコア分布を集計
        if (round.scores) {
          Object.values(round.scores).forEach(scoreData => {
            if (scoreData?.score && round.holeData) {
              const holeNumber = parseInt(Object.keys(round.scores).find(key => round.scores[key] === scoreData).split('-')[0]);
              const par = round.holeData[holeNumber]?.par || 4;
              const diff = scoreData.score - par;
              
              if (diff <= -2) eagles++;
              else if (diff === -1) birdies++;
              else if (diff === 0) pars++;
              else if (diff === 1) bogeys++;
              else if (diff === 2) doubleBogeys++;
              else others++;
            }
          });
        }
      });

      setStats({
        totalRounds,
        averageScore: totalRounds > 0 ? (totalScore / totalRounds).toFixed(1) : 0,
        bestScore: bestScore === Infinity ? '-' : bestScore,
        worstScore: worstScore === -Infinity ? '-' : worstScore,
        totalOB,
        averageOB: totalRounds > 0 ? (totalOB / totalRounds).toFixed(1) : 0,
        fairwayPercentage: totalFairwayAttempts > 0 ? Math.round((totalFairwayHits / totalFairwayAttempts) * 100) : 0,
        averagePutts: totalHolesPlayed > 0 ? (totalPutts / totalHolesPlayed).toFixed(1) : 0,
        totalHolesPlayed,
        scoreDistribution: {
          eagles,
          birdies,
          pars,
          bogeys,
          doubleBogeys,
          others
        }
      });
    } catch (error) {
      console.error('統計の計算に失敗:', error);
      setStats(null);
    }
  }, [getHistory]);

  // 初回読み込み
  useEffect(() => {
    calculateStatistics();
  }, [calculateStatistics]);

  // プルトゥリフレッシュ
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await calculateStatistics();
    setRefreshing(false);
  }, [calculateStatistics]);

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>統計情報</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyText}>データがありません</Text>
          <Text style={styles.emptySubText}>
            ラウンドを完了すると統計が表示されます
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>統計情報</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 概要 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>概要</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>総ラウンド数</Text>
              <Text style={styles.overviewValue}>{stats.totalRounds}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>総ホール数</Text>
              <Text style={styles.overviewValue}>{stats.totalHolesPlayed}</Text>
            </View>
          </View>
        </View>

        {/* スコア統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>スコア統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>平均スコア</Text>
              <Text style={styles.statValue}>{stats.averageScore}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ベストスコア</Text>
              <Text style={[styles.statValue, styles.bestScore]}>{stats.bestScore}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ワーストスコア</Text>
              <Text style={[styles.statValue, styles.worstScore]}>{stats.worstScore}</Text>
            </View>
          </View>
        </View>

        {/* プレイ統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プレイ統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>FWキープ率</Text>
              <Text style={styles.statValue}>{stats.fairwayPercentage}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>平均パット</Text>
              <Text style={styles.statValue}>{stats.averagePutts}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>平均OB数</Text>
              <Text style={styles.statValue}>{stats.averageOB}</Text>
            </View>
          </View>
        </View>

        {/* スコア分布 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>スコア分布</Text>
          <View style={styles.distributionContainer}>
            {stats.scoreDistribution.eagles > 0 && (
              <View style={styles.distributionItem}>
                <Text style={styles.distributionLabel}>🦅 イーグル以下</Text>
                <Text style={styles.distributionValue}>{stats.scoreDistribution.eagles}</Text>
              </View>
            )}
            {stats.scoreDistribution.birdies > 0 && (
              <View style={styles.distributionItem}>
                <Text style={styles.distributionLabel}>🐦 バーディー</Text>
                <Text style={styles.distributionValue}>{stats.scoreDistribution.birdies}</Text>
              </View>
            )}
            <View style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>⛳ パー</Text>
              <Text style={styles.distributionValue}>{stats.scoreDistribution.pars}</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>ボギー</Text>
              <Text style={styles.distributionValue}>{stats.scoreDistribution.bogeys}</Text>
            </View>
            {stats.scoreDistribution.doubleBogeys > 0 && (
              <View style={styles.distributionItem}>
                <Text style={styles.distributionLabel}>ダブルボギー</Text>
                <Text style={styles.distributionValue}>{stats.scoreDistribution.doubleBogeys}</Text>
              </View>
            )}
            {stats.scoreDistribution.others > 0 && (
              <View style={styles.distributionItem}>
                <Text style={styles.distributionLabel}>その他</Text>
                <Text style={styles.distributionValue}>{stats.scoreDistribution.others}</Text>
              </View>
            )}
          </View>
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
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  emptySubText: {
    fontSize: fontSize.base,
    color: colors.gray,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  overviewLabel: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  overviewValue: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  bestScore: {
    color: colors.success,
  },
  worstScore: {
    color: colors.danger,
  },
  distributionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  distributionItem: {
    width: '48%',
    backgroundColor: colors.light,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionLabel: {
    fontSize: fontSize.base,
    color: colors.dark,
  },
  distributionValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default StatisticsScreen;