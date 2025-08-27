import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { useGameContext } from '../../contexts/GameContext';
import { clearHistory } from '../../services/storageService';
import { updateSetting } from '../../utils/settingsStorage';
import CustomModal from '../Common/CustomModal';
import HistoryScoreCard from './HistoryScoreCard';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const { getHistory, setCurrentScreen, setCurrentTab, loadHistoryData } = useGameContext();

  // 履歴データを読み込み
  const loadHistory = useCallback(async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('履歴の読み込みに失敗:', error);
    }
  }, [getHistory]);

  // 初回読み込み
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // プルトゥリフレッシュ
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  // 日付フォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // スコアの色を取得
  const getScoreColor = (diff) => {
    if (diff < 0) return colors.birdie;
    if (diff === 0) return colors.par;
    if (diff <= 3) return colors.bogey;
    return colors.tripleBogey;
  };

  // 履歴クリア確認
  const confirmClearHistory = () => {
    setShowClearModal(true);
  };

  // 履歴クリア実行
  const handleClearHistory = async () => {
    await clearHistory();
    // HDCPもリセット（履歴がなければHDCPは計算できない）
    await updateSetting('profile.stats.recentScores', []);
    await updateSetting('profile.stats.hdcp', null);
    await updateSetting('profile.stats.totalRounds', 0);
    await updateSetting('profile.stats.bestScore', null);
    await updateSetting('profile.stats.averageScore', null);
    setHistory([]); // 即座に空にする
    setShowClearModal(false);
    console.log('履歴とHDCP関連データをクリアしました');
  };

  // 詳細表示/非表示切り替え
  const toggleDetails = (id) => {
    setSelectedEntry(selectedEntry === id ? null : id);
  };

  // サマリー画面へ遷移
  const handleViewSummary = (entry) => {
    // 履歴データをGameContextにセット
    loadHistoryData(entry);
    // サマリー画面へ遷移（読み取り専用モード）
    setCurrentScreen('historySummary');
  };

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>プレイ履歴</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>まだ履歴がありません</Text>
          <Text style={styles.emptySubText}>
            ラウンドを完了すると、ここに表示されます
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>プレイ履歴</Text>
        <TouchableOpacity style={styles.clearButton} onPress={confirmClearHistory}>
          <Text style={styles.clearButtonText}>履歴クリア</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {history.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={styles.historyItem}
            onPress={() => toggleDetails(entry.id)}
          >
            <View style={styles.itemHeader}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{entry.courseName}</Text>
                <Text style={styles.date}>{formatDate(entry.date)}</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.totalScore}>{entry.totalScore?.total || '-'}</Text>
                <Text style={[styles.scoreDiff, { color: getScoreColor(entry.totalScore?.diff) }]}>
                  {entry.totalScore?.diff === 0 ? 'E' : 
                   entry.totalScore?.diff > 0 ? `+${entry.totalScore.diff}` : 
                   entry.totalScore?.diff}
                </Text>
              </View>
            </View>

            {selectedEntry === entry.id && (
              <HistoryScoreCard
                scores={entry.scores}
                holeData={entry.holeData}
                playerNames={entry.playerNames}
                onViewSummary={() => handleViewSummary(entry)}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 履歴クリア確認モーダル */}
      <CustomModal
        visible={showClearModal}
        title="履歴をクリア"
        message="すべての履歴データを削除しますか？この操作は取り消せません。"
        buttons={[
          { 
            text: 'キャンセル', 
            style: 'cancel',
            onPress: () => setShowClearModal(false)
          },
          {
            text: '削除する',
            style: 'destructive',
            onPress: handleClearHistory
          }
        ]}
        onClose={() => setShowClearModal(false)}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  clearButton: {
    padding: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
  },
  clearButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
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
  historyItem: {
    backgroundColor: colors.white,
    margin: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.gray,
  },
  scoreInfo: {
    alignItems: 'center',
  },
  totalScore: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  scoreDiff: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;