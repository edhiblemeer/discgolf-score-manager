import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import React, { useContext } from 'react';
import { GameProvider, useGameContext } from './src/contexts/GameContext';
import CustomModal from './src/components/Common/CustomModal';
import ScoreCardScreen from './src/components/ScoreCard/ScoreCardScreen';
import ScoreCardOverviewScreen from './src/components/ScoreCard/ScoreCardOverviewScreen';
import SummaryScreen from './src/components/Summary/SummaryScreen';
import PlayerSetupScreen from './src/components/PlayerSettings/PlayerSetupScreen';
import { checkMissingHoles } from './src/utils/scoreHelpers';

// メインアプリコンテンツ（Context利用）
const AppContent = () => {
  const {
    currentTab,
    currentScreen,
    selectedCourse,
    currentHole,
    startHole,
    ghostMode,
    players,
    playerNames,
    scores,
    holeData,
    alertModal,
    setCurrentTab,
    setCurrentScreen,
    setSelectedCourse,
    setCurrentHole,
    setStartHole,
    setGhostMode,
    setHoleData,
    showAlert,
    hideAlert,
    generateHoleDataForHole,
    updateScore,
    updatePutts,
    updateOB,
    updateFairway,
    addPlayer,
    removePlayer,
    updatePlayerName,
    resetGame,
  } = useGameContext();

  // コース選択
  const handleCourseSelect = (courseName) => {
    setSelectedCourse(courseName);
    setCurrentScreen('playerSetup');
  };

  // ラウンド開始
  const handleStartRound = () => {
    setCurrentScreen('scoreCard');
    setCurrentHole(startHole);
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
          startHole={startHole}
          selectedCourse={selectedCourse}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onUpdatePlayerName={updatePlayerName}
          onUpdateStartHole={setStartHole}
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
          holeData={holeData}
          scores={scores}
          players={players}
          playerNames={playerNames}
          ghostMode={ghostMode}
          onHoleChange={setCurrentHole}
          onScoreInput={handleScoreInput}
          onPuttInput={handlePuttInput}
          onOBToggle={handleOBToggle}
          onFairwayToggle={handleFairwayToggle}
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
          playerNames={playerNames}
          selectedCourse={selectedCourse}
          onEditScore={() => setCurrentScreen('scoreCardOverview')}
          onHome={() => {
            setCurrentScreen('tabs');
            setCurrentTab('home');
            resetGame();
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

    // タブ画面（ホーム）
    return (
      <View style={styles.container}>
        <View style={styles.homeContainer}>
          <Text style={styles.title}>ディスクゴルフ スコア管理</Text>
          
          <View style={styles.courseSelection}>
            <Text style={styles.sectionTitle}>コース選択</Text>
            {['朝霧ジャンボリー', '富士山麓', '東京ベイ', 'その他'].map(course => (
              <TouchableOpacity
                key={course}
                style={styles.courseButton}
                onPress={() => handleCourseSelect(course)}
              >
                <Text style={styles.courseButtonText}>{course}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'home' && styles.activeTab]}
              onPress={() => setCurrentTab('home')}
            >
              <Text style={styles.tabText}>🏠 ホーム</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'scorecard' && styles.activeTab]}
              onPress={() => setCurrentTab('scorecard')}
            >
              <Text style={styles.tabText}>📝 スコアカード</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'history' && styles.activeTab]}
              onPress={() => setCurrentTab('history')}
            >
              <Text style={styles.tabText}>📊 履歴</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'settings' && styles.activeTab]}
              onPress={() => setCurrentTab('settings')}
            >
              <Text style={styles.tabText}>⚙️ 設定</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
});