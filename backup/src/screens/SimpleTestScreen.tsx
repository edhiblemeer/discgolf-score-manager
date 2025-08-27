import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';

export default function SimpleTestScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎯 ディスクゴルフアプリ</Text>
        <Text style={styles.subtitle}>動作確認画面 v2</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>✅ SDK 53対応完了</Text>
        <Text style={styles.item}>• Platform: {Platform.OS}</Text>
        <Text style={styles.item}>• Version: {Platform.Version}</Text>
        <Text style={styles.item}>• 接続成功！</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 実装済み機能</Text>
        <Text style={styles.item}>• スコア入力（2モード）</Text>
        <Text style={styles.item}>• 4人同時プレイ</Text>
        <Text style={styles.item}>• ゴーストモード</Text>
        <Text style={styles.item}>• 統計グラフ</Text>
        <Text style={styles.item}>• Firebase同期（準備済）</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>タップテスト</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.debugTitle}>環境情報</Text>
        <Text style={styles.debug}>React Native: 0.76.5</Text>
        <Text style={styles.debug}>Expo SDK: 53</Text>
        <Text style={styles.debug}>動作確認: OK</Text>
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
    color: '#333',
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
    color: '#333',
  },
  item: {
    fontSize: 14,
    marginVertical: 4,
    marginLeft: 8,
    color: '#555',
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
    color: '#666',
  },
  debug: {
    fontSize: 12,
    color: '#999',
    marginVertical: 2,
  },
});