import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function TestScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎯 ディスクゴルフアプリ</Text>
        <Text style={styles.subtitle}>動作確認画面</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>✅ 実装済み機能</Text>
        <Text style={styles.item}>• スコア入力（2モード）</Text>
        <Text style={styles.item}>• 4人同時プレイ</Text>
        <Text style={styles.item}>• ゴーストモード</Text>
        <Text style={styles.item}>• 統計グラフ</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 ダミーデータ</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>20</Text>
            <Text style={styles.statLabel}>ラウンド</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>54.5</Text>
            <Text style={styles.statLabel}>平均スコア</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>ハンディキャップ</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>統計画面を見る →</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.debugTitle}>デバッグ情報</Text>
        <Text style={styles.debug}>Platform: Android</Text>
        <Text style={styles.debug}>React Native: 0.72.10</Text>
        <Text style={styles.debug}>Expo SDK: 49</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    fontSize: 14,
    marginVertical: 4,
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  debug: {
    fontSize: 12,
    color: '#999',
    marginVertical: 2,
  },
});