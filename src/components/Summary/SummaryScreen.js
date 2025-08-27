import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { calculateTotalScore, calculateRoundStats, calculateOutScore, calculateInScore } from '../../utils/scoreHelpers';
import { calculateHDCP, updateRecentScores } from '../../utils/hdcpCalculator';
import { loadSettings, updateSetting } from '../../utils/settingsStorage';

const SummaryScreen = ({
  scores,
  holeData,
  players,
  playerNames,
  playerHDCPSettings,
  selectedCourse,
  isReadOnly = false,  // 読み取り専用フラグ（デフォルトはfalse）
  onEditScore,
  onHome,
  onSave,
  onShare
}) => {
  // ラウンド終了時にHDCPを更新（プレイヤー1のみ）
  React.useEffect(() => {
    if (!isReadOnly) {
      updatePlayerHDCP();
    }
  }, []);

  const updatePlayerHDCP = async () => {
    // プレイヤー1のスコアを取得
    const playerTotal = calculateTotalScore(scores, holeData, 0);
    if (!playerTotal || !playerTotal.total) return;

    // コースのパーを計算
    const coursePar = Object.values(holeData).reduce((sum, hole) => sum + (hole?.par || 0), 0);
    if (!coursePar) return;

    // 設定を読み込み
    const settings = await loadSettings();
    const recentScores = settings.profile.stats.recentScores || [];

    // 新しいスコアを追加
    const newScore = {
      score: playerTotal.total,
      par: playerTotal.parTotal || coursePar, // parTotalを優先使用
      course: selectedCourse,
      date: new Date().toISOString().split('T')[0]
    };
    
    console.log('HDCP計算用データ:', newScore);

    // 直近20ラウンドを保持
    const updatedScores = updateRecentScores(recentScores, newScore);
    
    // HDCPを計算
    const hdcp = calculateHDCP(updatedScores);

    // 統計を更新
    await updateSetting('profile.stats.recentScores', updatedScores);
    await updateSetting('profile.stats.hdcp', hdcp);
    await updateSetting('profile.stats.totalRounds', (settings.profile.stats.totalRounds || 0) + 1);
    
    // ベストスコアと平均スコアも更新
    const allScores = updatedScores.map(s => s.score).filter(s => s);
    if (allScores.length > 0) {
      const bestScore = Math.min(...allScores);
      const avgScore = Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length);
      await updateSetting('profile.stats.bestScore', bestScore);
      await updateSetting('profile.stats.averageScore', avgScore);
    }
  };
  // スコアの色を取得する関数
  const getScoreColor = (score, par) => {
    if (!score || !par) return colors.dark;
    const diff = score - par;
    if (diff <= -2) return colors.eagle;
    if (diff === -1) return colors.birdie;
    if (diff === 0) return colors.par;
    if (diff === 1) return colors.bogey;
    if (diff === 2) return colors.doubleBogey;
    return colors.tripleBogey;
  };

  // 各プレイヤーのスコア計算
  const calculatePlayerScores = () => {
    const playerScores = [];
    const actualPlayers = players || [{ name: playerNames[0] }];
    
    for (let i = 0; i < actualPlayers.length; i++) {
      const totalScore = calculateTotalScore(scores, holeData, i);
      const hdcp = playerHDCPSettings?.[i]?.hdcpValue ?? 0;
      // ネットスコアは18ホール全体でHDCPを適用
      const netScore = Math.round(totalScore.total - hdcp);
      
      console.log(`Player ${i + 1} サマリー画面HDCP計算:`, {
        gross: totalScore.total,
        hdcp,
        net: netScore
      });
      
      playerScores.push({
        index: i,
        name: playerNames[i] || `プレイヤー${i + 1}`,
        grossScore: totalScore.total,
        netScore: netScore,
        hdcp: hdcp,
        diff: totalScore.diff,
        netDiff: netScore - totalScore.parTotal
      });
    }
    
    // ネットスコアでソート（昇順）
    playerScores.sort((a, b) => a.netScore - b.netScore);
    
    // 順位を付ける
    playerScores.forEach((player, index) => {
      player.rank = index + 1;
    });
    
    return playerScores;
  };
  
  const playerScores = calculatePlayerScores();
  const winner = playerScores[0];
  
  // プレイヤー1の統計計算
  const stats = calculateRoundStats(scores, holeData);
  
  // OUT/INスコア計算（プレイヤー1のみ表示）
  const outScore = calculateOutScore(scores, holeData);
  const inScore = calculateInScore(scores, holeData);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ラウンド完了！</Text>
        <Text style={styles.course}>{selectedCourse || 'コース名'}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('ja-JP')}</Text>
      </View>

      {/* 順位表 */}
      <View style={styles.rankingSection}>
        <Text style={styles.sectionTitle}>最終順位</Text>
        {playerScores.map((player) => (
          <View key={player.index} style={[
            styles.playerRankCard,
            player.rank === 1 && styles.winnerCard
          ]}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>
                {player.rank === 1 ? '🏆' : player.rank}
              </Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerRankName}>{player.name}</Text>
              {player.hdcp !== null && (
                <Text style={styles.hdcpBadge}>HDCP: {player.hdcp > 0 ? '+' : ''}{player.hdcp}</Text>
              )}
            </View>
            <View style={styles.scoreInfo}>
              <View style={styles.scoreColumn}>
                <Text style={styles.scoreTypeLabel}>グロス</Text>
                <Text style={styles.grossScore}>{player.grossScore}</Text>
                <Text style={styles.scoreDiff}>
                  {player.diff === 0 ? 'E' : player.diff > 0 ? `+${player.diff}` : player.diff}
                </Text>
              </View>
              {player.hdcp !== null && (
                <View style={styles.scoreColumn}>
                  <Text style={styles.scoreTypeLabel}>ネット</Text>
                  <Text style={styles.netScore}>{player.netScore}</Text>
                  <Text style={styles.scoreDiff}>
                    {player.netDiff === 0 ? 'E' : player.netDiff > 0 ? `+${player.netDiff}` : player.netDiff}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* スコアカード表 */}
      <View style={styles.scoreCardSection}>
        <Text style={styles.sectionTitle}>スコアカード</Text>
        <View style={styles.scoreCardTables}>
          {/* OUT (1-9ホール) */}
          <View style={styles.halfTable}>
            <Text style={styles.halfLabel}>OUT</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.holeHeader}>Hole</Text>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => (
                <Text key={h} style={styles.holeNumber}>{h}</Text>
              ))}
              <Text style={styles.totalHeader}>計</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Par</Text>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => (
                <Text key={h} style={styles.parValue}>{holeData[h]?.par || '-'}</Text>
              ))}
              <Text style={styles.totalValue}>{outScore.parTotal || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Score</Text>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => (
                <Text key={h} style={[
                  styles.scoreValue,
                  scores[`${h}-0`]?.score && {
                    color: getScoreColor(scores[`${h}-0`].score, holeData[h]?.par)
                  }
                ]}>
                  {scores[`${h}-0`]?.score || '-'}
                </Text>
              ))}
              <Text style={styles.totalValue}>{outScore.total || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Putt</Text>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => (
                <Text key={h} style={styles.puttValue}>
                  {scores[`${h}-0`]?.putts || '-'}
                </Text>
              ))}
              <Text style={styles.totalValue}>{outScore.puttsTotal || '-'}</Text>
            </View>
          </View>

          {/* IN (10-18ホール) */}
          <View style={styles.halfTable}>
            <Text style={styles.halfLabel}>IN</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.holeHeader}>Hole</Text>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                <Text key={h} style={styles.holeNumber}>{h}</Text>
              ))}
              <Text style={styles.totalHeader}>計</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Par</Text>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                <Text key={h} style={styles.parValue}>{holeData[h]?.par || '-'}</Text>
              ))}
              <Text style={styles.totalValue}>{inScore.parTotal || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Score</Text>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                <Text key={h} style={[
                  styles.scoreValue,
                  scores[`${h}-0`]?.score && {
                    color: getScoreColor(scores[`${h}-0`].score, holeData[h]?.par)
                  }
                ]}>
                  {scores[`${h}-0`]?.score || '-'}
                </Text>
              ))}
              <Text style={styles.totalValue}>{inScore.total || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Putt</Text>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                <Text key={h} style={styles.puttValue}>
                  {scores[`${h}-0`]?.putts || '-'}
                </Text>
              ))}
              <Text style={styles.totalValue}>{inScore.puttsTotal || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* スコア分布 */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>スコア分布</Text>
        <View style={styles.distributionGrid}>
          {stats.eagles > 0 && (
            <View style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>🦅 イーグル</Text>
              <Text style={styles.distributionValue}>{stats.eagles}</Text>
            </View>
          )}
          {stats.birdies > 0 && (
            <View style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>🐦 バーディー</Text>
              <Text style={styles.distributionValue}>{stats.birdies}</Text>
            </View>
          )}
          <View style={styles.distributionItem}>
            <Text style={styles.distributionLabel}>⛳ パー</Text>
            <Text style={styles.distributionValue}>{stats.pars}</Text>
          </View>
          <View style={styles.distributionItem}>
            <Text style={styles.distributionLabel}>ボギー</Text>
            <Text style={styles.distributionValue}>{stats.bogeys}</Text>
          </View>
          {stats.doubleBogeys > 0 && (
            <View style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>ダブルボギー</Text>
              <Text style={styles.distributionValue}>{stats.doubleBogeys}</Text>
            </View>
          )}
          {stats.others > 0 && (
            <View style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>その他</Text>
              <Text style={styles.distributionValue}>{stats.others}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ラウンド統計 */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>ラウンド統計</Text>
        <View style={styles.statsList}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>平均パット数</Text>
            <Text style={styles.statValue}>{stats.averagePutts}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>合計パット数</Text>
            <Text style={styles.statValue}>{stats.totalPutts}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>フェアウェイキープ率</Text>
            <Text style={styles.statValue}>{stats.fairwayPercentage}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>OB数</Text>
            <Text style={styles.statValue}>{stats.totalOB}</Text>
          </View>
        </View>
      </View>

      {/* アクションボタン */}
      <View style={styles.actions}>
        {!isReadOnly && (
          <>
            <TouchableOpacity style={styles.editButton} onPress={onEditScore}>
              <Text style={styles.editButtonText}>✏️ スコアを編集</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>💾 履歴に保存</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>📤 共有する</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.homeButton} onPress={onHome}>
          <Text style={styles.homeButtonText}>
            {isReadOnly ? '🔙 履歴へ戻る' : '🏠 ホームへ戻る（保存しない）'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  course: {
    fontSize: fontSize.lg,
    color: colors.white,
    opacity: 0.9,
  },
  date: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  rankingSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
  },
  winnerCard: {
    backgroundColor: '#FFF8DC',
    borderWidth: 2,
    borderColor: colors.warning,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  playerInfo: {
    flex: 1,
  },
  playerRankName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.dark,
  },
  hdcpBadge: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  scoreInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoreColumn: {
    alignItems: 'center',
  },
  scoreTypeLabel: {
    fontSize: fontSize.xs,
    color: colors.gray,
  },
  grossScore: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  netScore: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreDiff: {
    fontSize: fontSize.sm,
    color: colors.gray,
    opacity: 0.9,
  },
  playerName: {
    fontSize: fontSize.lg,
    color: colors.white,
    fontWeight: '600',
    opacity: 0.8,
  },
  scoreCardSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  scoreCardTables: {
    marginTop: spacing.sm,
  },
  halfTable: {
    marginBottom: spacing.lg,
  },
  halfLabel: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.light,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  holeHeader: {
    width: 45,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.dark,
  },
  holeNumber: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.dark,
  },
  totalHeader: {
    width: 35,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.primary,
  },
  rowLabel: {
    width: 45,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.dark,
  },
  parValue: {
    flex: 1,
    fontSize: fontSize.sm,
    textAlign: 'center',
    color: colors.medium,
  },
  scoreValue: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.dark,
  },
  puttValue: {
    flex: 1,
    fontSize: fontSize.sm,
    textAlign: 'center',
    color: colors.medium,
  },
  totalValue: {
    width: 35,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.primary,
  },
  statsSection: {
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
  distributionGrid: {
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
  statsList: {
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.white,
  },
  statLabel: {
    fontSize: fontSize.base,
    color: colors.dark,
  },
  statValue: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    padding: spacing.md,
  },
  editButton: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveButtonText: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  shareButtonText: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: colors.gray,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  homeButtonText: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default SummaryScreen;