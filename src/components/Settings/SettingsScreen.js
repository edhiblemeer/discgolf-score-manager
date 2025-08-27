import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { loadSettings, saveSettings } from '../../utils/settingsStorage';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    profile: {
      defaultPlayerName: 'プレイヤー1',
    },
    app: {
      ghostMode: true,
      detailedStats: {
        shotType: true,
        putts: true,
        ob: true,
        fairway: true,
      }
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  // 設定を読み込み
  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const savedSettings = await loadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    }
  };

  // 設定を更新
  const updateSetting = (category, key, value) => {
    setSettings(prev => {
      if (category === 'detailedStats') {
        return {
          ...prev,
          app: {
            ...prev.app,
            detailedStats: {
              ...prev.app.detailedStats,
              [key]: value
            }
          }
        };
      } else if (category === 'profile') {
        return {
          ...prev,
          profile: {
            ...prev.profile,
            [key]: value
          }
        };
      } else if (category === 'app') {
        return {
          ...prev,
          app: {
            ...prev.app,
            [key]: value
          }
        };
      }
      return prev;
    });
    setHasChanges(true);
  };

  // 設定を保存
  const handleSave = async () => {
    try {
      await saveSettings(settings);
      setHasChanges(false);
      Alert.alert('保存完了', '設定を保存しました', [
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      Alert.alert('エラー', '設定の保存に失敗しました', [
        { text: 'OK' }
      ]);
    }
  };

  // デフォルトに戻す
  const handleReset = () => {
    Alert.alert(
      '確認',
      '設定をデフォルトに戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings = {
              profile: {
                displayName: 'プレイヤー1',
              },
              app: {
                ghostMode: true,
                detailedStats: {
                  shotType: true,
                  putts: true,
                  ob: true,
                  fairway: true,
                }
              }
            };
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
            setHasChanges(false);
            Alert.alert('完了', 'デフォルト設定に戻しました');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
        {hasChanges && (
          <Text style={styles.unsavedIndicator}>※未保存の変更があります</Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* アプリ設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ設定</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>ゴーストモード</Text>
              <Switch
                value={settings.app.ghostMode}
                onValueChange={(value) => updateSetting('app', 'ghostMode', value)}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <Text style={styles.settingDescription}>
              同じコースを選択時に自動で前回のラウンドと比較
            </Text>
          </View>
        </View>

        {/* 詳細統計記録設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細統計記録</Text>
          <Text style={styles.sectionDescription}>
            スコア入力時に表示する項目を選択
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>ショット種類（FH/BH）</Text>
              <Switch
                value={settings.app.detailedStats.shotType}
                onValueChange={(value) => updateSetting('detailedStats', 'shotType', value)}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>パット数</Text>
              <Switch
                value={settings.app.detailedStats.putts}
                onValueChange={(value) => updateSetting('detailedStats', 'putts', value)}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>OB記録</Text>
              <Switch
                value={settings.app.detailedStats.ob}
                onValueChange={(value) => updateSetting('detailedStats', 'ob', value)}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>フェアウェイキープ</Text>
              <Switch
                value={settings.app.detailedStats.fairway}
                onValueChange={(value) => updateSetting('detailedStats', 'fairway', value)}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, !hasChanges && styles.disabledButton]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={styles.buttonText}>設定を保存</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>デフォルトに戻す</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  unsavedIndicator: {
    fontSize: fontSize.sm,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
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
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  settingItem: {
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.base,
    color: colors.dark,
    marginBottom: spacing.xs,
    flex: 1,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.base,
    backgroundColor: colors.white,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    padding: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  resetButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.white,
  },
  resetButtonText: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.danger,
  },
  spacer: {
    height: spacing.xl,
  },
});

export default SettingsScreen;