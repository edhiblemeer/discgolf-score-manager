import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';

const ScoreButtons = ({ 
  currentScore, 
  par = 4, 
  onScoreUpdate,
  showParButton = true,
  playerName = 'プレイヤー',
  holeNumber = 1,
  totalScore = null,
  totalDiff = null,
  netTotal = null,
  netDiff = null,
  hdcp = null,
  appliedHdcp = null,
  progressText = null,
  progressPercent = null,
  showDetails = false,
  putts = null,
  ob = false,
  fairway = false,
  shotType = null,
  onPuttsUpdate,
  onOBToggle,
  onFairwayToggle,
  onShotTypeUpdate,
  // 設定による表示制御
  detailedStatsSettings = {
    shotType: true,
    putts: true,
    ob: true,
    fairway: true
  }
}) => {
  const handleIncrement = () => {
    if (currentScore === null) {
      // 未入力の場合はパー+1から開始
      onScoreUpdate(par + 1);
    } else if (currentScore < 15) {
      onScoreUpdate(currentScore + 1);
    }
  };

  const handleDecrement = () => {
    if (currentScore === null) {
      // 未入力の場合はパー-1から開始（ただし最小値は1）
      onScoreUpdate(Math.max(1, par - 1));
    } else if (currentScore > 1) {
      onScoreUpdate(currentScore - 1);
    }
  };

  const handleParPress = () => {
    onScoreUpdate(par);
  };

  const getScoreDisplay = () => {
    if (currentScore === null) return '-';
    return currentScore.toString();
  };

  const getScoreColor = () => {
    if (!currentScore || !par) return colors.dark;
    
    const diff = currentScore - par;
    if (diff <= -2) return colors.eagle;
    if (diff === -1) return colors.birdie;
    if (diff === 0) return colors.par;
    if (diff === 1) return colors.bogey;
    if (diff === 2) return colors.doubleBogey;
    return colors.tripleBogey;
  };

  const getScoreLabel = () => {
    if (!currentScore) return '';
    const diff = currentScore - par;
    if (currentScore === 1) return '⭐ ACE!';
    if (diff === -3) return '🦅 アルバトロス';
    if (diff === -2) return '🦅 イーグル';
    if (diff === -1) return '🐦 バーディー';
    if (diff === 0) return '⛳ パー';
    if (diff === 1) return 'ボギー';
    if (diff === 2) return 'ダブルボギー';
    if (diff === 3) return 'トリプルボギー';
    if (diff >= 4) return `+${diff}`;
    return '';
  };

  const getDiffDisplay = () => {
    if (!currentScore) return 'PAR';
    const diff = currentScore - par;
    if (diff === 0) return 'PAR';
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.playerName}>{playerName}</Text>
      
      <View style={styles.scoreContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleDecrement}
          disabled={currentScore !== null && currentScore <= 1}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreText, { color: getScoreColor() }]}>
            {getScoreDisplay()}
          </Text>
          <Text style={styles.scoreLabel}>{getScoreLabel()}</Text>
          <Text style={styles.scoreDiff}>{getDiffDisplay()}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleIncrement}
          disabled={currentScore >= 15}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      {showParButton && (
        <TouchableOpacity 
          style={[
            styles.parButton,
            currentScore === par && styles.selectedParButton
          ]} 
          onPress={handleParPress}
        >
          <Text style={[
            styles.parButtonText,
            currentScore === par && styles.selectedParButtonText
          ]}>
            ⛳ パー記録
          </Text>
        </TouchableOpacity>
      )}

      {/* 合計スコア表示（グロス/ネット） */}
      {totalScore !== null && (
        <View style={styles.totalScoreContainer}>
          <View style={styles.scoreRow}>
            {/* グロススコア */}
            <View style={styles.totalScoreBox}>
              <Text style={styles.totalScoreLabel}>グロス</Text>
              <Text style={styles.totalScoreNumber}>{totalScore || '-'}</Text>
              {totalDiff !== null && (
                <Text style={styles.totalScoreDiff}>
                  {totalDiff === 0 ? 'E' : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`}
                </Text>
              )}
            </View>
            
            {/* ネットスコア（HDCPが設定されている場合表示） */}
            {hdcp !== null && netTotal !== null && (
              <View style={styles.totalScoreBox}>
                <Text style={styles.totalScoreLabel}>ネット</Text>
                <Text style={styles.totalScoreNumber}>{netTotal || '-'}</Text>
                {netDiff !== null && (
                  <Text style={styles.totalScoreDiff}>
                    {netDiff === 0 ? 'E' : netDiff > 0 ? `+${netDiff}` : `${netDiff}`}
                  </Text>
                )}
                {appliedHdcp !== null && (
                  <Text style={styles.hdcpInfo}>HDCP: {appliedHdcp > 0 ? `-${appliedHdcp}` : appliedHdcp}</Text>
                )}
              </View>
            )}
          </View>
          
          {progressText && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>{progressText}</Text>
              {progressPercent !== null && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* 詳細入力 (プレイヤー1のみ) */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          {/* パット数 - 設定で制御 */}
          {detailedStatsSettings.putts && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>パット数:</Text>
              <View style={styles.puttButtons}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.puttButton,
                      putts === num && styles.selectedPuttButton
                    ]}
                    onPress={() => onPuttsUpdate && onPuttsUpdate(num)}
                  >
                    <Text style={[
                      styles.puttButtonText,
                      putts === num && styles.selectedPuttButtonText
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            {/* OB - 設定で制御 */}
            {detailedStatsSettings.ob && (
              <TouchableOpacity
                style={[styles.detailToggle, ob && styles.selectedDetailToggle]}
                onPress={onOBToggle}
              >
                <Text style={[styles.detailToggleText, ob && styles.selectedDetailToggleText]}>
                  OB
                </Text>
              </TouchableOpacity>
            )}

            {/* フェアウェイキープ - 設定で制御 */}
            {detailedStatsSettings.fairway && (
              <TouchableOpacity
                style={[styles.detailToggle, fairway && styles.selectedDetailToggle]}
                onPress={onFairwayToggle}
              >
                <Text style={[styles.detailToggleText, fairway && styles.selectedDetailToggleText]}>
                  フェアウェイキープ
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ショット種類 - 設定で制御 */}
          {detailedStatsSettings.shotType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>投げ方:</Text>
              <View style={styles.shotTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.shotTypeButton,
                    shotType === 'FH' && styles.selectedShotTypeButton
                  ]}
                  onPress={() => onShotTypeUpdate && onShotTypeUpdate('FH')}
                >
                  <Text style={[
                    styles.shotTypeButtonText,
                    shotType === 'FH' && styles.selectedShotTypeButtonText
                  ]}>
                    FH
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shotTypeButton,
                    shotType === 'BH' && styles.selectedShotTypeButton
                  ]}
                  onPress={() => onShotTypeUpdate && onShotTypeUpdate('BH')}
                >
                  <Text style={[
                    styles.shotTypeButtonText,
                    shotType === 'BH' && styles.selectedShotTypeButtonText
                  ]}>
                    BH
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.sm,
  },
  playerName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.xxl,
    color: colors.white,
    fontWeight: 'bold',
  },
  scoreDisplay: {
    minWidth: 120,
    minHeight: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grayLight,
    marginHorizontal: 30,
    padding: spacing.sm,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: fontSize.xs,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  scoreDiff: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.dark,
  },
  parButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.round,
    marginTop: spacing.sm,
    borderWidth: 2,
    borderColor: colors.grayLight,
  },
  selectedParButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  parButtonText: {
    color: colors.dark,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  selectedParButtonText: {
    color: colors.white,
  },
  totalScoreContainer: {
    marginTop: spacing.md,
    width: '100%',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  totalScoreBox: {
    flex: 1,
    backgroundColor: colors.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  totalScoreLabel: {
    fontSize: fontSize.sm,
    color: colors.gray,
  },
  totalScoreNumber: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  totalScoreDiff: {
    fontSize: fontSize.md,
    color: colors.gray,
  },
  hdcpInfo: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  progressInfo: {
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  detailsContainer: {
    marginTop: spacing.md,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.base,
    color: colors.dark,
    marginRight: spacing.sm,
  },
  puttButtons: {
    flexDirection: 'row',
  },
  puttButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  selectedPuttButton: {
    backgroundColor: colors.primary,
  },
  puttButtonText: {
    fontSize: fontSize.base,
    color: colors.dark,
    fontWeight: 'bold',
  },
  selectedPuttButtonText: {
    color: colors.white,
  },
  detailToggle: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  selectedDetailToggle: {
    backgroundColor: colors.success,
  },
  detailToggleText: {
    fontSize: fontSize.sm,
    color: colors.dark,
    fontWeight: '600',
  },
  selectedDetailToggleText: {
    color: colors.white,
  },
  shotTypeButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  shotTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  selectedShotTypeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shotTypeButtonText: {
    fontSize: fontSize.base,
    color: colors.dark,
    fontWeight: 'bold',
  },
  selectedShotTypeButtonText: {
    color: colors.white,
  },
});

export default ScoreButtons;