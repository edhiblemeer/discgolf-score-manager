import { useState } from 'react';
import { SCREEN_NAMES, TAB_NAMES, GAME_CONSTANTS } from '../utils/constants';
import { generateHoleData } from '../utils/holeData';
import { getCourseByName } from '../data/courses';

/**
 * ゲーム全体の状態管理を行うカスタムフック
 */
export const useGameState = () => {
  const [currentTab, setCurrentTab] = useState(TAB_NAMES.HOME);
  const [currentScreen, setCurrentScreen] = useState(SCREEN_NAMES.TABS);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [startHole, setStartHole] = useState(GAME_CONSTANTS.DEFAULT_START_HOLE);
  const [totalHoles, setTotalHoles] = useState(18); // デフォルトは18ホール
  const [playableHoles, setPlayableHoles] = useState(null); // 実際にプレイするホール番号の配列（27ホール対応）
  const [selectedLayout, setSelectedLayout] = useState(null); // 選択されたレイアウト（27ホール用）
  const [ghostMode, setGhostMode] = useState(null);
  const [ghostData, setGhostData] = useState(null); // ゴーストラウンドデータ
  const [isGhostActive, setIsGhostActive] = useState(false); // ゴーストモード有効/無効
  const [isViewingHistory, setIsViewingHistory] = useState(false); // 履歴表示中フラグ
  // 初期ホールデータを生成（1ホール目）
  const [holeData, setHoleData] = useState(() => {
    const initialData = {};
    initialData[1] = generateHoleData(1);
    return initialData;
  });
  const [alertModal, setAlertModal] = useState(null);

  // 次のホールへ進む
  const goToNextHole = () => {
    if (playableHoles && playableHoles.length > 0) {
      // 27ホール対応：playableHoles配列を使用
      const currentIndex = playableHoles.indexOf(currentHole);
      if (currentIndex < playableHoles.length - 1) {
        setCurrentHole(playableHoles[currentIndex + 1]);
      }
    } else {
      // 通常の18ホール以下
      if (currentHole < totalHoles) {
        setCurrentHole(currentHole + 1);
      }
    }
  };

  // 前のホールへ戻る
  const goToPreviousHole = () => {
    if (playableHoles && playableHoles.length > 0) {
      // 27ホール対応：playableHoles配列を使用
      const currentIndex = playableHoles.indexOf(currentHole);
      if (currentIndex > 0) {
        setCurrentHole(playableHoles[currentIndex - 1]);
      }
    } else {
      // 通常の18ホール以下
      if (currentHole > 1) {
        setCurrentHole(currentHole - 1);
      }
    }
  };

  // 特定のホールへジャンプ
  const goToHole = (holeNumber) => {
    if (playableHoles && playableHoles.length > 0) {
      // 27ホール対応：playableHoles配列内のホールのみジャンプ可能
      if (playableHoles.includes(holeNumber)) {
        setCurrentHole(holeNumber);
      }
    } else {
      // 通常の18ホール以下
      if (holeNumber >= 1 && holeNumber <= totalHoles) {
        setCurrentHole(holeNumber);
      }
    }
  };

  // ゲームをリセット
  const resetGame = () => {
    setCurrentScreen(SCREEN_NAMES.TABS);
    setSelectedCourse(null);
    setCurrentHole(1);
    setStartHole(GAME_CONSTANTS.DEFAULT_START_HOLE);
    setTotalHoles(18);
    setPlayableHoles(null);
    setSelectedLayout(null);
    setGhostMode(null);
    setGhostData(null);
    setIsGhostActive(false);
    // リセット時も1ホール目のデータを生成
    const initialData = {};
    initialData[1] = generateHoleData(1);
    setHoleData(initialData);
  };

  // ホールデータを生成
  const generateHoleDataForHole = (holeNumber) => {
    // 既にホールデータが存在する場合は何もしない
    if (holeData[holeNumber]) {
      return;
    }
    
    // 選択されたコースからデータを取得
    if (selectedCourse) {
      const courseData = getCourseByName(selectedCourse);
      if (courseData && courseData.holes && courseData.holes.length > 0) {
        const hole = courseData.holes.find(h => h.holeNumber === holeNumber);
        if (hole) {
          setHoleData(prev => ({
            ...prev,
            [holeNumber]: {
              par: hole.par,
              distance: hole.distance
            }
          }));
          return;
        }
      }
    }
    
    // フォールバック：デフォルトデータを生成
    const newData = generateHoleData(holeNumber);
    setHoleData(prev => ({
      ...prev,
      [holeNumber]: newData
    }));
  };

  // カスタムアラート表示
  const showAlert = (title, message, buttons) => {
    setAlertModal({ title, message, buttons });
  };

  // アラートを閉じる
  const hideAlert = () => {
    setAlertModal(null);
  };

  return {
    // State
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
    holeData,
    alertModal,
    isViewingHistory,
    
    // Setters
    setCurrentTab,
    setCurrentScreen,
    setSelectedCourse,
    setCurrentHole,
    setStartHole,
    setTotalHoles,
    setPlayableHoles,
    setSelectedLayout,
    setGhostMode,
    setGhostData,
    setIsGhostActive,
    setHoleData,
    setIsViewingHistory,
    
    // Actions
    goToNextHole,
    goToPreviousHole,
    goToHole,
    resetGame,
    generateHoleDataForHole,
    showAlert,
    hideAlert,
  };
};