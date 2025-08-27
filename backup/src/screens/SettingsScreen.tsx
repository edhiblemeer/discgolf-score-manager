// 設定画面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MainTabScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  toggleInputMode,
  toggleGhostMode,
  toggleAnimations,
  toggleSync,
} from '@/store/settingsSlice';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = MainTabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  const renderSettingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: COLORS.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderActionRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Game Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Settings</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="calculator" size={24} color={COLORS.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Input Mode</Text>
                <Text style={styles.settingSubtitle}>
                  {settings.inputMode === 'relative' ? 'PAR-based (+/-)' : 'Absolute values'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => dispatch(toggleInputMode())}
            >
              <Text style={styles.toggleButtonText}>Switch</Text>
            </TouchableOpacity>
          </View>

          {renderSettingRow(
            'contrast',
            'Ghost Mode',
            'Compare with previous rounds',
            settings.showGhostMode,
            () => dispatch(toggleGhostMode())
          )}

          {renderSettingRow(
            'sparkles',
            'Animations',
            'Show success animations',
            settings.enableAnimations,
            () => dispatch(toggleAnimations())
          )}
        </View>
      </View>

      {/* Sync Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync & Data</Text>
        
        <View style={styles.settingCard}>
          {renderSettingRow(
            'sync',
            'Auto Sync',
            'Sync when online',
            settings.syncEnabled,
            () => dispatch(toggleSync())
          )}

          {settings.lastSyncDate && (
            <View style={styles.syncInfo}>
              <Text style={styles.syncInfoText}>
                Last synced: {new Date(settings.lastSyncDate).toLocaleString()}
              </Text>
            </View>
          )}

          {renderActionRow(
            'cloud-upload',
            'Manual Sync',
            'Sync all pending data',
            () => {/* TODO: Trigger manual sync */}
          )}

          {renderActionRow(
            'download',
            'Export Data',
            'Export rounds to CSV',
            () => {/* TODO: Export data */}
          )}
        </View>
      </View>

      {/* Profile Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <View style={styles.settingCard}>
          {renderActionRow(
            'person',
            'Player Profile',
            'Edit your profile',
            () => {/* TODO: Navigate to profile */}
          )}

          {renderActionRow(
            'people',
            'Manage Players',
            'Add or edit players',
            () => {/* TODO: Navigate to player management */}
          )}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingCard}>
          {renderActionRow(
            'information-circle',
            'About',
            'Version 1.0.0',
            () => {/* TODO: Navigate to about */}
          )}

          {renderActionRow(
            'help-circle',
            'Help & Support',
            'Get help and report issues',
            () => {/* TODO: Navigate to help */}
          )}

          {renderActionRow(
            'document-text',
            'Terms & Privacy',
            'View terms and privacy policy',
            () => {/* TODO: Navigate to terms */}
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>DiscGolf Score v1.0.0</Text>
        <Text style={styles.footerSubtext}>Made with ❤️ for disc golfers</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 10,
  },
  settingCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncInfo: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  syncInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
});