import { useState } from 'react';
import { GAME_CONSTANTS } from '../utils/constants';

/**
 * プレイヤー管理を行うカスタムフック
 */
export const usePlayerManagement = () => {
  const [players, setPlayers] = useState([{ name: 'プレイヤー1' }]);
  const [playerNames, setPlayerNames] = useState([
    'プレイヤー1',
    'プレイヤー2',
    'プレイヤー3',
    'プレイヤー4'
  ]);
  const [playerHDCPSettings, setPlayerHDCPSettings] = useState([
    { source: 'none', hdcpValue: 0 },
    { source: 'none', hdcpValue: 0 },
    { source: 'none', hdcpValue: 0 },
    { source: 'none', hdcpValue: 0 }
  ]);

  // プレイヤーを追加
  const addPlayer = () => {
    if (players.length < GAME_CONSTANTS.MAX_PLAYERS) {
      const newPlayerName = playerNames[players.length] || `プレイヤー${players.length + 1}`;
      setPlayers([...players, { name: newPlayerName }]);
    }
  };

  // プレイヤーを削除
  const removePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
    }
  };

  // プレイヤー名を更新
  const updatePlayerName = (index, name) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
    
    // 現在のプレイヤーリストも更新
    if (index < players.length) {
      const newPlayers = [...players];
      newPlayers[index] = { name };
      setPlayers(newPlayers);
    }
  };

  // プレイヤーリストをリセット
  const resetPlayers = () => {
    setPlayers([{ name: playerNames[0] || 'プレイヤー1' }]);
  };

  // プレイヤー名のリストをリセット
  const resetPlayerNames = () => {
    setPlayerNames([
      'プレイヤー1',
      'プレイヤー2',
      'プレイヤー3',
      'プレイヤー4'
    ]);
  };

  // プレイヤー数を取得
  const getPlayerCount = () => players.length;

  // プレイヤー名を取得
  const getPlayerName = (index) => {
    if (index < players.length) {
      return players[index].name;
    }
    return playerNames[index] || `プレイヤー${index + 1}`;
  };

  // プレイヤーが最大数に達しているかチェック
  const isMaxPlayers = () => players.length >= GAME_CONSTANTS.MAX_PLAYERS;

  // プレイヤーが最小数かチェック
  const isMinPlayers = () => players.length <= 1;

  // HDCPを更新
  const updatePlayerHDCP = (index, source, hdcpValue) => {
    const newSettings = [...playerHDCPSettings];
    // hdcpValueがnullの場合は0をデフォルト値として使用
    newSettings[index] = { source, hdcpValue: hdcpValue ?? 0 };
    setPlayerHDCPSettings(newSettings);
  };

  return {
    // State
    players,
    playerNames,
    playerHDCPSettings,
    
    // Setters
    setPlayers,
    setPlayerNames,
    setPlayerHDCPSettings,
    
    // Actions
    addPlayer,
    removePlayer,
    updatePlayerName,
    updatePlayerHDCP,
    resetPlayers,
    resetPlayerNames,
    
    // Getters
    getPlayerCount,
    getPlayerName,
    isMaxPlayers,
    isMinPlayers,
  };
};