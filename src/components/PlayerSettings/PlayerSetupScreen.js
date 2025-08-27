import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { LAYOUT_OPTIONS_27 } from '../../data/courses';
import { useSettings } from '../../hooks/useSettings';
import { loadFriends } from '../../utils/settingsStorage';
import { getRecommendedHandicap, getHDCPLevel, getHDCPDisplay, getEstimatedHDCP } from '../../utils/hdcpCalculator';

const PlayerSetupScreen = ({ 
  players, 
  playerNames,
  playerHDCPSettings,
  startHole,
  totalHoles = 18,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayerName,
  onUpdatePlayerHDCP,
  onUpdateStartHole,
  onUpdateLayout,
  onStartRound,
  onBack,
  selectedCourse
}) => {
  const [selectedLayoutOption, setSelectedLayoutOption] = useState(totalHoles === 27 ? 'a_b' : null);
  const [friends, setFriends] = useState([]);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [showHDCPSetting, setShowHDCPSetting] = useState(false);
  const [hdcpSettingIndex, setHdcpSettingIndex] = useState(null);
  const canAddPlayer = players.length < 4;
  const canRemovePlayer = players.length > 1;
  
  // 設定を取得
  const { settings, isFavorite } = useSettings();
  
  // フレンドリストを読み込み
  useEffect(() => {
    loadFriendsList();
  }, []);
  
  // プレイヤー数が変更されたときのHDCP設定更新
  useEffect(() => {
    if (players && players.length > 0) {
      initializeHDCPSettings();
    }
  }, [players]);
  
  const loadFriendsList = async () => {
    const friendsList = await loadFriends();
    setFriends(friendsList);
  };
  
  // HDCP設定の初期化
  const initializeHDCPSettings = () => {
    if (!players || players.length === 0) {
      return;
    }
    players.forEach((player, index) => {
      if (index === 0) {
        // プレイヤー1は自分のHDCPを使用
        const hdcpValue = settings.profile.stats?.hdcp || 0;
        if (!playerHDCPSettings[index] || playerHDCPSettings[index].hdcpValue !== hdcpValue) {
          onUpdatePlayerHDCP(index, 'auto', hdcpValue);
        }
      } else if (!playerHDCPSettings[index]) {
        // 新規プレイヤー
        onUpdatePlayerHDCP(index, 'none', 0);
      }
    });
  };

  // プレイヤー1は常にマイプロフィールを使用
  useEffect(() => {
    // 初回レンダリング時と変更時の両方で確実に設定
    const displayName = settings.profile.displayName || 'プレイヤー1';
    if (playerNames[0] !== displayName) {
      onUpdatePlayerName(0, displayName);
    }
  }, [settings.profile.displayName, playerNames[0]]);
  
  // フレンドを選択
  const selectFriend = (friend) => {
    if (selectedPlayerIndex !== null) {
      onUpdatePlayerName(selectedPlayerIndex, friend.displayName);
      // 選択されたプレイヤー情報を保存
      const newSelectedPlayers = [...selectedPlayers];
      newSelectedPlayers[selectedPlayerIndex] = friend;
      setSelectedPlayers(newSelectedPlayers);
      // フレンドのHDCPも適用
      if (friend.hdcp !== null && friend.hdcp !== undefined) {
        onUpdatePlayerHDCP(selectedPlayerIndex, 'friend', friend.hdcp);
      }
      setShowFriendPicker(false);
      setSelectedPlayerIndex(null);
    }
  };
  
  // HDCPに基づくハンディキャップ推奨を計算
  const getHandicapRecommendations = () => {
    const recommendations = [];
    
    if (!playerHDCPSettings || playerHDCPSettings.length === 0) {
      return recommendations;
    }
    
    // 各プレイヤーの元のHDCPを取得（データベース値のみ使用）
    const playerHDCPs = playerHDCPSettings.map((setting, index) => {
      // プレイヤー1の場合
      if (index === 0) {
        return settings.profile.stats?.hdcp || 0;
      }
      // フレンドから選択されている場合、フレンドのHDCPを使用
      if (selectedPlayers && selectedPlayers[index] && selectedPlayers[index].hdcp !== null) {
        return selectedPlayers[index].hdcp;
      }
      // 新規プレイヤーの場合は0
      return 0;
    });
    
    // プレイヤー間のHDCPを比較
    for (let i = 0; i < playerHDCPs.length; i++) {
      for (let j = i + 1; j < playerHDCPs.length; j++) {
        if (playerHDCPs[i] !== null && playerHDCPs[j] !== null) {
          const recommendation = getRecommendedHandicap(playerHDCPs[i], playerHDCPs[j]);
          if (recommendation.hasHandicap) {
            recommendations.push({
              player1Index: i,
              player2Index: j,
              player1Name: playerNames[i],
              player2Name: playerNames[j],
              ...recommendation
            });
          }
        }
      }
    }
    
    return recommendations;
  };

  // 27ホールコースの場合、初期レイアウトを自動設定
  React.useEffect(() => {
    if (totalHoles === 27 && selectedLayoutOption) {
      const defaultLayout = LAYOUT_OPTIONS_27.find(layout => layout.id === selectedLayoutOption);
      if (defaultLayout && onUpdateLayout) {
        onUpdateLayout(defaultLayout);
      }
    }
  }, [totalHoles, selectedLayoutOption, onUpdateLayout]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>プレイヤー設定</Text>
        <Text style={styles.courseName}>
          {isFavorite(selectedCourse) && '★ '}{selectedCourse}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プレイヤー名</Text>
          {players.map((player, index) => (
            <View key={index} style={styles.playerContainer}>
              <View style={styles.playerRow}>
                <View style={styles.playerLabel}>
                  <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: fontSize.base }}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.playerInputContainer}>
                  {index === 0 ? (
                    <View style={[styles.playerInput, styles.disabledInput]}>
                      <Text style={styles.disabledInputText}>{playerNames[0]}</Text>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        style={styles.playerInput}
                        value={playerNames[index]}
                        onChangeText={(text) => onUpdatePlayerName(index, text)}
                        placeholder={`プレイヤー${index + 1}`}
                      />
                      {friends.length > 0 && (
                        <TouchableOpacity
                          style={styles.friendPickerButton}
                          onPress={() => {
                            setSelectedPlayerIndex(index);
                            setShowFriendPicker(true);
                          }}
                        >
                          <Text style={styles.friendPickerButtonText}>👥</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
              {/* HDCP設定行 */}
              <View style={styles.hdcpRow}>
                <Text style={styles.hdcpCurrentValue}>
                  HDCP: {(() => {
                    if (playerHDCPSettings && playerHDCPSettings[index] && playerHDCPSettings[index].hdcpValue !== null) {
                      return getHDCPDisplay(playerHDCPSettings[index].hdcpValue);
                    }
                    if (index === 0) {
                      return getHDCPDisplay(settings.profile.stats?.hdcp, settings.profile.stats?.recentScores);
                    }
                    return '未設定';
                  })()}
                </Text>
                {index !== 0 && (
                  <TouchableOpacity
                    style={styles.hdcpSettingButton}
                    onPress={() => {
                      setHdcpSettingIndex(index);
                      setShowHDCPSetting(true);
                    }}
                  >
                    <Text style={styles.hdcpSettingButtonText}>設定</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
        
        {/* フレンド選択モーダル */}
        {showFriendPicker && (
          <View style={styles.friendPickerModal}>
            <View style={styles.friendPickerContent}>
              <Text style={styles.friendPickerTitle}>フレンドから選択</Text>
              {friends.map((friend) => (
                <TouchableOpacity
                  key={friend.playerId}
                  style={styles.friendOption}
                  onPress={() => selectFriend(friend)}
                >
                  <View style={styles.friendOptionContent}>
                    <View>
                      <Text style={styles.friendOptionText}>{friend.displayName}</Text>
                      <Text style={styles.friendOptionCode}>{friend.playerCode}</Text>
                    </View>
                    {friend.hdcp !== null && (
                      <View style={styles.friendHDCPContainer}>
                        <Text style={styles.friendHDCPText}>HDCP</Text>
                        <Text style={[styles.friendHDCPValue, { color: getHDCPLevel(friend.hdcp).color }]}>
                          {friend.hdcp > 0 ? '+' : ''}{friend.hdcp}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.friendPickerCancel}
                onPress={() => {
                  setShowFriendPicker(false);
                  setSelectedPlayerIndex(null);
                }}
              >
                <Text style={styles.friendPickerCancelText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* HDCP設定モーダル */}
        {showHDCPSetting && hdcpSettingIndex !== null && (
          <View style={styles.hdcpSettingModal}>
            <View style={styles.hdcpSettingContent}>
              <Text style={styles.hdcpSettingTitle}>
                プレイヤー{hdcpSettingIndex + 1}のHDCP設定
              </Text>
              
              {/* 推奨HDCP表示 */}
              {(() => {
                const recommendations = getHandicapRecommendations();
                const playerRec = recommendations.find(rec => 
                  rec.player1Index === hdcpSettingIndex || rec.player2Index === hdcpSettingIndex
                );
                if (playerRec) {
                  const recommendedHDCP = playerRec.giveToPlayer === 1 
                    ? (playerRec.player1Index === hdcpSettingIndex ? playerRec.strokes : 0)
                    : (playerRec.player2Index === hdcpSettingIndex ? playerRec.strokes : 0);
                  if (recommendedHDCP > 0) {
                    return (
                      <View style={styles.hdcpRecommendation}>
                        <Text style={styles.hdcpRecommendationText}>
                          推奨: +{recommendedHDCP}打
                        </Text>
                        <TouchableOpacity
                          style={styles.hdcpUseRecommendButton}
                          onPress={() => {
                            updatePlayerHDCP(hdcpSettingIndex, 'recommended', recommendedHDCP);
                            setShowHDCPSetting(false);
                          }}
                        >
                          <Text style={styles.hdcpUseRecommendButtonText}>推奨値を使用</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                }
                return null;
              })()}
              
              {/* HDCP入力 */}
              <View style={styles.hdcpManualSection}>
                <Text style={styles.hdcpSectionLabel}>HDCP値を入力</Text>
                <View style={styles.hdcpManualInput}>
                  <TextInput
                    style={styles.hdcpInputField}
                    placeholder="例: 5, -2, 0"
                    keyboardType="numeric"
                    defaultValue={playerHDCPSettings[hdcpSettingIndex]?.hdcpValue?.toString() || ''}
                    onChangeText={(text) => {
                      const value = parseFloat(text);
                      if (!isNaN(value)) {
                        onUpdatePlayerHDCP(hdcpSettingIndex, 'manual', value);
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.hdcpApplyButton}
                    onPress={() => setShowHDCPSetting(false)}
                  >
                    <Text style={styles.hdcpApplyButtonText}>適用</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* クリアボタン */}
              <TouchableOpacity
                style={styles.hdcpClearButton}
                onPress={() => {
                  onUpdatePlayerHDCP(hdcpSettingIndex, 'none', 0);
                  setShowHDCPSetting(false);
                }}
              >
                <Text style={styles.hdcpClearButtonText}>HDCPをクリア</Text>
              </TouchableOpacity>
              
              {/* キャンセル */}
              <TouchableOpacity
                style={styles.hdcpCancelButton}
                onPress={() => setShowHDCPSetting(false)}
              >
                <Text style={styles.hdcpCancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.playerControls}>
          <TouchableOpacity
            style={[styles.controlButton, !canRemovePlayer && styles.disabledButton]}
            onPress={onRemovePlayer}
            disabled={!canRemovePlayer}
          >
            <Text style={styles.controlButtonText}>プレイヤーを減らす</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.addButton, !canAddPlayer && styles.disabledButton]}
            onPress={onAddPlayer}
            disabled={!canAddPlayer}
          >
            <Text style={[styles.controlButtonText, styles.addButtonText]}>プレイヤーを追加</Text>
          </TouchableOpacity>
        </View>

        {/* 27ホールコースの場合はレイアウト選択 */}
        {totalHoles === 27 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>レイアウト選択</Text>
            <View style={styles.layoutButtons}>
              {LAYOUT_OPTIONS_27.map((layout) => (
                <TouchableOpacity
                  key={layout.id}
                  style={[styles.layoutButton, selectedLayoutOption === layout.id && styles.activeLayout]}
                  onPress={() => {
                    setSelectedLayoutOption(layout.id);
                    if (onUpdateLayout) {
                      onUpdateLayout(layout);
                    }
                  }}
                >
                  <Text style={[styles.layoutText, selectedLayoutOption === layout.id && styles.activeLayoutText]}>
                    {layout.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 27ホール以外の場合は通常のスタートホール選択 */}
        {totalHoles !== 27 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>スタートホール</Text>
            <View style={styles.startHoleButtons}>
              <TouchableOpacity
                style={[styles.startHoleButton, startHole === 1 && styles.activeStartHole]}
                onPress={() => onUpdateStartHole(1)}
              >
                <Text style={[styles.startHoleText, startHole === 1 && styles.activeStartHoleText]}>
                  1番ホール
                </Text>
              </TouchableOpacity>
              {totalHoles > 9 && (
                <TouchableOpacity
                  style={[styles.startHoleButton, startHole === 10 && styles.activeStartHole]}
                  onPress={() => onUpdateStartHole(10)}
                >
                  <Text style={[styles.startHoleText, startHole === 10 && styles.activeStartHoleText]}>
                    10番ホール
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}


        <TouchableOpacity style={styles.startButton} onPress={onStartRound}>
          <Text style={styles.startButtonText}>ラウンド開始</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  courseName: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  playerContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  playerLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  playerInputContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.base,
    minHeight: 40,
  },
  disabledInput: {
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
  },
  disabledInputText: {
    fontSize: fontSize.base,
    color: colors.dark,
  },
  friendPickerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  friendPickerButtonText: {
    fontSize: fontSize.lg,
  },
  friendPickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  friendPickerContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 300,
  },
  friendPickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  friendOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  friendOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendOptionText: {
    fontSize: fontSize.base,
    color: colors.dark,
    fontWeight: 'bold',
  },
  friendOptionCode: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  friendHDCPContainer: {
    alignItems: 'center',
  },
  friendHDCPText: {
    fontSize: fontSize.xs,
    color: colors.gray,
  },
  friendHDCPValue: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  friendPickerCancel: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  friendPickerCancelText: {
    fontSize: fontSize.base,
    color: colors.dark,
    fontWeight: 'bold',
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  controlButton: {
    flex: 1,
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  addButtonText: {
    color: colors.white,
  },
  startHoleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  startHoleButton: {
    flex: 1,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  activeStartHole: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  startHoleText: {
    fontSize: fontSize.base,
    color: colors.dark,
  },
  activeStartHoleText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  layoutButtons: {
    flexDirection: 'column',
  },
  layoutButton: {
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  activeLayout: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  layoutText: {
    fontSize: fontSize.base,
    color: colors.dark,
  },
  activeLayoutText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: colors.success,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  startButtonText: {
    fontSize: fontSize.lg,
    color: colors.white,
    fontWeight: 'bold',
  },
  handicapSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  handicapTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  handicapRecommendation: {
    padding: spacing.sm,
    backgroundColor: colors.light,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  handicapPlayerName: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  handicapStrokes: {
    fontSize: fontSize.md,
    color: colors.warning,
    fontWeight: 'bold',
  },
  handicapDetail: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  handicapNote: {
    fontSize: fontSize.sm,
    color: colors.gray,
    marginTop: spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // HDCP設定関連
  hdcpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.light,
    borderRadius: borderRadius.sm,
    minHeight: 36,
  },
  hdcpCurrentValue: {
    fontSize: fontSize.sm,
    color: colors.gray,
  },
  hdcpSettingButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.sm,
  },
  hdcpSettingButtonText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: 'bold',
  },
  hdcpSettingModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  hdcpSettingContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 350,
  },
  hdcpSettingTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  hdcpSectionLabel: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  hdcpRecommendation: {
    backgroundColor: colors.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hdcpRecommendationText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: 'bold',
  },
  hdcpUseRecommendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  hdcpUseRecommendButtonText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: 'bold',
  },
  hdcpManualSection: {
    marginBottom: spacing.lg,
  },
  hdcpManualInput: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hdcpInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.base,
  },
  hdcpApplyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
  },
  hdcpApplyButtonText: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: 'bold',
  },
  hdcpClearButton: {
    padding: spacing.md,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hdcpClearButtonText: {
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: 'bold',
  },
  hdcpCancelButton: {
    padding: spacing.md,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  hdcpCancelButtonText: {
    fontSize: fontSize.base,
    color: colors.dark,
    fontWeight: 'bold',
  },
});

export default PlayerSetupScreen;