import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { PlayStackScreenProps } from '@/navigation/types';
import { useAppSelector } from '@/store';
import { Course, Player, Score } from '@/types/models';
import { databaseManager } from '@/database/helpers';
import { courseService } from '@/services/courseService';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = PlayStackScreenProps<'RoundSummary'>;

interface PlayerSummary {
  player: Player;
  totalScore: number;
  totalPutts: number;
  pars: number;
  birdies: number;
  bogeys: number;
  eagles: number;
  doubles: number;
}

export default function RoundSummaryScreen({ navigation, route }: Props) {
  const { roundId } = route.params;
  const { players, scores: gameScores } = useAppSelector(state => state.game);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [playerSummaries, setPlayerSummaries] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateSummaries();
  }, []);

  const calculateSummaries = async () => {
    try {
      // コース情報を取得（仮でcourse1を使用）
      const courseData = await courseService.getCourseById('course1');
      setCourse(courseData);

      if (!courseData) return;

      // 各プレイヤーのサマリーを計算
      const summaries: PlayerSummary[] = [];
      
      for (const player of players) {
        const playerScores = gameScores.filter(s => s.playerId === player.id);
        
        let totalScore = 0;
        let totalPutts = 0;
        let pars = 0;
        let birdies = 0;
        let bogeys = 0;
        let eagles = 0;
        let doubles = 0;

        playerScores.forEach((score, index) => {
          const holePar = courseData.holes[index]?.par || 3;
          const diff = score.strokes - holePar;
          
          totalScore += score.strokes;
          totalPutts += score.putts || 0;

          if (diff <= -2) eagles++;
          else if (diff === -1) birdies++;
          else if (diff === 0) pars++;
          else if (diff === 1) bogeys++;
          else if (diff >= 2) doubles++;
        });

        summaries.push({
          player,
          totalScore,
          totalPutts,
          pars,
          birdies,
          bogeys,
          eagles,
          doubles,
        });
      }

      // スコアでソート（昇順）
      summaries.sort((a, b) => a.totalScore - b.totalScore);
      setPlayerSummaries(summaries);
    } catch (error) {
      console.error('Failed to calculate summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (playerSummaries.length === 0) return;

    const winner = playerSummaries[0];
    const courseInfo = course ? `${course.name} (Par ${course.totalPar})` : 'Unknown Course';
    
    let message = `🏆 ディスクゴルフ ラウンド結果\n`;
    message += `📍 ${courseInfo}\n`;
    message += `📅 ${new Date().toLocaleDateString()}\n\n`;
    
    playerSummaries.forEach((summary, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const scoreDiff = course ? summary.totalScore - course.totalPar : 0;
      const scoreText = scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : `${scoreDiff}`;
      
      message += `${medal} ${summary.player.name}: ${summary.totalScore} (${scoreText})\n`;
      if (summary.eagles > 0) message += `   🦅 Eagles: ${summary.eagles}\n`;
      if (summary.birdies > 0) message += `   🐦 Birdies: ${summary.birdies}\n`;
    });

    try {
      await Share.share({
        message,
        title: 'ディスクゴルフ スコア',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handlePlayAgain = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'MainTabs' },
        { name: 'PlayStack', params: { screen: 'CourseSelect' } },
      ],
    });
  };

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff < 0) return '#4CAF50';
    if (diff === 0) return COLORS.text;
    if (diff === 1) return '#FF9800';
    return COLORS.error;
  };

  const renderPlayerCard = (summary: PlayerSummary, index: number) => {
    const isWinner = index === 0;
    const scoreDiff = course ? summary.totalScore - course.totalPar : 0;
    const scoreText = scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : `${scoreDiff}`;

    return (
      <View key={summary.player.id} style={[styles.playerCard, isWinner && styles.winnerCard]}>
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerBadgeText}>WINNER</Text>
          </View>
        )}
        
        <View style={styles.playerHeader}>
          <View style={styles.playerRank}>
            <Text style={styles.rankText}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
            </Text>
          </View>
          
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{summary.player.name}</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.totalScore, { color: getScoreColor(summary.totalScore, course?.totalPar || 0) }]}>
                {summary.totalScore}
              </Text>
              <Text style={[styles.scoreDiff, { color: getScoreColor(summary.totalScore, course?.totalPar || 0) }]}>
                ({scoreText})
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {summary.eagles > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.eagles}</Text>
              <Text style={styles.statLabel}>Eagles</Text>
            </View>
          )}
          {summary.birdies > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.birdies}</Text>
              <Text style={styles.statLabel}>Birdies</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary.pars}</Text>
            <Text style={styles.statLabel}>Pars</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary.bogeys}</Text>
            <Text style={styles.statLabel}>Bogeys</Text>
          </View>
          {summary.doubles > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.doubles}</Text>
              <Text style={styles.statLabel}>Double+</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary.totalPutts}</Text>
            <Text style={styles.statLabel}>Putts</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Calculating scores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>Round Complete!</Text>
          {course && (
            <>
              <Text style={styles.courseInfo}>{course.name}</Text>
              <Text style={styles.dateInfo}>{new Date().toLocaleDateString()}</Text>
            </>
          )}
        </View>

        {/* プレイヤーカード */}
        <View style={styles.cardsContainer}>
          {playerSummaries.map((summary, index) => renderPlayerCard(summary, index))}
        </View>

        {/* コース統計 */}
        {course && (
          <View style={styles.courseStats}>
            <Text style={styles.sectionTitle}>Course Statistics</Text>
            <View style={styles.courseStatsGrid}>
              <View style={styles.courseStatItem}>
                <Text style={styles.courseStatValue}>{course.holes.length}</Text>
                <Text style={styles.courseStatLabel}>Holes</Text>
              </View>
              <View style={styles.courseStatItem}>
                <Text style={styles.courseStatValue}>{course.totalPar}</Text>
                <Text style={styles.courseStatLabel}>Total Par</Text>
              </View>
              <View style={styles.courseStatItem}>
                <Text style={styles.courseStatValue}>
                  {Math.round(playerSummaries.reduce((sum, p) => sum + p.totalScore, 0) / playerSummaries.length)}
                </Text>
                <Text style={styles.courseStatLabel}>Avg Score</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* アクションボタン */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color={COLORS.primary} />
          <Text style={styles.shareButtonText}>Share Results</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePlayAgain}>
            <Text style={styles.secondaryButtonText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleFinish}>
            <Text style={styles.primaryButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    backgroundColor: COLORS.primary,
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  courseInfo: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  dateInfo: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    marginTop: 5,
  },
  cardsContainer: {
    padding: 20,
  },
  playerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  winnerCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  winnerBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerRank: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 24,
  },
  playerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 5,
  },
  totalScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreDiff: {
    fontSize: 18,
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  courseStats: {
    padding: 20,
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  courseStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  courseStatItem: {
    alignItems: 'center',
  },
  courseStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  courseStatLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 15,
  },
  shareButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});