import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PlayStackScreenProps } from '@/navigation/types';
import { Player, Course, Score } from '@/types/models';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateScore, setCurrentHole } from '@/store/gameSlice';
import { addComparison, loadGhostData } from '@/store/ghostSlice';
import { courseService } from '@/services/courseService';
import { databaseManager } from '@/database/helpers';
import { ghostService } from '@/services/ghostService';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import GhostModeSelector from '@/components/ghost/GhostModeSelector';
import GhostScoreDisplay from '@/components/ghost/GhostScoreDisplay';

type Props = PlayStackScreenProps<'ScoreCard'>;

interface HoleScore {
  playerId: string;
  score: number;
  putts: number;
  obCount: number;
  fairwayHit: boolean;
}

export default function ScoreCardScreen({ navigation, route }: Props) {
  const { courseId, players } = route.params;
  const dispatch = useAppDispatch();
  const { currentHole } = useAppSelector(state => state.game);
  const { inputMode } = useAppSelector(state => state.settings);
  const { enabled: ghostEnabled, ghostData } = useAppSelector(state => state.ghost);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>(players[0].id);
  const [holeScores, setHoleScores] = useState<Map<string, HoleScore>>(new Map());
  const [currentPar, setCurrentPar] = useState(3);
  
  useEffect(() => {
    loadCourse();
    initializeScores();
    // ゴーストデータを読み込む（メインプレイヤーのみ）
    if (players.length > 0) {
      dispatch(loadGhostData({ 
        courseId, 
        playerId: players[0].id, 
        type: 'recent' 
      }));
    }
  }, []);

  useEffect(() => {
    // 現在のホールのPARを更新
    if (course && course.holes.length >= currentHole) {
      setCurrentPar(course.holes[currentHole - 1].par);
    }
  }, [currentHole, course]);

  const loadCourse = async () => {
    try {
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
      if (courseData && courseData.holes.length > 0) {
        setCurrentPar(courseData.holes[0].par);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      Alert.alert('Error', 'Failed to load course data');
    }
  };

  const initializeScores = () => {
    const initialScores = new Map<string, HoleScore>();
    players.forEach(player => {
      initialScores.set(player.id, {
        playerId: player.id,
        score: currentPar,
        putts: 2,
        obCount: 0,
        fairwayHit: true,
      });
    });
    setHoleScores(initialScores);
  };

  const handleScoreChange = (playerId: string, delta: number) => {
    const current = holeScores.get(playerId);
    if (!current) return;

    const newScore = inputMode === 'relative' 
      ? currentPar + delta 
      : delta;

    const updatedScore = {
      ...current,
      score: Math.max(1, Math.min(9, newScore)),
    };

    const newScores = new Map(holeScores);
    newScores.set(playerId, updatedScore);
    setHoleScores(newScores);

    // ゴーストモードが有効でメインプレイヤーの場合、比較を更新
    if (ghostEnabled && ghostData && playerId === players[0].id) {
      const ghostScore = ghostData.scores.find(s => s.holeNumber === currentHole);
      if (ghostScore) {
        dispatch(addComparison({
          holeNumber: currentHole,
          currentScore: updatedScore.score,
          ghostScore: ghostScore.strokes,
          difference: updatedScore.score - ghostScore.strokes,
          cumulativeDifference: 0, // sliceで再計算される
        }));
      }
    }
  };

  const handlePuttsChange = (playerId: string, putts: number) => {
    const current = holeScores.get(playerId);
    if (!current) return;

    const updatedScore = {
      ...current,
      putts: Math.max(0, Math.min(9, putts)),
    };

    const newScores = new Map(holeScores);
    newScores.set(playerId, updatedScore);
    setHoleScores(newScores);
  };

  const handleOBToggle = (playerId: string) => {
    const current = holeScores.get(playerId);
    if (!current) return;

    const updatedScore = {
      ...current,
      obCount: current.obCount === 0 ? 1 : 0,
    };

    const newScores = new Map(holeScores);
    newScores.set(playerId, updatedScore);
    setHoleScores(newScores);
  };

  const handleFairwayToggle = (playerId: string) => {
    const current = holeScores.get(playerId);
    if (!current) return;

    const updatedScore = {
      ...current,
      fairwayHit: !current.fairwayHit,
    };

    const newScores = new Map(holeScores);
    newScores.set(playerId, updatedScore);
    setHoleScores(newScores);
  };

  const saveHoleScores = async () => {
    try {
      // 各プレイヤーのスコアを保存
      for (const [playerId, score] of holeScores.entries()) {
        const scoreData: Omit<Score, 'id'> = {
          roundId: 'current', // TODO: 実際のroundIdを使用
          playerId,
          holeNumber: currentHole,
          strokes: score.score,
          putts: score.putts,
          obCount: score.obCount,
          fairwayHit: score.fairwayHit,
        };
        
        await databaseManager.saveScore(scoreData);
        dispatch(updateScore({
          playerId,
          holeNumber: currentHole,
          score: score.score,
        }));
      }
    } catch (error) {
      console.error('Failed to save scores:', error);
      Alert.alert('Error', 'Failed to save scores');
    }
  };

  const handleNextHole = async () => {
    await saveHoleScores();
    
    if (!course) return;
    
    if (currentHole < course.holes.length) {
      dispatch(setCurrentHole(currentHole + 1));
      initializeScores();
    } else {
      // ラウンド完了
      navigation.navigate('RoundSummary', { 
        roundId: 'current' // TODO: 実際のroundIdを使用
      });
    }
  };

  const handlePreviousHole = () => {
    if (currentHole > 1) {
      dispatch(setCurrentHole(currentHole - 1));
      initializeScores();
    }
  };

  const getScoreLabel = (score: number) => {
    const diff = score - currentPar;
    if (diff <= -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double';
    return `+${diff}`;
  };

  const getScoreColor = (score: number) => {
    const diff = score - currentPar;
    if (diff < 0) return '#4CAF50'; // グリーン（アンダーパー）
    if (diff === 0) return COLORS.text; // パー
    if (diff === 1) return '#FF9800'; // オレンジ（ボギー）
    return COLORS.error; // 赤（ダブルボギー以上）
  };

  const activePlayer = players.find(p => p.id === activePlayerId);
  const activeScore = holeScores.get(activePlayerId);

  if (!course) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading course...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ホール情報ヘッダー */}
      <View style={styles.holeHeader}>
        <Text style={styles.holeTitle}>
          Hole {currentHole} - Par {currentPar}
        </Text>
        <Text style={styles.holeDistance}>
          {course.holes[currentHole - 1]?.distance || '---'}m
        </Text>
      </View>

      {/* プレイヤータブ */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.playerTabs}
      >
        {players.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.playerTab,
              activePlayerId === player.id && styles.playerTabActive
            ]}
            onPress={() => setActivePlayerId(player.id)}
          >
            <Text style={[
              styles.playerTabText,
              activePlayerId === player.id && styles.playerTabTextActive
            ]}>
              {player.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {/* ゴーストモードセレクター（メインプレイヤーのみ） */}
        {activePlayerId === players[0].id && (
          <View style={styles.ghostSection}>
            <GhostModeSelector 
              courseId={courseId} 
              playerId={players[0].id} 
            />
          </View>
        )}

        {/* ゴーストスコア表示 */}
        {ghostEnabled && activePlayerId === players[0].id && (
          <GhostScoreDisplay 
            holeNumber={currentHole}
            currentScore={activeScore?.score}
          />
        )}

        {/* アクティブプレイヤーのスコア入力 */}
        {activePlayer && activeScore && (
          <View style={styles.scoreInputSection}>
            <Text style={styles.sectionTitle}>Score Input</Text>
            
            {/* スコア表示 */}
            <View style={styles.scoreDisplay}>
              <Text style={[
                styles.scoreValue,
                { color: getScoreColor(activeScore.score) }
              ]}>
                {activeScore.score}
              </Text>
              <Text style={[
                styles.scoreLabel,
                { color: getScoreColor(activeScore.score) }
              ]}>
                {getScoreLabel(activeScore.score)}
              </Text>
            </View>

            {/* スコア入力ボタン */}
            {inputMode === 'relative' ? (
              <View style={styles.relativeButtons}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(activePlayerId, -2)}
                >
                  <Text style={styles.scoreButtonText}>-2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(activePlayerId, -1)}
                >
                  <Text style={styles.scoreButtonText}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scoreButton, styles.parButton]}
                  onPress={() => handleScoreChange(activePlayerId, 0)}
                >
                  <Text style={styles.scoreButtonText}>PAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(activePlayerId, 1)}
                >
                  <Text style={styles.scoreButtonText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(activePlayerId, 2)}
                >
                  <Text style={styles.scoreButtonText}>+2</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.absoluteButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numberButton,
                      activeScore.score === num && styles.numberButtonActive
                    ]}
                    onPress={() => handleScoreChange(activePlayerId, num)}
                  >
                    <Text style={[
                      styles.numberButtonText,
                      activeScore.score === num && styles.numberButtonTextActive
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* パット数入力 */}
            <View style={styles.puttsSection}>
              <Text style={styles.subsectionTitle}>Putts</Text>
              <View style={styles.puttsButtons}>
                {[0, 1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.puttButton,
                      activeScore.putts === num && styles.puttButtonActive
                    ]}
                    onPress={() => handlePuttsChange(activePlayerId, num)}
                  >
                    <Text style={[
                      styles.puttButtonText,
                      activeScore.putts === num && styles.puttButtonTextActive
                    ]}>
                      {num === 4 ? '4+' : num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* OB/フェアウェイヒット */}
            <View style={styles.optionsSection}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  activeScore.obCount > 0 && styles.optionButtonActive
                ]}
                onPress={() => handleOBToggle(activePlayerId)}
              >
                <Text style={[
                  styles.optionButtonText,
                  activeScore.obCount > 0 && styles.optionButtonTextActive
                ]}>
                  OB
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  activeScore.fairwayHit && styles.optionButtonActive
                ]}
                onPress={() => handleFairwayToggle(activePlayerId)}
              >
                <Text style={[
                  styles.optionButtonText,
                  activeScore.fairwayHit && styles.optionButtonTextActive
                ]}>
                  Fairway Hit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 全プレイヤーのスコアサマリー */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>All Players</Text>
          {players.map((player) => {
            const score = holeScores.get(player.id);
            if (!score) return null;
            
            return (
              <View key={player.id} style={styles.playerSummary}>
                <Text style={styles.playerName}>{player.name}</Text>
                <View style={styles.playerStats}>
                  <Text style={[
                    styles.playerScore,
                    { color: getScoreColor(score.score) }
                  ]}>
                    {score.score}
                  </Text>
                  <Text style={styles.playerPutts}>
                    {score.putts} putts
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ナビゲーションボタン */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
          onPress={handlePreviousHole}
          disabled={currentHole === 1}
        >
          <Ionicons name="chevron-back" size={24} color={currentHole === 1 ? COLORS.textSecondary : COLORS.primary} />
          <Text style={[styles.navButtonText, currentHole === 1 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNextHole}
        >
          <Text style={styles.nextButtonText}>
            {currentHole === course.holes.length ? 'Finish' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holeHeader: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: 'center',
  },
  holeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  holeDistance: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  playerTabs: {
    backgroundColor: COLORS.surface,
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  playerTab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  playerTabActive: {
    borderBottomColor: COLORS.primary,
  },
  playerTabText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  playerTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scoreInputSection: {
    padding: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 18,
    marginTop: 5,
  },
  relativeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scoreButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  parButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  absoluteButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numberButton: {
    width: '30%',
    backgroundColor: COLORS.background,
    paddingVertical: 15,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  numberButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  numberButtonTextActive: {
    color: '#fff',
  },
  puttsSection: {
    marginTop: 10,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  puttsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  puttButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  puttButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  puttButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  puttButtonTextActive: {
    color: '#fff',
  },
  optionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  optionButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  summarySection: {
    padding: 20,
    backgroundColor: COLORS.surface,
  },
  playerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  playerName: {
    fontSize: 16,
    color: COLORS.text,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerScore: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 15,
  },
  playerPutts: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 5,
  },
  navButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 5,
  },
  ghostSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});