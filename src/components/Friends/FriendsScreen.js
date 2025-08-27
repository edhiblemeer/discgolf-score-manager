import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { useSettings } from '../../hooks/useSettings';
import {
  loadFriends,
  addFriend,
  removeFriend,
} from '../../utils/settingsStorage';
import {
  formatForQRCode,
  parseQRCodeData,
  validatePlayerCode,
} from '../../utils/playerIdGenerator';
import { getHDCPLevel, getHDCPDisplay } from '../../utils/hdcpCalculator';

const FriendsScreen = () => {
  const { settings, updateSetting } = useSettings();
  const [friends, setFriends] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);

  // フレンドリストを読み込み
  useEffect(() => {
    loadFriendsList();
  }, []);

  const loadFriendsList = async () => {
    const friendsList = await loadFriends();
    setFriends(friendsList);
  };

  // カメラ権限を要求
  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  // QRコードを表示
  const handleShowQRCode = () => {
    setShowQRCode(true);
  };

  // QRコードを共有
  const handleShareQRCode = async () => {
    const qrData = formatForQRCode(
      settings.profile.playerCode,
      settings.profile.displayName,
      settings.profile.playerId
    );
    
    try {
      await Share.share({
        message: `ディスクゴルフフレンドコード: ${settings.profile.playerCode}\n名前: ${settings.profile.displayName}`,
        title: 'フレンドコードを共有',
      });
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };

  // 追加オプションを表示
  const handleShowAddOptions = () => {
    if (friends.length >= 3) {
      Alert.alert('制限', 'フレンドは最大3名まで登録できます', [{ text: 'OK' }]);
      return;
    }
    setShowAddOptions(true);
  };

  // QRコードスキャナーを開く
  const handleOpenScanner = async () => {
    setShowAddOptions(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'カメラ権限が必要',
        'QRコードを読み取るにはカメラへのアクセスを許可してください',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowScanner(true);
    setScanned(false);
  };

  // コード入力モーダルを開く
  const handleOpenCodeInput = () => {
    setShowAddOptions(false);
    setShowCodeInput(true);
    setInputCode('');
    setInputName('');
  };

  // コード入力で追加
  const handleAddByCode = async () => {
    // バリデーション
    if (!inputCode) {
      Alert.alert('エラー', 'コードを入力してください', [{ text: 'OK' }]);
      return;
    }

    // コード形式のチェック
    const formattedCode = inputCode.toUpperCase().replace(/[\s-]/g, '');
    if (formattedCode.length !== 8) {
      Alert.alert('エラー', 'コードは8文字で入力してください', [{ text: 'OK' }]);
      return;
    }

    // XXXX-XXXX形式に整形
    const playerCode = `${formattedCode.substr(0, 4)}-${formattedCode.substr(4, 4)}`;

    // 自分のコードチェック
    if (playerCode === settings.profile.playerCode) {
      Alert.alert('エラー', '自分自身は追加できません', [{ text: 'OK' }]);
      return;
    }

    // フレンドデータを作成（名前はコードから一時的に設定）
    const friendData = {
      playerId: `manual-${Date.now()}`, // 手動追加用の仮ID
      playerCode: playerCode,
      displayName: inputName || `フレンド(${playerCode})`, // 名前がない場合はコードを使用
    };

    // フレンドを追加
    const result = await addFriend(friendData);
    
    if (result.success) {
      // モーダルを即座に閉じる
      setShowCodeInput(false);
      setShowAddOptions(false);
      setInputCode('');
      setInputName('');
      // フレンドリストを再読み込み
      await loadFriendsList();
      // 成功メッセージを表示
      setTimeout(() => {
        Alert.alert('成功', `${friendData.displayName}を追加しました`, [{ text: 'OK' }]);
      }, 100);
    } else {
      Alert.alert('エラー', result.message, [{ text: 'OK' }]);
    }
  };

  // QRコードをスキャン
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    
    try {
      const friendData = parseQRCodeData(data);
      
      if (!friendData) {
        Alert.alert('エラー', '無効なQRコードです', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
        return;
      }

      // 自分自身のQRコードの場合
      if (friendData.playerId === settings.profile.playerId) {
        Alert.alert('エラー', '自分自身は追加できません', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
        return;
      }

      // フレンドを追加
      const result = await addFriend(friendData);
      
      if (result.success) {
        // モーダルを即座に閉じる
        setShowScanner(false);
        setShowAddOptions(false);
        // フレンドリストを再読み込み
        await loadFriendsList();
        // 成功メッセージを表示
        setTimeout(() => {
          Alert.alert('成功', `${friendData.displayName}さんを追加しました`, [{ text: 'OK' }]);
        }, 100);
      } else {
        Alert.alert('エラー', result.message, [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      console.error('QRコード処理エラー:', error);
      Alert.alert('エラー', 'QRコードの処理に失敗しました', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  // 表示名を編集
  const handleEditDisplayName = () => {
    setEditingName(settings.profile.displayName);
    setShowEditName(true);
  };

  // 表示名を保存
  const handleSaveDisplayName = async () => {
    if (!editingName.trim()) {
      Alert.alert('エラー', '名前を入力してください', [{ text: 'OK' }]);
      return;
    }
    
    await updateSetting('profile.displayName', editingName.trim());
    setShowEditName(false);
    Alert.alert('完了', '表示名を更新しました', [{ text: 'OK' }]);
  };

  // フレンドを削除
  const handleRemoveFriend = (friend) => {
    console.log('削除ボタンクリック:', friend);
    setFriendToDelete(friend);
    setShowDeleteConfirm(true);
  };
  
  // 削除を実行
  const confirmDelete = async () => {
    if (!friendToDelete) return;
    
    console.log('削除実行開始:', friendToDelete.playerId);
    try {
      const result = await removeFriend(friendToDelete.playerId);
      console.log('削除結果:', result);
      if (result) {
        // 削除成功時は必ずフレンドリストを再読み込み
        await loadFriendsList();
        console.log('フレンドリスト更新完了');
        setShowDeleteConfirm(false);
        setFriendToDelete(null);
        // 成功メッセージを表示
        setTimeout(() => {
          Alert.alert('完了', 'フレンドを削除しました', [{ text: 'OK' }]);
        }, 100);
      } else {
        console.log('削除失敗');
        setShowDeleteConfirm(false);
        Alert.alert('エラー', 'フレンドの削除に失敗しました', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('フレンド削除エラー詳細:', error);
      setShowDeleteConfirm(false);
      Alert.alert('エラー', 'フレンドの削除に失敗しました', [{ text: 'OK' }]);
    }
  };

  // QRコードデータを生成
  const qrCodeData = JSON.stringify(
    formatForQRCode(
      settings.profile.playerCode,
      settings.profile.displayName,
      settings.profile.playerId
    )
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>フレンド</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* プロフィール情報 */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>マイプロフィール</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileName}>{settings.profile.displayName}</Text>
              <TouchableOpacity
                style={styles.editNameButton}
                onPress={handleEditDisplayName}
              >
                <Text style={styles.editNameButtonText}>✅</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.playerCode}>
              プレイヤーコード: {settings.profile.playerCode}
            </Text>
            <View style={styles.hdcpContainer}>
              <Text style={styles.hdcpLabel}>HDCP: </Text>
              <Text style={[
                styles.hdcpValue, 
                { color: settings.profile.stats?.hdcp !== null ? getHDCPLevel(settings.profile.stats.hdcp).color : '#999' }
              ]}>
                {getHDCPDisplay(settings.profile.stats?.hdcp, settings.profile.stats?.recentScores)}
              </Text>
              {settings.profile.stats?.hdcp !== null && (
                <Text style={styles.hdcpLevel}>
                  ({getHDCPLevel(settings.profile.stats.hdcp).level})
                </Text>
              )}
            </View>
            
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleShowQRCode}
              >
                <Text style={styles.buttonText}>QRコード表示</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleShareQRCode}
              >
                <Text style={styles.secondaryButtonText}>コード共有</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* フレンドリスト */}
        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              フレンドリスト ({friends.length}/3)
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                friends.length >= 3 && styles.disabledButton
              ]}
              onPress={handleShowAddOptions}
              disabled={friends.length >= 3}
            >
              <Text style={styles.addButtonText}>+ 追加</Text>
            </TouchableOpacity>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                フレンドがいません
              </Text>
              <Text style={styles.emptySubText}>
                QRコードをスキャンまたはコードを入力して追加しましょう
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.playerId} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <View style={styles.friendHeader}>
                    <Text style={styles.friendName}>{friend.displayName}</Text>
                    <Text style={[styles.friendHDCP, { color: friend.hdcp !== null ? getHDCPLevel(friend.hdcp).color : '#999' }]}>
                      HDCP: {getHDCPDisplay(friend.hdcp)}
                    </Text>
                  </View>
                  <Text style={styles.friendCode}>
                    コード: {friend.playerCode}
                  </Text>
                  {friend.lastPlayed && (
                    <Text style={styles.friendLastPlayed}>
                      最終プレイ: {new Date(friend.lastPlayed).toLocaleDateString('ja-JP')}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFriend(friend)}
                >
                  <Text style={styles.removeButtonText}>削除</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* 追加方法選択モーダル */}
      <Modal
        visible={showAddOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>フレンドを追加</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.modalButton]}
              onPress={handleOpenScanner}
            >
              <Text style={styles.buttonText}>📷 QRコードをスキャン</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.modalButton]}
              onPress={handleOpenCodeInput}
            >
              <Text style={styles.buttonText}>⌨️ コードを入力</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setShowAddOptions(false)}
            >
              <Text style={styles.secondaryButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* コード入力モーダル */}
      <Modal
        visible={showCodeInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCodeInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>コードで追加</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>プレイヤーコード</Text>
              <TextInput
                style={styles.textInput}
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="XXXX-XXXX"
                autoCapitalize="characters"
                maxLength={9}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>表示名（オプション）</Text>
              <TextInput
                style={styles.textInput}
                value={inputName}
                onChangeText={setInputName}
                placeholder="省略可（コードが表示されます）"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.modalButton]}
              onPress={handleAddByCode}
            >
              <Text style={styles.buttonText}>追加</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setShowCodeInput(false)}
            >
              <Text style={styles.secondaryButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 表示名編集モーダル */}
      <Modal
        visible={showEditName}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>表示名を編集</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="表示名を入力"
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.modalButton]}
              onPress={handleSaveDisplayName}
            >
              <Text style={styles.buttonText}>保存</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setShowEditName(false)}
            >
              <Text style={styles.secondaryButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QRコード表示モーダル */}
      <Modal
        visible={showQRCode}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>マイQRコード</Text>
            
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={qrCodeData}
                size={200}
                backgroundColor={colors.white}
              />
            </View>
            
            <Text style={styles.modalPlayerCode}>
              {settings.profile.playerCode}
            </Text>
            <Text style={styles.modalDescription}>
              このQRコードを友達にスキャンしてもらいましょう
            </Text>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => setShowQRCode(false)}
            >
              <Text style={styles.buttonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QRコードスキャナーモーダル */}
      <Modal
        visible={showScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.scannerCloseButton}
                onPress={() => setShowScanner(false)}
              >
                <Text style={styles.scannerCloseText}>✕ 閉じる</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCorner} />
            </View>
            
            <Text style={styles.scannerText}>
              QRコードをフレーム内に配置してください
            </Text>
          </View>
        </View>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>確認</Text>
            <Text style={styles.deleteModalMessage}>
              {friendToDelete?.displayName}さんを削除しますか？
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setFriendToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteButtonText}>削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  content: {
    flex: 1,
  },
  profileSection: {
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
  profileCard: {
    padding: spacing.md,
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.dark,
  },
  editNameButton: {
    padding: spacing.xs,
  },
  editNameButtonText: {
    fontSize: fontSize.lg,
  },
  playerCode: {
    fontSize: fontSize.base,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  hdcpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hdcpLabel: {
    fontSize: fontSize.base,
    color: colors.gray,
  },
  hdcpValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginHorizontal: spacing.xs,
  },
  hdcpLevel: {
    fontSize: fontSize.sm,
    color: colors.gray,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  friendsSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.base,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: fontSize.sm,
    color: colors.grayLight,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  friendCode: {
    fontSize: fontSize.sm,
    color: colors.gray,
  },
  friendLastPlayed: {
    fontSize: fontSize.sm,
    color: colors.grayLight,
    marginTop: spacing.xs,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  button: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.base,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: fontSize.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '85%',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  qrCodeContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  modalPlayerCode: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButton: {
    marginBottom: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.base,
    backgroundColor: colors.white,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scannerHeader: {
    padding: spacing.md,
    paddingTop: spacing.xl * 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerCloseButton: {
    alignSelf: 'flex-start',
  },
  scannerCloseText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCorner: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  scannerText: {
    color: colors.white,
    fontSize: fontSize.base,
    textAlign: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spacer: {
    height: spacing.xl,
  },
  // 削除確認モーダルのスタイル
  deleteModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    minWidth: 300,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  deleteModalMessage: {
    fontSize: fontSize.base,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.grayLight,
  },
  cancelButtonText: {
    color: colors.gray,
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    backgroundColor: colors.danger,
  },
  confirmDeleteButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default FriendsScreen;