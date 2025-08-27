/**
 * Statistics Screen
 * ゴルフ統計の表示と分析
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';
import { statisticsService, OverallStats, TrendData, ScoreDistribution } from '@/services/statisticsService';
import { useAppSelector } from '@/store';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green theme
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: COLORS.primary,
  },
};

type TabType = 'overview' | 'trends' | 'distribution' | 'holes';

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution | null>(null);
  
  // 現在のプレイヤーID（ダミー）
  const playerId = 'player_1';

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 統計データを取得
      const overallStats = await statisticsService.calculateOverallStats(playerId);
      const trend = statisticsService.calculateTrend(playerId);
      const scores = statisticsService['getDummyScores'](playerId); // Private methodを呼び出し
      const dist = statisticsService.calculateScoreDistribution(scores);
      
      setStats(overallStats);
      setTrendData(trend);
      setDistribution(dist);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!stats) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRounds}</Text>
            <Text style={styles.statLabel}>Total Rounds</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averageScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.bestScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.handicap}</Text>
            <Text style={styles.statLabel}>Handicap</Text>
          </View>
        </View>

        <View style={styles.detailStats}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Average Putts</Text>
            <Text style={styles.detailValue}>{stats.averagePutts.toFixed(1)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fairway Hit Rate</Text>
            <Text style={styles.detailValue}>{stats.fairwayHitRate.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Par or Better</Text>
            <Text style={styles.detailValue}>{stats.parOrBetterRate.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Birdie Rate</Text>
            <Text style={styles.detailValue}>{stats.birdieRate.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTrends = () => {
    if (!trendData || trendData.scores.length === 0) return null;

    const trendIcon = 
      trendData.trend === 'improving' ? 'trending-down' : 
      trendData.trend === 'declining' ? 'trending-up' : 
      'remove';
    
    const trendColor = 
      trendData.trend === 'improving' ? COLORS.success : 
      trendData.trend === 'declining' ? COLORS.error : 
      COLORS.textSecondary;

    return (
      <View style={styles.section}>
        <View style={styles.trendHeader}>
          <Text style={styles.sectionTitle}>Score Trends</Text>
          <View style={styles.trendIndicator}>
            <Ionicons name={trendIcon} size={24} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trendData.trend.charAt(0).toUpperCase() + trendData.trend.slice(1)}
            </Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: trendData.dates.map(d => d.split('/')[0] + '/' + d.split('/')[1]),
              datasets: [
                {
                  data: trendData.scores,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: trendData.averages,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  strokeWidth: 2,
                  withDots: false,
                },
              ],
              legend: ['Actual', 'Moving Average'],
            }}
            width={Math.max(screenWidth - 32, trendData.dates.length * 60)}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>
    );
  };

  const renderDistribution = () => {
    if (!distribution) return null;

    const pieData = [
      {
        name: 'Eagles',
        count: distribution.eagles,
        color: '#4CAF50',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Birdies',
        count: distribution.birdies,
        color: '#8BC34A',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Pars',
        count: distribution.pars,
        color: '#2196F3',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Bogeys',
        count: distribution.bogeys,
        color: '#FF9800',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Double+',
        count: distribution.doubleBogeys + distribution.others,
        color: '#F44336',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ].filter(item => item.count > 0);

    const barData = {
      labels: ['Eagle', 'Birdie', 'Par', 'Bogey', 'Double+'],
      datasets: [
        {
          data: [
            distribution.eagles,
            distribution.birdies,
            distribution.pars,
            distribution.bogeys,
            distribution.doubleBogeys + distribution.others,
          ],
        },
      ],
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score Distribution</Text>
        
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        <View style={styles.chartContainer}>
          <BarChart
            data={barData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            showValuesOnTopOfBars
            fromZero
            style={styles.chart}
          />
        </View>
      </View>
    );
  };

  const renderHoles = () => {
    const holeStats = statisticsService.calculateHoleStats('course_1', playerId);
    
    return (
      <ScrollView style={styles.section}>
        <Text style={styles.sectionTitle}>Hole-by-Hole Analysis</Text>
        
        <View style={styles.holeGrid}>
          {holeStats.map((hole) => (
            <View key={hole.holeNumber} style={styles.holeCard}>
              <View style={styles.holeHeader}>
                <Text style={styles.holeNumber}>#{hole.holeNumber}</Text>
                <View style={[
                  styles.difficultyBadge,
                  styles[`difficulty_${hole.difficulty}`]
                ]}>
                  <Text style={styles.difficultyText}>
                    {hole.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.holeStats}>
                <Text style={styles.holeAverage}>{hole.averageScore}</Text>
                <Text style={styles.holeLabel}>Avg</Text>
              </View>
              
              <View style={styles.holeRange}>
                <Text style={styles.rangeText}>
                  {hole.bestScore} - {hole.worstScore}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'trends':
        return renderTrends();
      case 'distribution':
        return renderDistribution();
      case 'holes':
        return renderHoles();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trends' && styles.tabActive]}
          onPress={() => setActiveTab('trends')}
        >
          <Text style={[styles.tabText, activeTab === 'trends' && styles.tabTextActive]}>
            Trends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'distribution' && styles.tabActive]}
          onPress={() => setActiveTab('distribution')}
        >
          <Text style={[styles.tabText, activeTab === 'distribution' && styles.tabTextActive]}>
            Distribution
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'holes' && styles.tabActive]}
          onPress={() => setActiveTab('holes')}
        >
          <Text style={[styles.tabText, activeTab === 'holes' && styles.tabTextActive]}>
            Holes
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statCard: {
    width: '50%',
    padding: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  detailStats: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  holeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  holeCard: {
    width: '25%',
    padding: 4,
  },
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  holeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  difficultyBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  difficulty_easy: {
    backgroundColor: '#E8F5E9',
  },
  difficulty_medium: {
    backgroundColor: '#FFF3E0',
  },
  difficulty_hard: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  holeStats: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  holeAverage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  holeLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  holeRange: {
    marginTop: 2,
  },
  rangeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});