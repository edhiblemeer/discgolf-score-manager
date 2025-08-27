import { StyleSheet } from 'react-native';

// カラーパレット
export const colors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#2196F3',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  gray: '#6c757d',
  grayLight: '#e0e0e0',
  grayDark: '#666666',
  
  // スコア関連の色
  eagle: '#ff9800',      // オレンジ
  birdie: '#ffc107',     // 黄色
  par: '#4CAF50',        // 緑
  bogey: '#2196f3',      // 青
  doubleBogey: '#9c27b0', // 紫
  tripleBogey: '#f44336',  // 赤
  
  // ボタンの色
  buttonPrimary: '#007AFF',
  buttonCancel: '#6c757d',
  buttonDestructive: '#dc3545',
};

// 共通のスペーシング
export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 30,
};

// 共通のフォントサイズ
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

// 共通のボーダー半径
export const borderRadius = {
  sm: 5,
  md: 8,
  lg: 10,
  xl: 15,
  round: 20,
  circle: 9999,
};

// 共通のシャドウ
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
};

// 基本的なスタイル
export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.base,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.grayDark,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginVertical: spacing.md,
  },
});