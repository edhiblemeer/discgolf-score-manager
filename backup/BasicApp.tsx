import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BasicApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 ディスクゴルフ</Text>
      <Text style={styles.text}>接続成功！</Text>
      <Text style={styles.text}>SDK 53で動作中</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  text: {
    fontSize: 18,
    marginVertical: 5,
    color: '#666',
  },
});