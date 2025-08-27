import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GameProvider, useGameContext } from './src/contexts/GameContext';
import CustomModal from './src/components/Common/CustomModal';
import ScoreCardScreen from './src/components/ScoreCard/ScoreCardScreen';
import ScoreCardOverviewScreen from './src/components/ScoreCard/ScoreCardOverviewScreen';
import SummaryScreen from './src/components/Summary/SummaryScreen';
import HistoryScreen from './src/components/History/HistoryScreen';
import StatisticsScreen from './src/components/Statistics/StatisticsScreen';
import PlayerSetupScreen from './src/components/PlayerSettings/PlayerSetupScreen';
import HomeScreen from './src/components/Navigation/HomeScreen';
import SettingsScreen from './src/components/Settings/SettingsScreen';
import FriendsScreen from './src/components/Friends/FriendsScreen';
import { useSettings } from './src/hooks/useSettings';
import { checkMissingHoles } from './src/utils/scoreHelpers';
import { hasUnfinishedRound, clearCurrentRound } from './src/services/storageService';
import { getCourseByName } from './src/data/courses';

// メインアプリコンテンツ（Context利用）
const AppContent = () => {
  const [hasUnfinished, setHasUnfinished] = useState(false);
  
  // 設定を取得
  const { settings } = useSettings();
  
  const {
    currentTab,
    currentScreen,
    selectedCourse,
    currentHole,
    startHole,
    totalHoles,
    playableHoles,
    selectedLayout,
    ghostMode,
    ghostData,
    isGhostActive,
    players,
    playerNames,
    playerHDCPSettings,
    scores,
    holeData,
    alertModal,
    setCurrentTab,
    setCurrentScreen,
    setSelectedCourse,
    setCurrentHole,
    setStartHole,
    setTotalHoles,
    setPlayableHoles,
    setSelectedLayout,
    setGhostMode,
    setHoleData,
    setIsViewingHistory,
    showAlert,
    hideAlert,
    generateHoleDataForHole,
    updateScore,
    updatePutts,
    updateOB,
    updateFairway,
    updateShotType,
    addPlayer,
    removePlayer,
    updatePlayerName,
    updatePlayerHDCP,
    resetGame,
    resetScores,
    resetPlayers,
    finishRound,
    getHistory,
    loadGhostData,
  } = useGameContext();
  
  // 未完了ラウンドのチェック
  useEffect(() => {
    const checkUnfinished = async () => {
      const result = await hasUnfinishedRound();
      setHasUnfinished(result);
    };
    
    // ホームタブかつタブ画面の時にチェック
    if (currentTab === 'home' && currentScreen === 'tabs') {
      checkUnfinished();
    }
  }, [currentTab, currentScreen]);

  // コース選択
  const handleCourseSelect = async (courseName) => {
    setSelectedCourse(courseName);
    // コースデータからホール数を設定
    const courseData = getCourseByName(courseName);
    if (courseData) {
      setTotalHoles(courseData.totalHoles);
      
      // 27ホール以外のコースの場合はレイアウト関連をクリア
      if (courseData.totalHoles !== 27) {
        setPlayableHoles(null);
        setSelectedLayout(null);
      }
      
      // 実際のコースデータからホール情報を設定
      const courseHoleData = {};
      if (courseData.holes && courseData.holes.length > 0) {
        courseData.holes.forEach(hole => {
          courseHoleData[hole.holeNumber] = {
            par: hole.par,
            distance: hole.distance
          };
        });
        setHoleData(courseHoleData);
      }
    }
    // ゴーストデータを自動で読み込み
    await loadGhostData(courseName);
    setCurrentScreen('playerSetup');
  };


  // ラウンド開始
  const handleStartRound = async () => {
    // 設定に基づいてゴーストモードを自動有効化
    if (settings.app.ghostMode) {
      await loadGhostData(selectedCourse);
    }
    
    setCurrentScreen('scoreCard');
    // 27ホールコースでplayableHolesが設定されている場合は最初のホールから開始
    if (playableHoles && playableHoles.length > 0) {
      setCurrentHole(playableHoles[0]);
    } else {
      setCurrentHole(startHole);
    }
  };

  // レイアウト更新（27ホール用）
  const handleUpdateLayout = (layout) => {
    if (layout) {
      setSelectedLayout(layout);
      setPlayableHoles(layout.playableHoles);
      // totalHolesは27のまま維持（レイアウト選択表示のため）
    }
  };

  // スコア入力（現在のホール用）
  const handleScoreInput = (playerId, score) => {
    updateScore(currentHole, playerId, score);
  };

  // パット入力（現在のホール用）
  const handlePuttInput = (playerId, putts) => {
    updatePutts(currentHole, playerId, putts);
  };

  // OBトグル（現在のホール用）
  const handleOBToggle = (playerId) => {
    updateOB(currentHole, playerId);
  };

  // フェアウェイトグル（現在のホール用）
  const handleFairwayToggle = (playerId) => {
    updateFairway(currentHole, playerId);
  };

  // ショットタイプ更新（現在のホール用）
  const handleShotTypeUpdate = (playerId, shotType) => {
    updateShotType(currentHole, playerId, shotType);
  };

  // 終了処理
  const handleExit = () => {
    const missingHoles = checkMissingHoles(scores, players);
    
    if (missingHoles.length > 0) {
      showAlert(
        'ラウンド終了確認',
        `${missingHoles.length}箇所の未入力ホールがあります。\n終了しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'サマリーを見る', onPress: () => setCurrentScreen('summary') },
          { text: 'ホームに戻る', onPress: () => {
            setCurrentScreen('tabs');
            setCurrentTab('home');
          }, style: 'destructive' },
        ]
      );
    } else {
      setCurrentScreen('summary');
    }
  };

  // 画面のレンダリング
  const renderScreen = () => {
    // プレイヤー設定画面
    if (currentScreen === 'playerSetup' && selectedCourse) {
      return (
        <PlayerSetupScreen
          players={players}
          playerNames={playerNames}
          playerHDCPSettings={playerHDCPSettings}
          startHole={startHole}
          totalHoles={totalHoles}
          selectedCourse={selectedCourse}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onUpdatePlayerName={updatePlayerName}
          onUpdatePlayerHDCP={updatePlayerHDCP}
          onUpdateStartHole={setStartHole}
          onUpdateLayout={handleUpdateLayout}
          onStartRound={handleStartRound}
          onBack={() => {
            setCurrentScreen('tabs');
            setSelectedCourse(null);
          }}
        />
      );
    }

    // スコアカード画面
    if (currentScreen === 'scoreCard') {
      return (
        <ScoreCardScreen
          currentHole={currentHole}
          startHole={startHole}
          totalHoles={totalHoles}
          playableHoles={playableHoles}
          holeData={holeData}
          scores={scores}
          players={players}
          playerNames={playerNames}
          playerHDCPSettings={playerHDCPSettings}
          ghostMode={ghostMode}
          ghostData={ghostData}
          isGhostActive={isGhostActive}
          onHoleChange={setCurrentHole}
          onScoreInput={handleScoreInput}
          onPuttInput={handlePuttInput}
          onOBToggle={handleOBToggle}
          onFairwayToggle={handleFairwayToggle}
          onShotTypeUpdate={handleShotTypeUpdate}
          onExit={handleExit}
          onGenerateHoleData={generateHoleDataForHole}
        />
      );
    }

    // スコアカード確認画面
    if (currentScreen === 'scoreCardOverview') {
      return (
        <ScoreCardOverviewScreen
          scores={scores}
          holeData={holeData}
          onHoleSelect={(hole) => {
            setCurrentHole(hole);
            setCurrentScreen('scoreCard');
          }}
          onContinue={() => setCurrentScreen('scoreCard')}
          onFinish={() => setCurrentScreen('summary')}
        />
      );
    }

    // サマリー画面
    if (currentScreen === 'summary') {
      return (
        <SummaryScreen
          scores={scores}
          holeData={holeData}
          players={players}
          playerNames={playerNames}
          playerHDCPSettings={playerHDCPSettings}
          selectedCourse={selectedCourse}
          onEditScore={() => setCurrentScreen('scoreCardOverview')}
          onHome={() => {
            // 保存せずにホームへ戻る
            showAlert('確認', 'スコアを保存せずにホームへ戻りますか？', [
              { text: 'キャンセル', style: 'cancel' },
              { 
                text: 'ホームへ戻る', 
                onPress: () => {
                  setCurrentScreen('tabs');
                  setCurrentTab('home');
                  // 現在のラウンドはそのまま残す（続きから機能のため）
                }
              },
            ]);
          }}
          onSave={async () => {
            // 履歴に保存してホームへ戻る
            showAlert('保存確認', 'このラウンドを履歴に保存しますか？', [
              { text: 'キャンセル', style: 'cancel' },
              { 
                text: '保存する', 
                onPress: async () => {
                  const success = await finishRound();
                  if (success) {
                    setHasUnfinished(false); // 続きからボタンを非表示にする
                    showAlert('完了', 'ラウンドを保存しました', [
                      { 
                        text: 'OK', 
                        onPress: () => {
                          setCurrentScreen('tabs');
                          setCurrentTab('home');
                        }
                      }
                    ]);
                  } else {
                    showAlert('エラー', '保存に失敗しました', [
                      { text: 'OK' }
                    ]);
                  }
                }
              },
            ]);
          }}
          onShare={() => {
            showAlert('共有', 'スコアを共有しますか？', [
              { text: 'キャンセル', style: 'cancel' },
              { text: '共有する', onPress: () => {} },
            ]);
          }}
        />
      );
    }

    // 履歴からのサマリー画面（読み取り専用）
    if (currentScreen === 'historySummary') {
      return (
        <SummaryScreen
          scores={scores}
          holeData={holeData}
          players={players}
          playerNames={playerNames}
          playerHDCPSettings={playerHDCPSettings}
          selectedCourse={selectedCourse}
          isReadOnly={true}  // 読み取り専用フラグ
          onEditScore={() => {}} // 編集不可
          onHome={() => {
            // 履歴表示モードを解除
            setIsViewingHistory(false);
            // 履歴データをクリアしてから戻る
            resetGame();
            resetScores();
            resetPlayers();
            // 履歴画面へ戻る
            setCurrentScreen('tabs');
            setCurrentTab('history');
          }}
          onSave={() => {}} // 保存ボタンは非表示
          onShare={() => {
            showAlert('共有', 'スコアを共有しますか？', [
              { text: 'キャンセル', style: 'cancel' },
              { text: '共有する', onPress: () => {} },
            ]);
          }}
        />
      );
    }

    // タブ画面
    return (
      <View style={styles.container}>
        {/* 履歴タブの場合 */}
        {currentTab === 'history' && <HistoryScreen />}
        
        {/* ホームタブの場合 */}
        {currentTab === 'home' && (
          <View style={styles.homeContainer}>
            {/* 未完了ラウンドがある場合は続きからボタンを表示 */}
            {hasUnfinished && (
              <View style={styles.continueSection}>
                <Text style={styles.sectionTitle}>前回の続き</Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    // 続きからプレイ
                    setCurrentScreen('scoreCard');
                  }}
                >
                  <Text style={styles.continueButtonText}>🎯 続きからプレイ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={() => {
                    showAlert('確認', '未完了のラウンドを破棄しますか？', [
                      { text: 'キャンセル', style: 'cancel' },
                      { 
                        text: '破棄する', 
                        style: 'destructive',
                        onPress: async () => {
                          // ストレージから完全にクリア
                          await clearCurrentRound();
                          // メモリ上の状態も完全にリセット
                          resetGame();
                          resetScores();
                          resetPlayers();
                          // フラグを確実にfalseに
                          setHasUnfinished(false);
                        }
                      }
                    ]);
                  }}
                >
                  <Text style={styles.discardButtonText}>🗑️ 破棄する</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* HomeScreenコンポーネントを使用 */}
            <HomeScreen 
              onCourseSelect={async (courseName) => {
                if (hasUnfinished) {
                  showAlert('確認', '現在のラウンドを破棄して新規ラウンドを開始しますか？', [
                    { text: 'キャンセル', style: 'cancel' },
                    { 
                      text: '新規開始', 
                      onPress: async () => {
                        // ストレージから完全にクリア
                        await clearCurrentRound();
                        // メモリ上の状態も完全にリセット
                        resetGame();
                        resetScores();
                        resetPlayers();
                        setHasUnfinished(false);
                        handleCourseSelect(courseName);
                      }
                    },
                  ]);
                } else {
                  handleCourseSelect(courseName);
                }
              }}
            />
          </View>
        )}
        
        {/* 統計タブの場合 */}
        {currentTab === 'statistics' && <StatisticsScreen />}
        
        {/* フレンドタブの場合 */}
        {currentTab === 'friends' && <FriendsScreen />}
        
        {/* 設定タブの場合 */}
        {currentTab === 'settings' && <SettingsScreen />}

        <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'home' && styles.activeTab]}
              onPress={() => setCurrentTab('home')}
            >
              <Text style={[styles.tabText, currentTab === 'home' && styles.activeTabText]}>🏠 ホーム</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'history' && styles.activeTab]}
              onPress={() => setCurrentTab('history')}
            >
              <Text style={[styles.tabText, currentTab === 'history' && styles.activeTabText]}>📊 履歴</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'statistics' && styles.activeTab]}
              onPress={() => setCurrentTab('statistics')}
            >
              <Text style={[styles.tabText, currentTab === 'statistics' && styles.activeTabText]}>📈 統計</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'friends' && styles.activeTab]}
              onPress={() => setCurrentTab('friends')}
            >
              <Text style={[styles.tabText, currentTab === 'friends' && styles.activeTabText]}>👥 フレンド</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'settings' && styles.activeTab]}
              onPress={() => setCurrentTab('settings')}
            >
              <Text style={[styles.tabText, currentTab === 'settings' && styles.activeTabText]}>⚙️ 設定</Text>
            </TouchableOpacity>
          </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <CustomModal
        visible={!!alertModal}
        title={alertModal?.title}
        message={alertModal?.message}
        buttons={alertModal?.buttons || []}
        onClose={hideAlert}
      />
      <StatusBar style="auto" />
    </View>
  );
};

// メインアプリ（Provider付き）
export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  homeContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  courseSelection: {
    flex: 1,
    marginVertical: 20,
  },
  continueSection: {
    marginVertical: 20,
  },
  continueButton: {
    backgroundColor: '#FF9800',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F57C00',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  discardButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  discardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#555',
  },
  courseButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  courseButtonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
    marginTop: -11,
    paddingTop: 8,
  },
  tabText: {
    fontSize: 12,
    color: '#999',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});