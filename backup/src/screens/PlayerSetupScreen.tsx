import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { PlayStackScreenProps } from '@/navigation/types';
import { Player } from '@/types/models';
import { playerService } from '@/services/playerService';
import { useAppDispatch } from '@/store';
import { addPlayer, removePlayer } from '@/store/gameSlice';
import { COLORS, MAX_PLAYERS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = PlayStackScreenProps<'PlayerSetup'>;

export default function PlayerSetupScreen({ navigation, route }: Props) {
  const { courseId } = route.params;
  const dispatch = useAppDispatch();
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  useEffect(() => {
    loadRecentPlayers();
  }, []);

  const loadRecentPlayers = async () => {
    try {
      const recent = await playerService.getRecentPlayers(4);
      setRecentPlayers(recent);
      // デフォルトで最初のプレイヤーを追加
      if (recent.length > 0) {
        setPlayers([recent[0]]);
        dispatch(addPlayer(recent[0]));
      }
    } catch (error) {
      console.error('Failed to load recent players:', error);
    }
  };

  const handleAddPlayer = (player: Player) => {
    if (players.length >= MAX_PLAYERS) {
      Alert.alert('Maximum Players', `You can only add up to ${MAX_PLAYERS} players`);
      return;
    }

    if (players.find(p => p.id === player.id)) {
      Alert.alert('Already Added', 'This player is already in the game');
      return;
    }

    setPlayers([...players, player]);
    dispatch(addPlayer(player));
  };

  const handleRemovePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
    dispatch(removePlayer(playerId));
  };

  const handleCreateNewPlayer = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a player name');
      return;
    }

    try {
      const newPlayer = await playerService.addPlayer(newPlayerName.trim());
      handleAddPlayer(newPlayer);
      setNewPlayerName('');
      setShowAddPlayer(false);
      
      // リストを更新
      await loadRecentPlayers();
    } catch (error) {
      console.error('Failed to create player:', error);
      Alert.alert('Error', 'Failed to create new player');
    }
  };

  const handleStartGame = () => {
    if (players.length === 0) {
      Alert.alert('No Players', 'Please add at least one player');
      return;
    }

    navigation.navigate('ScoreCard', { 
      courseId, 
      players 
    });
  };

  const renderPlayerCard = (player: Player, isInGame: boolean = false) => (
    <View key={player.id} style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerInitial}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.playerName}>{player.name}</Text>
          {player.hdcp !== undefined && (
            <Text style={styles.playerHdcp}>HDCP: {player.hdcp}</Text>
          )}
        </View>
      </View>
      {isInGame ? (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemovePlayer(player.id)}
        >
          <Ionicons name="close-circle" size={24} color={COLORS.error} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddPlayer(player)}
          disabled={players.length >= MAX_PLAYERS}
        >
          <Ionicons 
            name="add-circle" 
            size={24} 
            color={players.length >= MAX_PLAYERS ? COLORS.textSecondary : COLORS.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Players</Text>
          <Text style={styles.subtitle}>
            Add up to {MAX_PLAYERS} players for this round
          </Text>
        </View>

        {/* Selected Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Players in Game ({players.length}/{MAX_PLAYERS})
          </Text>
          {players.length > 0 ? (
            <View style={styles.playersList}>
              {players.map((player) => renderPlayerCard(player, true))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No players added yet</Text>
            </View>
          )}
        </View>

        {/* Recent Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Players</Text>
          <View style={styles.playersList}>
            {recentPlayers
              .filter(p => !players.find(gp => gp.id === p.id))
              .map((player) => renderPlayerCard(player, false))}
          </View>
        </View>

        {/* Add New Player */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Player</Text>
          {showAddPlayer ? (
            <View style={styles.newPlayerForm}>
              <TextInput
                style={styles.input}
                placeholder="Enter player name"
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                autoFocus
                maxLength={30}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddPlayer(false);
                    setNewPlayerName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.createButton]}
                  onPress={handleCreateNewPlayer}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={() => setShowAddPlayer(true)}
              disabled={players.length >= MAX_PLAYERS}
            >
              <Ionicons 
                name="person-add" 
                size={20} 
                color={players.length >= MAX_PLAYERS ? COLORS.textSecondary : COLORS.primary} 
              />
              <Text style={[
                styles.addNewText,
                players.length >= MAX_PLAYERS && styles.addNewTextDisabled
              ]}>
                Create New Player
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Start Game Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, players.length === 0 && styles.startButtonDisabled]}
          onPress={handleStartGame}
          disabled={players.length === 0}
        >
          <Text style={styles.startButtonText}>
            Start Game with {players.length} Player{players.length !== 1 ? 's' : ''}
          </Text>
          <Ionicons name="play-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  playersList: {
    gap: 8,
  },
  playerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  playerHdcp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addNewButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addNewText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  addNewTextDisabled: {
    color: COLORS.textSecondary,
  },
  newPlayerForm: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});