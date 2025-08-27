import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import ScoreButtons from '../ScoreInput/ScoreButtons';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { useSettings } from '../../hooks/useSettings';

const ScoreCardScreen = (props) => {
  const {
    currentHole,
    holeData,
    scores,
    players,
    playerNames,
    playerHDCPSettings,
    ghostMode,
    ghostData,
    isGhostActive,
    startHole = 1,  // スタートホールを受け取る
    totalHoles = 18,  // 総ホール数を受け取る（9または18）
    playableHoles,  // 27ホール対応用
    onHoleChange,
    onScoreInput,
    onPuttInput,
    onOBToggle,
    onFairwayToggle,
    onShotTypeUpdate,
    onExit,
    onGenerateHoleData
  } = props;
  
  // 設定を取得
  const { settings } = useSettings();
  // ホールデータが無ければ生成を要求
  React.useEffect(() => {
    if (!holeData[currentHole] && onGenerateHoleData) {
      onGenerateHoleData(currentHole);
    }
  }, [currentHole, holeData, onGenerateHoleData]);

  const holePar = holeData[currentHole]?.par || 4;
  const holeDistance = holeData[currentHole]?.distance || 250;

  // プレイしたホール数を計算
  const calculatePlayedHoles = () => {
    // playableHolesが設定されている場合（27ホールコース）
    if (playableHoles && playableHoles.length > 0) {
      const currentIndex = playableHoles.indexOf(currentHole);
      return currentIndex >= 0 ? currentIndex + 1 : 1;
    }
    
    // 通常のコース
    if (startHole === 1) {
      return currentHole;
    } else {
      // スタートホールが1以外の場合
      if (currentHole >= startHole) {
        return currentHole - startHole + 1;
      } else {
        // 最終ホールを超えて1番に戻った場合
        return (totalHoles - startHole + 1) + currentHole;
      }
    }
  };

  const playedHoles = calculatePlayedHoles();
  const actualTotalHoles = playableHoles && playableHoles.length > 0 ? playableHoles.length : totalHoles;
  const isLastHole = playedHoles === actualTotalHoles;

  // ゴーストとの差分計算
  const calculateGhostDiff = () => {
    if (!isGhostActive || !ghostData || !ghostData.scores) {
      return null;
    }

    let myTotal = 0;
    let ghostTotal = 0;
    let holesCompared = 0;
    
    // スタートホールから現在のホールまでのスコアを集計
    let hole = startHole;
    for (let i = 0; i < playedHoles; i++) {
      // 自分のスコア（プレイヤー1のみ）
      const myScore = scores[`${hole}-0`]?.score;
      if (myScore) {
        myTotal += myScore;
      }
      
      // ゴーストのスコア
      const ghostScore = ghostData.scores[`${hole}-0`]?.score;
      if (ghostScore && myScore) {
        ghostTotal += ghostScore;
        holesCompared++;
      }
      
      // 次のホールへ（18→1へ循環）
      hole = hole === 18 ? 1 : hole + 1;
    }
    
    // 現在のホールのゴーストスコア
    const currentGhostScore = ghostData.scores[`${currentHole}-0`]?.score;
    const currentGhostPar = holeData[currentHole]?.par || 4;
    const currentGhostDiff = currentGhostScore ? currentGhostScore - currentGhostPar : 0;
    
    // 現在のホールのゴースト詳細データ
    const currentGhostDetails = ghostData.scores[`${currentHole}-0`] || {};
    
    return {
      currentHoleScore: currentGhostScore,
      currentHoleDiff: currentGhostDiff,
      currentHoleDetails: currentGhostDetails,
      myTotal,
      ghostTotal,
      totalDiff: holesCompared > 0 ? myTotal - ghostTotal : null,
      holesCompared
    };
  };

  const ghostDiff = calculateGhostDiff();

  // 各プレイヤーの合計スコア計算（HDCP対応）
  const calculatePlayerTotal = (playerIndex) => {
    let total = 0;
    let parTotal = 0;
    let holesPlayed = 0;
    
    for (let h = 1; h <= currentHole; h++) {
      const score = scores[`${h}-${playerIndex}`]?.score;
      if (score) {
        total += score;
        parTotal += holeData[h]?.par || 4;
        holesPlayed++;
      }
    }
    
    // HDCPを取得（nullの場合は0として扱う）
    const hdcp = playerHDCPSettings?.[playerIndex]?.hdcpValue ?? 0;
    
    // ネットスコアを計算（HDCPを18ホールで配分）
    // HDCPは18ホール全体の値なので、プレイしたホール数に応じて配分
    const hdcpPerHole = hdcp / 18;
    const appliedHdcp = hdcpPerHole * holesPlayed;
    const roundedAppliedHdcp = Math.round(appliedHdcp * 10) / 10; // 小数点第1位まで
    const netTotal = Math.round(total - roundedAppliedHdcp);
    
    console.log(`Player ${playerIndex + 1} HDCP計算:`, {
      hdcp,
      holesPlayed,
      hdcpPerHole,
      appliedHdcp: roundedAppliedHdcp,
      total,
      netTotal
    });
    
    return { 
      total, // グロススコア
      netTotal, // ネットスコア
      parTotal, 
      diff: total - parTotal,
      netDiff: netTotal - parTotal,
      hdcp: hdcp,
      appliedHdcp: roundedAppliedHdcp
    };
  };

  // プログレス計算
  const calculateProgress = (playerIndex) => {
    let completed = 0;
    for (let h = 1; h <= 18; h++) {
      if (scores[`${h}-${playerIndex}`]?.score !== undefined) completed++;
    }
    return {
      completed,
      percent: Math.round((completed / 18) * 100),
      text: `${completed}/18 ホール完了`
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.holeTitle}>Hole {currentHole} - Par {holePar} - {holeDistance}m</Text>
        <TouchableOpacity onPress={onExit}>
          <Text style={styles.exitText}>✕ 終了</Text>
        </TouchableOpacity>
      </View>

      {isGhostActive && ghostDiff && (
        <View style={styles.ghostCard}>
          <Text style={styles.ghostTitle}>
            👻 ゴースト: {ghostDiff.currentHoleScore || '-'} 
            {ghostDiff.currentHoleDiff !== 0 && 
              ` (${ghostDiff.currentHoleDiff > 0 ? '+' : ''}${ghostDiff.currentHoleDiff})`
            }
            {ghostDiff.currentHoleDetails.shotType && 
              ` [${ghostDiff.currentHoleDetails.shotType}]`
            }
          </Text>
          {ghostDiff.currentHoleDetails && (
            <View style={styles.ghostDetailsRow}>
              {ghostDiff.currentHoleDetails.ob && (
                <Text style={styles.ghostDetailItem}>OB</Text>
              )}
              {ghostDiff.currentHoleDetails.fairway && (
                <Text style={styles.ghostDetailItem}>FWキープ</Text>
              )}
              {ghostDiff.currentHoleDetails.putts && (
                <Text style={styles.ghostDetailItem}>
                  パット: {ghostDiff.currentHoleDetails.putts}
                </Text>
              )}
            </View>
          )}
          {ghostDiff.totalDiff !== null && (
            <>
              <Text style={[
                styles.ghostDiff,
                { color: ghostDiff.totalDiff < 0 ? colors.success : 
                         ghostDiff.totalDiff > 0 ? colors.danger : colors.warning }
              ]}>
                {ghostDiff.totalDiff < 0 ? 
                  `📉 ${Math.abs(ghostDiff.totalDiff)}打リード中` :
                  ghostDiff.totalDiff > 0 ?
                  `📈 ${ghostDiff.totalDiff}打ビハインド` :
                  `⚖️ 同スコア`
                }
              </Text>
              <Text style={styles.ghostTotal}>
                累計: あなた {ghostDiff.myTotal} vs ゴースト {ghostDiff.ghostTotal}
              </Text>
            </>
          )}
          {ghostDiff.holesCompared === 0 && (
            <Text style={styles.ghostInfo}>
              このホールのスコアを入力すると比較が始まります
            </Text>
          )}
        </View>
      )}

      <ScrollView style={styles.scoreInputContainer}>
        {players.map((player, index) => {
          const scoreData = scores[`${currentHole}-${index}`] || {};
          const playerTotal = calculatePlayerTotal(index);
          const progress = calculateProgress(index);

          return (
            <ScoreButtons
              key={index}
              playerName={playerNames[index] || `${index + 1}`}
              currentScore={scoreData.score || null}
              par={holePar}
              holeNumber={currentHole}
              onScoreUpdate={(score) => onScoreInput(index, score)}
              showParButton={true}
              totalScore={playerTotal.total || null}
              totalDiff={playerTotal.diff}
              netTotal={playerTotal.netTotal || null}
              netDiff={playerTotal.netDiff}
              hdcp={playerTotal.hdcp}
              appliedHdcp={playerTotal.appliedHdcp}
              progressText={index === 0 ? progress.text : null}
              progressPercent={index === 0 ? progress.percent : null}
              showDetails={index === 0}
              putts={scoreData.putts}
              ob={scoreData.ob || false}
              fairway={scoreData.fairway || false}
              shotType={scoreData.shotType || null}
              onPuttsUpdate={(putts) => onPuttInput(index, putts)}
              onOBToggle={() => onOBToggle(index)}
              onFairwayToggle={() => onFairwayToggle(index)}
              onShotTypeUpdate={(shotType) => onShotTypeUpdate(index, shotType)}
              detailedStatsSettings={settings.app.detailedStats}
            />
          );
        })}
      </ScrollView>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, playedHoles === 1 && styles.navButtonDisabled]}
          onPress={() => {
            if (playedHoles > 1) {
              // 前のホールへ移動
              const prevHole = currentHole === 1 ? totalHoles : currentHole - 1;
              onHoleChange(prevHole);
            }
          }}
          disabled={playedHoles === 1}
        >
          <Text style={styles.navButtonText}>← 前のホール</Text>
        </TouchableOpacity>

        <View style={styles.holeIndicator}>
          <Text style={styles.holeIndicatorText}>
            {playableHoles && playableHoles.length > 0 
              ? `${playedHoles}/18` // 27ホールでも常に18ホールプレイ
              : `${currentHole}/${totalHoles}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, isLastHole && styles.navButtonComplete]}
          onPress={() => {
            if (!isLastHole) {
              // 次のホールへ移動（最終ホール→1へ循環）
              const nextHole = currentHole === totalHoles ? 1 : currentHole + 1;
              onHoleChange(nextHole);
            } else {
              // 全ホール完了時に終了
              onExit();
            }
          }}
        >
          <Text style={styles.navButtonText}>
            {isLastHole ? '終了' : '次のホール →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: spacing.md,
  },
  holeTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  exitText: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: 'bold',
  },
  ghostCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  ghostTitle: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.dark,
  },
  ghostDiff: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  ghostTotal: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  ghostInfo: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  ghostDetailsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  ghostDetailItem: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginTop: spacing.xs / 2,
    fontSize: fontSize.xs,
    color: colors.dark,
  },
  scoreInputContainer: {
    flex: 1,
    padding: spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  navButton: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  navButtonDisabled: {
    backgroundColor: colors.grayLight,
    opacity: 0.5,
  },
  navButtonComplete: {
    backgroundColor: colors.success,
  },
  navButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  holeIndicator: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    minWidth: 60,
    alignItems: 'center',
  },
  holeIndicatorText: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.dark,
  },
});

export default ScoreCardScreen;