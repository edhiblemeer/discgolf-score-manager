import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { useState } from 'react';
import { GameProvider } from './src/contexts/GameContext';
import CustomModal from './src/components/Common/CustomModal';
import ScoreButtons from './src/components/ScoreInput/ScoreButtons';
import ScoreCardScreen from './src/components/ScoreCard/ScoreCardScreen';
import ScoreCardOverviewScreen from './src/components/ScoreCard/ScoreCardOverviewScreen';
import SummaryScreen from './src/components/Summary/SummaryScreen';
import { generateHoleData, getDefaultPar, getDefaultDistance } from './src/utils/holeData';
import { 
  calculateTotalScore, 
  calculateOutScore, 
  calculateInScore, 
  calculateRoundStats,
  checkMissingHoles 
} from './src/utils/scoreHelpers';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('tabs'); // tabs, playerSetup, scoreCard, scoreCardOverview, summary
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState({});
  const [players, setPlayers] = useState([{ name: 'プレイヤー1' }]);
  const [playerNames, setPlayerNames] = useState(['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']);
  const [ghostMode, setGhostMode] = useState(null);
  const [holeData, setHoleData] = useState({}); // 各ホールのPARと距離を保存
  const [startHole, setStartHole] = useState(1); // スタートホール
  const [alertModal, setAlertModal] = useState(null); // カスタムアラート用

  // カスタムアラート関数（Web対応）
  const showAlert = (title, message, buttons) => {
    setAlertModal({ title, message, buttons });
  };

  // コース選択ハンドラー
  const handleCourseSelect = (courseName) => {
    setSelectedCourse(courseName);
    setCurrentScreen('playerSetup');
  };

  // ゲーム開始ハンドラー
  const handleStartRound = () => {
    setCurrentScreen('scoreCard');
    setCurrentHole(startHole); // スタートホールから開始
    setScores({});
    setHoleData({}); // 新しいラウンドでホールデータをリセット
  };

  // スコア記録ハンドラー
  const handleScoreInput = (playerId, score) => {
    const updatedScores = {
      ...scores,
      [`${currentHole}-${playerId}`]: {
        score: score,
        putts: scores[`${currentHole}-${playerId}`]?.putts || null,
        ob: scores[`${currentHole}-${playerId}`]?.ob || false,
        fairway: scores[`${currentHole}-${playerId}`]?.fairway || false
      }
    };
    setScores(updatedScores);
    
    // ラウンド終了チェック（自動完了時はアラート表示）
    setTimeout(() => {
      checkRoundCompletion(updatedScores, true);
    }, 100);
  };

  // ラウンド終了チェック関数（戻り値付き）
  const checkRoundCompletion = (currentScores = scores, showAlertFlag = false) => {
    let allPlayersCompleted = true;
    const missingHoles = [];
    
    // 各プレイヤーが全18ホール完了しているかチェック
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      let playerCompletedHoles = 0;
      for (let h = 1; h <= 18; h++) {
        if (currentScores[`${h}-${playerIndex}`]?.score !== undefined) {
          playerCompletedHoles++;
        }
      }
      if (playerCompletedHoles < 18) {
        allPlayersCompleted = false;
      }
    }
    
    // 未入力ホールを特定
    if (!allPlayersCompleted) {
      for (let h = 1; h <= 18; h++) {
        let holeMissing = false;
        for (let p = 0; p < players.length; p++) {
          if (!currentScores[`${h}-${p}`]?.score) {
            holeMissing = true;
            break;
          }
        }
        if (holeMissing) {
          missingHoles.push(h);
        }
      }
    }
    
    // アラート表示フラグが立っている場合のみアラートを表示
    if (showAlertFlag && allPlayersCompleted) {
      showAlert(
        'ラウンド終了',
        '全18ホールの入力が完了しました。\nラウンドを終了しますか？',
        [
          {
            text: 'いいえ',
            style: 'cancel',
          },
          {
            text: 'はい',
            onPress: () => {
              setCurrentScreen('summary');
            },
          },
        ],
      );
    }
    
    return { allPlayersCompleted, missingHoles };
  };

  // パット数記録ハンドラー
  const handlePuttInput = (playerId, putts) => {
    setScores({
      ...scores,
      [`${currentHole}-${playerId}`]: {
        ...scores[`${currentHole}-${playerId}`],
        putts: putts
      }
    });
  };

  // OB記録ハンドラー
  const handleOBToggle = (playerId) => {
    const current = scores[`${currentHole}-${playerId}`]?.ob || false;
    setScores({
      ...scores,
      [`${currentHole}-${playerId}`]: {
        ...scores[`${currentHole}-${playerId}`],
        ob: !current
      }
    });
  };

  // フェアウェイ記録ハンドラー
  const handleFairwayToggle = (playerId) => {
    const current = scores[`${currentHole}-${playerId}`]?.fairway || false;
    setScores({
      ...scores,
      [`${currentHole}-${playerId}`]: {
        ...scores[`${currentHole}-${playerId}`],
        fairway: !current
      }
    });
  };

  // プレイヤー設定画面
  const renderPlayerSetup = () => {
    return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>⚙️ プレイヤー設定</Text>
          <Text style={styles.subTitle}>📍 {selectedCourse}</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>プレイヤー数</Text>
            <View style={styles.playerButtonRow}>
              <TouchableOpacity 
                style={[styles.playerButton, players.length === 1 && styles.activePlayerButton]}
                onPress={() => setPlayers([{ name: playerNames[0] }])}
              >
                <Text style={styles.playerButtonText}>1人</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.playerButton, players.length === 2 && styles.activePlayerButton]}
                onPress={() => setPlayers([{ name: playerNames[0] }, { name: playerNames[1] }])}
              >
                <Text style={styles.playerButtonText}>2人</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.playerButton, players.length === 3 && styles.activePlayerButton]}
                onPress={() => setPlayers([{ name: playerNames[0] }, { name: playerNames[1] }, { name: playerNames[2] }])}
              >
                <Text style={styles.playerButtonText}>3人</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.playerButton, players.length === 4 && styles.activePlayerButton]}
                onPress={() => setPlayers([{ name: playerNames[0] }, { name: playerNames[1] }, { name: playerNames[2] }, { name: playerNames[3] }])}
              >
                <Text style={styles.playerButtonText}>4人</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>プレイヤー名</Text>
            {players.map((player, index) => (
              <View key={index} style={styles.playerNameInput}>
                <Text style={styles.playerLabel}>プレイヤー{index + 1}:</Text>
                <TextInput
                  style={styles.nameInput}
                  value={playerNames[index]}
                  onChangeText={(text) => {
                    const newNames = [...playerNames];
                    newNames[index] = text.slice(0, 10); // 最大10文字
                    setPlayerNames(newNames);
                    const newPlayers = [...players];
                    newPlayers[index] = { name: text.slice(0, 10) };
                    setPlayers(newPlayers);
                  }}
                  placeholder={`プレイヤー${index + 1}`}
                  maxLength={10}
                />
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>ゴーストモード</Text>
            <TouchableOpacity 
              style={[styles.ghostOption, ghostMode === 'recent' && styles.activeGhostOption]}
              onPress={() => setGhostMode(ghostMode === 'recent' ? null : 'recent')}
            >
              <Text>👻 直近のラウンド</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.ghostOption, ghostMode === 'best' && styles.activeGhostOption]}
              onPress={() => setGhostMode(ghostMode === 'best' ? null : 'best')}
            >
              <Text>🏆 ベストラウンド</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>スタートホール</Text>
            <View style={styles.startHoleContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.holeScrollView}>
                <View style={styles.holeButtonRow}>
                  {[...Array(18)].map((_, i) => (
                    <TouchableOpacity
                      key={i + 1}
                      style={[
                        styles.holeButton,
                        startHole === i + 1 && styles.selectedHoleButton
                      ]}
                      onPress={() => setStartHole(i + 1)}
                    >
                      <Text style={[
                        styles.holeButtonText,
                        startHole === i + 1 && styles.selectedHoleButtonText
                      ]}>
                        {i + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <Text style={styles.startHoleHint}>
              ※ショットガン方式や途中からのプレイに対応
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartRound}>
            <Text style={styles.primaryButtonText}>🎯 ホール{startHole}から開始</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('tabs')}>
            <Text style={styles.secondaryButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>
        <CustomModal 
          visible={!!alertModal}
          title={alertModal?.title}
          message={alertModal?.message}
          buttons={alertModal?.buttons || []}
          onClose={() => setAlertModal(null)}
        />
      </View>
    </View>
  );
};

// スコアカード画面
const renderScoreCard = () => {
  // ホールデータが無ければ生成して保存（より現実的な設定）
  if (!holeData[currentHole]) {
    // 一般的な18ホールのコース設定
    const holeTemplates = [
      { par: 4, minDist: 280, maxDist: 380 }, // PAR4: 280-380m
      { par: 3, minDist: 120, maxDist: 180 }, // PAR3: 120-180m
      { par: 5, minDist: 420, maxDist: 520 }, // PAR5: 420-520m
      { par: 4, minDist: 300, maxDist: 400 }, // PAR4: 300-400m
      { par: 3, minDist: 140, maxDist: 200 }, // PAR3: 140-200m
      { par: 4, minDist: 320, maxDist: 420 }, // PAR4: 320-420m
    ];
    
    // ホール番号に基づいてテンプレートを選択
    const template = holeTemplates[currentHole % 6];
    const distance = template.minDist + Math.floor(Math.random() * (template.maxDist - template.minDist));
    
    const newHoleData = {
      ...holeData,
      [currentHole]: {
        par: template.par,
        distance: distance
      }
    };
    setHoleData(newHoleData);
  }
  
  const holePar = holeData[currentHole]?.par || 4;
  const holeDistance = holeData[currentHole]?.distance || 250;
  
  return (
      <View style={styles.container}>
        <View style={styles.scoreCardHeader}>
          <Text style={styles.holeTitle}>Hole {currentHole} - Par {holePar} - {holeDistance}m</Text>
          <TouchableOpacity onPress={() => {
            // 未入力ホールをチェック
            const missingHoles = [];
            for (let h = 1; h <= 18; h++) {
              if (!scores[`${h}-0`]?.score) {
                missingHoles.push(h);
              }
            }
            
            if (missingHoles.length > 0) {
              // 未入力がある場合
              showAlert(
                'ラウンド終了確認',
                `${missingHoles.length}箇所の未入力ホールがあります。\n終了しますか？`,
                [
                  {
                    text: 'キャンセル',
                    style: 'cancel',
                  },
                  {
                    text: 'サマリーを見る',
                    onPress: () => {
                      setCurrentScreen('summary');
                    },
                  },
                  {
                    text: 'ホームに戻る',
                    onPress: () => {
                      setCurrentScreen('tabs');
                      setCurrentTab('home');
                    },
                    style: 'destructive',
                  },
                ],
              );
            } else {
              // 未入力がない場合、直接サマリー画面へ
              setCurrentScreen('summary');
            }
          }}>
            <Text style={styles.exitText}>✕ 終了</Text>
          </TouchableOpacity>
        </View>


        {ghostMode && (
          <View style={styles.ghostCard}>
            <Text style={styles.ghostTitle}>👻 ゴースト: パー (3)</Text>
            <Text style={styles.ghostDiff}>📉 1打リード中</Text>
            <Text style={styles.ghostTotal}>合計: -2 vs ゴースト</Text>
          </View>
        )}

        <ScrollView style={styles.scoreCardContent}>
          {players.map((player, index) => (
            <View key={index} style={styles.playerCard}>
              <Text style={styles.playerName}>{player.name || player}</Text>
              
              {/* スコア入力 */}
                <View>
                  {/* 現在のスコア表示とカウンター */}
                  <View style={styles.scoreCounterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => {
                        const currentScore = scores[`${currentHole}-${index}`]?.score || holePar;
                        if (currentScore > 1) handleScoreInput(index, currentScore - 1);
                      }}
                    >
                      <Text style={styles.counterButtonText}>−</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.scoreDisplay}>
                      <Text style={styles.scoreDisplayNumber}>
                        {scores[`${currentHole}-${index}`]?.score || holePar}
                      </Text>
                      <Text style={styles.scoreDisplayLabel}>
                        {(() => {
                          const score = scores[`${currentHole}-${index}`]?.score || holePar;
                          const diff = score - holePar;
                          if (score === 1) return '⭐ ACE!';
                          if (diff === -3) return '🦅 アルバトロス';
                          if (diff === -2) return '🦅 イーグル';
                          if (diff === -1) return '🐦 バーディー';
                          if (diff === 0) return '⛳ パー';
                          if (diff === 1) return 'ボギー';
                          if (diff === 2) return 'ダブルボギー';
                          if (diff === 3) return 'トリプルボギー';
                          if (diff >= 4) return `+${diff}`;
                          return '';
                        })()}
                      </Text>
                      <Text style={styles.scoreDisplayDiff}>
                        {(() => {
                          const score = scores[`${currentHole}-${index}`]?.score || holePar;
                          const diff = score - holePar;
                          if (diff === 0) return 'PAR';
                          if (diff > 0) return `+${diff}`;
                          return `${diff}`;
                        })()}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => {
                        const currentScore = scores[`${currentHole}-${index}`]?.score || holePar;
                        if (currentScore < 15) handleScoreInput(index, currentScore + 1);
                      }}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* パーボタン */}
                  <TouchableOpacity 
                    style={[
                      styles.parButton,
                      scores[`${currentHole}-${index}`]?.score === holePar && styles.selectedParButton
                    ]}
                    onPress={() => handleScoreInput(index, holePar)}
                  >
                    <Text style={[
                      styles.parButtonText,
                      scores[`${currentHole}-${index}`]?.score === holePar && styles.selectedParButtonText
                    ]}>
                      ⛳ パー記録
                    </Text>
                  </TouchableOpacity>

                  {/* 合計スコア表示 */}
                  <View style={[
                    styles.totalScoreContainer,
                    index === 0 ? styles.totalScoreContainerWithProgress : styles.totalScoreContainerCompact
                  ]}>
                    <View style={styles.totalScoreBox}>
                      <Text style={styles.totalScoreLabel}>合計スコア</Text>
                      <Text style={styles.totalScoreNumber}>
                        {(() => {
                          let total = 0;
                          for (let h = 1; h <= currentHole; h++) {
                            const score = scores[`${h}-${index}`]?.score;
                            if (score) total += score;
                          }
                          return total || '-';
                        })()}
                      </Text>
                      <Text style={styles.totalScoreDiff}>
                        {(() => {
                          let total = 0;
                          let parTotal = 0;
                          for (let h = 1; h <= currentHole; h++) {
                            const score = scores[`${h}-${index}`]?.score;
                            if (score) {
                              total += score;
                              // 保存されたPAR値を使用、なければデフォルト値
                              parTotal += holeData[h]?.par || 4;
                            }
                          }
                          if (total === 0) return '';
                          const diff = total - parTotal;
                          if (diff === 0) return 'E (Even)';
                          if (diff > 0) return `+${diff}`;
                          return `${diff}`;
                        })()}
                      </Text>
                    </View>
                    
                    {/* プレイヤー1の場合のみプログレスバー表示 */}
                    {index === 0 && (
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>
                          {(() => {
                            let completed = 0;
                            for (let h = 1; h <= 18; h++) {
                              if (scores[`${h}-${index}`]?.score !== undefined) completed++;
                            }
                            return `${completed}/18 ホール完了`;
                          })()}
                        </Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${(() => {
                                  let completed = 0;
                                  for (let h = 1; h <= 18; h++) {
                                    if (scores[`${h}-${index}`]?.score !== undefined) completed++;
                                  }
                                  return (completed / 18) * 100;
                                })()}%` 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </View>

              {/* プレイヤー1のみパット数、OB、フェアウェイ表示 */}
              {index === 0 && (
                <>
                  <Text style={styles.scoreLabel}>パット数</Text>
                  <View style={styles.puttButtonRow}>
                    {[0, 1, 2, 3, 4].map(putts => (
                      <TouchableOpacity 
                        key={putts} 
                        style={[
                          styles.puttButton,
                          scores[`${currentHole}-${index}`]?.putts === putts && styles.selectedPuttButton
                        ]}
                        onPress={() => handlePuttInput(index, putts)}
                      >
                        <Text style={[
                          styles.puttButtonText,
                          scores[`${currentHole}-${index}`]?.putts === putts && styles.selectedPuttText
                        ]}>{putts === 4 ? '4+' : putts}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.optionRow}>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton,
                        scores[`${currentHole}-${index}`]?.ob && styles.activeOption
                      ]}
                      onPress={() => handleOBToggle(index)}
                    >
                      <Text style={scores[`${currentHole}-${index}`]?.ob && styles.activeOptionText}>
                        OB {scores[`${currentHole}-${index}`]?.ob ? '✅' : '❌'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton,
                        scores[`${currentHole}-${index}`]?.fairway && styles.activeOption
                      ]}
                      onPress={() => handleFairwayToggle(index)}
                    >
                      <Text style={scores[`${currentHole}-${index}`]?.fairway && styles.activeOptionText}>
                        フェアウェイ {scores[`${currentHole}-${index}`]?.fairway ? '✅' : '⬜'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.navigationRow}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => {
              // 前のホール番号を計算（1→18でループ）
              const prevHole = currentHole === 1 ? 18 : currentHole - 1;
              setCurrentHole(prevHole);
            }}
          >
            <Text style={styles.navButtonText}>← 前のホール</Text>
          </TouchableOpacity>
          
          {/* スコアカード確認ボタン（中央に小さく配置） */}
          <TouchableOpacity 
            style={[styles.navButton, { 
              flex: 0.6, 
              backgroundColor: '#2196F3',
              marginHorizontal: 8
            }]}
            onPress={() => setCurrentScreen('scoreCardOverview')}
          >
            <Text style={[styles.navButtonText, { fontSize: 18 }]}>📋</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => {
              // ラウンド完了状態をチェック
              const { allPlayersCompleted, missingHoles } = checkRoundCompletion();
              
              if (currentHole === 18) {
                // 18ホール目の処理
                if (allPlayersCompleted) {
                  // 全プレイヤーが18ホール完了 → サマリー画面へ
                  setCurrentScreen('summary');
                } else {
                  // 未入力がある場合 → 確認ダイアログ
                  showAlert(
                    '未入力ホールがあります',
                    `${missingHoles.length}箇所の未入力ホールがあります。\nどうしますか？`,
                    [
                      {
                        text: 'キャンセル',
                        style: 'cancel',
                      },
                      {
                        text: 'スコアカード確認',
                        onPress: () => {
                          setCurrentScreen('scoreCardOverview');
                        },
                      },
                      {
                        text: '1番ホールへ',
                        onPress: () => {
                          setCurrentHole(1);
                        },
                      },
                    ],
                  );
                }
              } else {
                // 通常の次のホールへ
                setCurrentHole(currentHole + 1);
              }
            }}
          >
            <Text style={styles.navButtonText}>
              {currentHole === 18 ? 'ラウンド終了 →' : '次のホール →'}
            </Text>
          </TouchableOpacity>
        </View>
        <CustomModal 
          visible={!!alertModal}
          title={alertModal?.title}
          message={alertModal?.message}
          buttons={alertModal?.buttons || []}
          onClose={() => setAlertModal(null)}
        />
      </View>
  );
  };

// スコアカード確認画面
const renderScoreCardOverview = () => {
    // 未入力ホールのチェック
    const checkMissingHoles = () => {
      const missingHoles = [];
      for (let h = 1; h <= 18; h++) {
        if (!scores[`${h}-0`]?.score) {
          missingHoles.push(h);
        }
      }
      return missingHoles;
    };

    const missingHoles = checkMissingHoles();

    // スコア取得ヘルパー関数
    const getScore = (hole) => {
      return scores[`${hole}-0`]?.score || '-';
    };

    // パー取得ヘルパー関数
    const getPar = (hole) => {
      return holeData[hole]?.par || 4;
    };

    // 合計スコア計算
    const calculateTotalForRange = (startHole, endHole) => {
      let total = 0;
      let parTotal = 0;
      let hasScore = false;
      
      for (let h = startHole; h <= endHole; h++) {
        const score = scores[`${h}-0`]?.score;
        if (score) {
          total += score;
          hasScore = true;
        }
        parTotal += holeData[h]?.par || 4;
      }
      
      return hasScore ? { total, parTotal, diff: total - parTotal } : null;
    };

    const outTotal = calculateTotalForRange(1, 9);
    const inTotal = calculateTotalForRange(10, 18);
    const grandTotal = calculateTotalForRange(1, 18);

    return (
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.scoreCardHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('scoreCard')}>
            <Text style={styles.exitText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.holeTitle}>スコアカード確認</Text>
          <TouchableOpacity onPress={() => {
            if (missingHoles.length > 0) {
              showAlert(
                '未入力ホールがあります',
                `${missingHoles.length}箇所の未入力ホールがあります。\n終了しますか？`,
                [
                  {
                    text: 'キャンセル',
                    style: 'cancel',
                  },
                  {
                    text: '終了する',
                    onPress: () => {
                      setCurrentScreen('summary');
                    },
                  },
                ],
              );
            } else {
              setCurrentScreen('summary');
            }
          }}>
            <Text style={styles.exitText}>終了 →</Text>
          </TouchableOpacity>
        </View>

        {/* 未入力警告 */}
        {missingHoles.length > 0 && (
          <View style={styles.overviewWarning}>
            <Text style={styles.overviewWarningText}>
              ⚠️ {missingHoles.length}箇所の未入力ホールがあります
            </Text>
          </View>
        )}

        {/* スコアカード */}
        <ScrollView style={styles.overviewScrollView}>
          <View style={styles.overviewCard}>
            {/* OUT (1-9H) */}
            <View style={styles.overviewSection}>
              <Text style={styles.overviewSectionTitle}>OUT (1-9H)</Text>
              <View style={styles.overviewTable}>
                {/* ホール番号行 */}
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewHeaderCell}>H</Text>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
                    <Text key={hole} style={styles.overviewHoleCell}>{hole}</Text>
                  ))}
                  <Text style={styles.overviewTotalHeaderCell}>計</Text>
                </View>
                
                {/* パー行 */}
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewHeaderCell}>Par</Text>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
                    <Text key={hole} style={styles.overviewParCell}>{getPar(hole)}</Text>
                  ))}
                  <Text style={styles.overviewTotalCell}>{outTotal?.parTotal || '-'}</Text>
                </View>
                
                {/* スコア行 */}
                <View style={styles.overviewRowLast}>
                  <Text style={styles.overviewHeaderCell}>スコア</Text>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
                    <TouchableOpacity
                      key={hole}
                      style={{ flex: 1 }}
                      onPress={() => {
                        setCurrentHole(hole);
                        setCurrentScreen('scoreCard');
                      }}
                    >
                      <Text style={[
                        styles.overviewScoreCell,
                        !scores[`${hole}-0`]?.score && styles.overviewMissingCell
                      ]}>
                        {getScore(hole)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.overviewTotalCell}>
                    {outTotal?.total || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* IN (10-18H) */}
            <View style={styles.overviewSection}>
              <Text style={styles.overviewSectionTitle}>IN (10-18H)</Text>
              <View style={styles.overviewTable}>
                {/* ホール番号行 */}
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewHeaderCell}>H</Text>
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
                    <Text key={hole} style={styles.overviewHoleCell}>{hole}</Text>
                  ))}
                  <Text style={styles.overviewTotalHeaderCell}>計</Text>
                </View>
                
                {/* パー行 */}
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewHeaderCell}>Par</Text>
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
                    <Text key={hole} style={styles.overviewParCell}>{getPar(hole)}</Text>
                  ))}
                  <Text style={styles.overviewTotalCell}>{inTotal?.parTotal || '-'}</Text>
                </View>
                
                {/* スコア行 */}
                <View style={styles.overviewRowLast}>
                  <Text style={styles.overviewHeaderCell}>スコア</Text>
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
                    <TouchableOpacity
                      key={hole}
                      style={{ flex: 1 }}
                      onPress={() => {
                        setCurrentHole(hole);
                        setCurrentScreen('scoreCard');
                      }}
                    >
                      <Text style={[
                        styles.overviewScoreCell,
                        !scores[`${hole}-0`]?.score && styles.overviewMissingCell
                      ]}>
                        {getScore(hole)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.overviewTotalCell}>
                    {inTotal?.total || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 総合計 */}
            {grandTotal && (
              <View style={styles.overviewGrandTotal}>
                <Text style={styles.overviewGrandTotalLabel}>TOTAL</Text>
                <Text style={styles.overviewGrandTotalScore}>
                  {grandTotal.total} ({grandTotal.diff >= 0 ? '+' : ''}{grandTotal.diff})
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <CustomModal 
          visible={!!alertModal}
          title={alertModal?.title}
          message={alertModal?.message}
          buttons={alertModal?.buttons || []}
          onClose={() => setAlertModal(null)}
        />
      </View>
  );
};

// サマリー画面レンダリング
const renderSummary = () => {
    // 総合スコア計算
    const calculateTotalScore = () => {
      let total = 0;
      let parTotal = 0;
      for (let h = 1; h <= 18; h++) {
        const score = scores[`${h}-0`]?.score;
        if (score) {
          total += score;
          parTotal += holeData[h]?.par || 4;
        }
      }
      return { total, parTotal, diff: total - parTotal };
    };

    // フェアウェイキープ率計算
    const calculateFairwayKeepRate = () => {
      let fairwayHit = 0;
      let validHoles = 0;
      for (let h = 1; h <= 18; h++) {
        const holeScore = scores[`${h}-0`];
        if (holeScore?.fairway !== undefined) {
          validHoles++;
          if (holeScore.fairway) fairwayHit++;
        }
      }
      return validHoles > 0 ? Math.round((fairwayHit / validHoles) * 100) : 0;
    };

    // 合計パット数計算
    const calculateTotalPutts = () => {
      let totalPutts = 0;
      for (let h = 1; h <= 18; h++) {
        const putts = scores[`${h}-0`]?.putts;
        if (putts !== undefined && putts !== null) {
          totalPutts += putts;
        }
      }
      return totalPutts;
    };

    // 合計OB数計算
    const calculateTotalOB = () => {
      let totalOB = 0;
      for (let h = 1; h <= 18; h++) {
        const ob = scores[`${h}-0`]?.ob;
        if (ob !== undefined && ob !== null) {
          totalOB += ob;
        }
      }
      return totalOB;
    };
    
    // 未入力ホールをチェック
    const checkMissingHoles = () => {
      const missingHoles = [];
      for (let h = 1; h <= 18; h++) {
        if (!scores[`${h}-0`]?.score) {
          missingHoles.push(h);
        }
      }
      return missingHoles;
    };

    const { total, parTotal, diff } = calculateTotalScore();
    const fairwayKeep = calculateFairwayKeepRate();
    const totalPutts = calculateTotalPutts();
    const totalOB = calculateTotalOB();
    const missingHoles = checkMissingHoles();

    return (
      <View style={styles.container}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>🏆 ラウンド完了！</Text>
          <Text style={styles.summarySubtitle}>{selectedCourse}</Text>
        </View>

        {/* 未入力ホールの警告 */}
        {missingHoles.length > 0 && (
          <View style={styles.missingHolesWarning}>
            <Text style={styles.missingHolesTitle}>⚠️ 未入力ホール</Text>
            <View style={styles.missingHolesList}>
              {missingHoles.map((hole) => (
                <TouchableOpacity 
                  key={hole}
                  style={styles.missingHoleButton}
                  onPress={() => {
                    setCurrentHole(hole);
                    setCurrentScreen('scoreCard');
                  }}
                >
                  <Text style={styles.missingHoleText}>{hole}H</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.missingHolesSubtext}>タップして入力画面へ</Text>
          </View>
        )}

        {/* 総合スコア */}
        <View style={styles.summaryScoreCard}>
          <Text style={styles.summaryScoreTitle}>総合スコア</Text>
          <View style={styles.summaryScoreDisplay}>
            <Text style={styles.summaryScoreNumber}>{total}</Text>
            <Text style={styles.summaryScoreDiff}>
              ({diff === 0 ? 'EVEN' : diff > 0 ? `+${diff}` : `${diff}`})
            </Text>
          </View>
        </View>

        {/* 統計情報 */}
        <View style={styles.summaryStatsCard}>
          <Text style={styles.summaryStatsTitle}>ラウンド統計</Text>
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>FWキープ率</Text>
              <Text style={styles.summaryStatValue}>{fairwayKeep}%</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>合計パット</Text>
              <Text style={styles.summaryStatValue}>{totalPutts}</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>OB数</Text>
              <Text style={styles.summaryStatValue}>{totalOB}</Text>
            </View>
          </View>
        </View>

        {/* スコアカード表 */}
        <ScrollView style={styles.summaryScrollView}>
          <View style={styles.summaryScoreCard}>
            <Text style={styles.summaryScoreCardTitle}>スコアカード</Text>
            
            {/* 2列構成のスコアカード */}
            <View style={styles.summaryTwoColumnContainer}>
              
              {/* OUTホール */}
              <View style={styles.summaryHalfTable}>
                <Text style={styles.summaryHalfTableTitle}>OUT</Text>
                
                {/* ヘッダー */}
                <View style={styles.summaryTableHeader}>
                  <Text style={styles.summaryTableHeaderText}>H</Text>
                  <Text style={styles.summaryTableHeaderText}>P</Text>
                  <Text style={styles.summaryTableHeaderText}>S</Text>
                  <Text style={styles.summaryTableHeaderText}>Pt</Text>
                </View>

                {/* 1-9ホールのデータ */}
                {[...Array(9)].map((_, i) => {
                  const hole = i + 1;
                  const holeScore = scores[`${hole}-0`];
                  const par = holeData[hole]?.par || 4;
                  
                  return (
                    <View key={hole} style={styles.summaryTableRow}>
                      <Text style={styles.summaryTableCellHole}>{hole}</Text>
                      <Text style={styles.summaryTableCellPar}>{par}</Text>
                      <Text style={styles.summaryTableCellScore}>
                        {holeScore?.score || '-'}
                      </Text>
                      <Text style={styles.summaryTableCellPutts}>
                        {holeScore?.putts !== undefined && holeScore?.putts !== null && holeScore?.putts !== 0 ? holeScore.putts : '-'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* INホール */}
              <View style={styles.summaryHalfTable}>
                <Text style={styles.summaryHalfTableTitle}>IN</Text>
                
                {/* ヘッダー */}
                <View style={styles.summaryTableHeader}>
                  <Text style={styles.summaryTableHeaderText}>H</Text>
                  <Text style={styles.summaryTableHeaderText}>P</Text>
                  <Text style={styles.summaryTableHeaderText}>S</Text>
                  <Text style={styles.summaryTableHeaderText}>Pt</Text>
                </View>

                {/* 10-18ホールのデータ */}
                {[...Array(9)].map((_, i) => {
                  const hole = i + 10;
                  const holeScore = scores[`${hole}-0`];
                  const par = holeData[hole]?.par || 4;
                  
                  return (
                    <View key={hole} style={styles.summaryTableRow}>
                      <Text style={styles.summaryTableCellHole}>{hole}</Text>
                      <Text style={styles.summaryTableCellPar}>{par}</Text>
                      <Text style={styles.summaryTableCellScore}>
                        {holeScore?.score || '-'}
                      </Text>
                      <Text style={styles.summaryTableCellPutts}>
                        {holeScore?.putts !== undefined && holeScore?.putts !== null && holeScore?.putts !== 0 ? holeScore.putts : '-'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              
            </View>
          </View>
        </ScrollView>

        {/* ボタン */}
        <View style={styles.summaryButtons}>
          <TouchableOpacity 
            style={styles.summaryButton}
            onPress={() => {
              setCurrentScreen('scoreCardOverview');
            }}
          >
            <Text style={styles.summaryButtonText}>✏️ スコア編集</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.summaryButton}
            onPress={() => {
              setCurrentScreen('tabs');
              setCurrentTab('history');
            }}
          >
            <Text style={styles.summaryButtonText}>📊 履歴に保存</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.summaryButton, styles.summaryButtonSecondary]}
            onPress={() => {
              setCurrentScreen('tabs');
              setCurrentTab('home');
            }}
          >
            <Text style={styles.summaryButtonText}>🏠 ホームに戻る</Text>
          </TouchableOpacity>
        </View>
        <CustomModal 
          visible={!!alertModal}
          title={alertModal?.title}
          message={alertModal?.message}
          buttons={alertModal?.buttons || []}
          onClose={() => setAlertModal(null)}
        />
      </View>
  );
};

  // スコアカード画面表示時は別レンダリング
  if (currentScreen === 'playerSetup') {
    return renderPlayerSetup();
  }
  
  if (currentScreen === 'scoreCard') {
    return renderScoreCard();
  }

  if (currentScreen === 'scoreCardOverview') {
    return renderScoreCardOverview();
  }

  if (currentScreen === 'summary') {
    return renderSummary();
  }

  // 各画面のコンテンツ
  const renderContent = () => {
    switch(currentTab) {
      case 'home':
        return (
          <View style={styles.content}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>Disc Golf Score Manager</Text>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>最近のラウンド</Text>
              <Text style={styles.statsText}>🏆 ベストスコア: 48</Text>
              <Text style={styles.statsText}>📊 平均スコア: 54.5</Text>
              <Text style={styles.statsText}>⛳ ラウンド数: 20</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentTab('play')}>
              <Text style={styles.primaryButtonText}>🎮 新しいゲームを開始</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'play':
        return (
          <View style={styles.content}>
            <Text style={styles.screenTitle}>🎮 プレイ</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>コース選択</Text>
              <TouchableOpacity 
                style={styles.listItem}
                onPress={() => handleCourseSelect('せんだい農業園芸センター (18H)')}
              >
                <Text style={styles.listText}>📍 せんだい農業園芸センター (18H)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.listItem}
                onPress={() => handleCourseSelect('七ヶ浜多聞山 (18H)')}
              >
                <Text style={styles.listText}>📍 七ヶ浜多聞山 (18H)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.listItem}
                onPress={() => handleCourseSelect('加瀬沼公園 (9H)')}
              >
                <Text style={styles.listText}>📍 加瀬沼公園 (9H)</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>クイックプレイ</Text>
              <TouchableOpacity 
                style={styles.ghostOption}
                onPress={() => {
                  setGhostMode('recent');
                  setSelectedCourse('せんだい農業園芸センター (18H)');
                  setCurrentScreen('playerSetup');
                }}
              >
                <Text>👻 直近のラウンドと対戦</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.ghostOption}
                onPress={() => {
                  setGhostMode('best');
                  setSelectedCourse('せんだい農業園芸センター (18H)');
                  setCurrentScreen('playerSetup');
                }}
              >
                <Text>🏆 ベストラウンドと対戦</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'history':
        return (
          <View style={styles.content}>
            <Text style={styles.screenTitle}>📜 履歴</Text>
            <ScrollView style={styles.historyList}>
              <View style={styles.historyItem}>
                <Text style={styles.historyDate}>2025/08/10</Text>
                <Text style={styles.historyScore}>スコア: 52 (PAR -2)</Text>
                <Text style={styles.historyCourse}>せんだい農業園芸センター</Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyDate}>2025/08/08</Text>
                <Text style={styles.historyScore}>スコア: 48 (PAR -6) 🏆</Text>
                <Text style={styles.historyCourse}>七ヶ浜多聞山</Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyDate}>2025/08/05</Text>
                <Text style={styles.historyScore}>スコア: 55 (PAR +1)</Text>
                <Text style={styles.historyCourse}>加瀬沼公園</Text>
              </View>
            </ScrollView>
          </View>
        );
      
      case 'stats':
        return (
          <View style={styles.content}>
            <Text style={styles.screenTitle}>📊 統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>総ラウンド数</Text>
                <Text style={styles.statValue}>20</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>平均スコア</Text>
                <Text style={styles.statValue}>54.5</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ベストスコア</Text>
                <Text style={styles.statValue}>48</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ハンディキャップ</Text>
                <Text style={styles.statValue}>12</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>スコア分布</Text>
              <Text style={styles.distText}>🦅 イーグル: 15%</Text>
              <Text style={styles.distText}>🐦 バーディー: 25%</Text>
              <Text style={styles.distText}>⛳ パー: 35%</Text>
              <Text style={styles.distText}>😅 ボギー: 20%</Text>
              <Text style={styles.distText}>😭 ダブルボギー+: 5%</Text>
            </View>
          </View>
        );
      
      case 'settings':
        return (
          <View style={styles.content}>
            <Text style={styles.screenTitle}>⚙️ 設定</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ゴーストモード</Text>
              <TouchableOpacity style={styles.settingItem}>
                <Text>✅ ゴーストモードを有効化</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text>✅ リアルタイム差分表示</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>データ管理</Text>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>📤 データエクスポート</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>📥 データインポート</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {/* タブナビゲーション */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'home' && styles.activeTab]}
          onPress={() => setCurrentTab('home')}
        >
          <Text style={[styles.tabText, currentTab === 'home' && styles.activeTabText]}>🏠 Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'play' && styles.activeTab]}
          onPress={() => setCurrentTab('play')}
        >
          <Text style={[styles.tabText, currentTab === 'play' && styles.activeTabText]}>🎮 Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'history' && styles.activeTab]}
          onPress={() => setCurrentTab('history')}
        >
          <Text style={[styles.tabText, currentTab === 'history' && styles.activeTabText]}>📜 History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'stats' && styles.activeTab]}
          onPress={() => setCurrentTab('stats')}
        >
          <Text style={[styles.tabText, currentTab === 'stats' && styles.activeTabText]}>📊 Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'settings' && styles.activeTab]}
          onPress={() => setCurrentTab('settings')}
        >
          <Text style={[styles.tabText, currentTab === 'settings' && styles.activeTabText]}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      {/* メインタブ画面用のカスタムアラートモーダル */}
      <CustomModal 
        visible={!!alertModal}
        title={alertModal?.title}
        message={alertModal?.message}
        buttons={alertModal?.buttons || []}
        onClose={() => setAlertModal(null)}
      />
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // プレイヤー設定画面のスタイル
  playerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  playerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activePlayerButton: {
    backgroundColor: '#4CAF50',
  },
  playerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activeGhostOption: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // スタートホール選択のスタイル
  startHoleContainer: {
    marginTop: 10,
  },
  holeScrollView: {
    maxHeight: 50,
  },
  holeButtonRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  holeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  selectedHoleButton: {
    backgroundColor: '#4CAF50',
  },
  holeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedHoleButtonText: {
    color: 'white',
  },
  startHoleHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  
  // スコアカード画面のスタイル
  scoreCardHeader: {
    backgroundColor: '#4CAF50',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  exitText: {
    fontSize: 16,
    color: 'white',
  },
  scoreCardContent: {
    flex: 1,
    padding: 15,
  },
  ghostCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  ghostTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  ghostDiff: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 3,
  },
  ghostTotal: {
    fontSize: 14,
    color: '#388e3c',
  },
  playerCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  scoreButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreButton: {
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
  },
  eagleButton: {
    backgroundColor: '#ff9800',
  },
  birdieButton: {
    backgroundColor: '#ffc107',
  },
  parButton: {
    backgroundColor: '#4CAF50',
  },
  bogeyButton: {
    backgroundColor: '#2196f3',
  },
  doubleButton: {
    backgroundColor: '#9c27b0',
  },
  tripleButton: {
    backgroundColor: '#e91e63',
  },
  quadButton: {
    backgroundColor: '#f44336',
  },
  overButton: {
    backgroundColor: '#795548',
  },
  absoluteButton: {
    backgroundColor: '#607d8b',
  },
  specialScoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  specialButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 100,
  },
  aceButton: {
    backgroundColor: '#ffd700',
    borderWidth: 2,
    borderColor: '#ffaa00',
  },
  albatrossButton: {
    backgroundColor: '#00bcd4',
    borderWidth: 2,
    borderColor: '#0097a7',
  },
  specialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentScoreDisplay: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  currentScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // カウンター式入力のスタイル
  scoreCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 10,
  },
  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  counterButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  parButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FF9800',
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedParButton: {
    backgroundColor: '#4CAF50',
  },
  parButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedParButtonText: {
    color: 'white',
  },
  scoreDisplay: {
    marginHorizontal: 30,
    alignItems: 'center',
    minWidth: 120,
  },
  scoreDisplayNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreDisplayLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  scoreDisplayDiff: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  // 合計スコア表示のスタイル
  totalScoreContainer: {
    marginTop: 15,
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    padding: 15,
  },
  totalScoreContainerWithProgress: {
    // プレイヤー1用（プログレスバー付き）
  },
  totalScoreContainerCompact: {
    // 他のプレイヤー用（コンパクト表示）
    paddingBottom: 10,
  },
  totalScoreBox: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  totalScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  totalScoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  totalScoreDiff: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  progressInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  inputModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  activeModeButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeModeText: {
    color: 'white',
  },
  scoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedScore: {
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  selectedScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 5,
  },
  puttButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  puttButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  puttButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPuttButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectedPuttText: {
    color: 'white',
    fontWeight: 'bold',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  activeOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  activeOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80,
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  
  // カード系のスタイル
  statsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  
  // ボタン系のスタイル
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // リスト系のスタイル
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listText: {
    fontSize: 16,
    color: '#333',
  },
  ghostOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 5,
  },
  
  // 履歴画面のスタイル
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  historyScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historyCourse: {
    fontSize: 14,
    color: '#666',
  },
  
  // 統計画面のスタイル
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  distText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  
  // 設定画面のスタイル
  settingItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  settingButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // タブバーのスタイル
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
  
  // サマリー画面のスタイル
  summaryContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 80,
  },
  summaryHeader: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  summaryTotalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  summaryTotalDiff: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e8f5e9',
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryScoreCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryScoreCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryTable: {
    flexDirection: 'column',
  },
  summaryTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryTableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  summaryTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryTableCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  summaryTableCellHole: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  summaryTableCellPar: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  summaryTableCellScore: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  summaryTableCellPutts: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  summaryActionButtons: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  summaryActionButton: {
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 5,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryPrimaryButton: {
    backgroundColor: '#4CAF50',
  },
  summarySecondaryButton: {
    backgroundColor: '#666',
  },
  summaryActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // サマリー画面2列構成用の追加スタイル
  summaryTwoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  summaryHalfTable: {
    flex: 1,
    marginHorizontal: 5,
  },
  summaryHalfTableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    borderRadius: 5,
  },
  summaryScrollView: {
    flex: 1,
    marginBottom: 10,
  },
  summaryButtons: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  summaryButton: {
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryButtonSecondary: {
    backgroundColor: '#666',
  },
  summaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // サマリー画面の不足スタイル
  summarySubtitle: {
    fontSize: 16,
    color: '#e8f5e9',
    textAlign: 'center',
  },
  summaryScoreNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  summaryScoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  summaryScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  summaryScoreDiff: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 10,
  },
  summaryStatsCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  // プレイヤー名入力スタイル
  playerNameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  playerLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: 'white',
  },
  
  // 未入力ホール警告スタイル
  missingHolesWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    margin: 15,
    alignItems: 'center',
  },
  missingHolesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  missingHolesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  missingHoleButton: {
    backgroundColor: '#ffc107',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  missingHoleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  missingHolesSubtext: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  
  // スコアカード確認画面のスタイル
  overviewScrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewSection: {
    marginBottom: 20,
  },
  overviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  overviewTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  overviewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  overviewRowLast: {
    flexDirection: 'row',
    borderBottomWidth: 0,
  },
  overviewHeaderCell: {
    width: 50,
    padding: 8,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overviewHoleCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: '#f9f9f9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overviewParCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    fontSize: 12,
    color: '#666',
  },
  overviewScoreCell: {
    padding: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  overviewMissingCell: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
  overviewTotalHeaderCell: {
    width: 45,
    padding: 8,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  overviewTotalCell: {
    width: 45,
    padding: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  overviewGrandTotal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
    marginTop: 10,
  },
  overviewGrandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
  },
  overviewGrandTotalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  overviewWarning: {
    backgroundColor: '#fff3cd',
    padding: 10,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  overviewWarningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: 'bold',
  },
  // カスタムモーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    minWidth: 300,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    marginVertical: 5,
    minWidth: 80,
  },
  modalButtonCancel: {
    backgroundColor: '#6c757d',
  },
  modalButtonDestructive: {
    backgroundColor: '#dc3545',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtonTextCancel: {
    color: 'white',
  },
  modalButtonTextDestructive: {
    color: 'white',
  },
});