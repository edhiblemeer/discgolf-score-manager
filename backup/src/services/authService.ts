/**
 * Authentication Service
 * Firebase Authenticationを使用した認証管理
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firebaseAuth } from '@/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  private currentUser: FirebaseAuthTypes.User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.initializeAuthListener();
  }

  /**
   * 認証状態リスナーの初期化
   */
  private initializeAuthListener() {
    firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      this.currentUser = firebaseUser;
      
      if (firebaseUser) {
        const user = this.mapFirebaseUser(firebaseUser);
        await this.saveUserToLocal(user);
        this.notifyAuthStateListeners(user);
      } else {
        await this.clearLocalUser();
        this.notifyAuthStateListeners(null);
      }
    });
  }

  /**
   * Firebase UserをアプリのUserモデルに変換
   */
  private mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isAnonymous: firebaseUser.isAnonymous,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    };
  }

  /**
   * 認証状態リスナーに通知
   */
  private notifyAuthStateListeners(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  /**
   * ローカルストレージにユーザー情報を保存
   */
  private async saveUserToLocal(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to local storage:', error);
    }
  }

  /**
   * ローカルストレージからユーザー情報を削除
   */
  private async clearLocalUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Failed to clear user from local storage:', error);
    }
  }

  /**
   * 匿名認証
   */
  async signInAnonymously(): Promise<AuthResult> {
    try {
      const credential = await firebaseAuth.signInAnonymously();
      
      if (credential.user) {
        const user = this.mapFirebaseUser(credential.user);
        return { success: true, user };
      }
      
      return { success: false, error: 'No user returned from anonymous sign in' };
    } catch (error: any) {
      console.error('Anonymous sign in failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * メールアドレスとパスワードでサインイン
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      
      if (credential.user) {
        const user = this.mapFirebaseUser(credential.user);
        return { success: true, user };
      }
      
      return { success: false, error: 'No user returned from sign in' };
    } catch (error: any) {
      console.error('Email sign in failed:', error);
      return { success: false, error: this.getAuthErrorMessage(error.code) };
    }
  }

  /**
   * メールアドレスとパスワードで新規登録
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthResult> {
    try {
      const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      
      if (credential.user) {
        // Display nameを設定
        if (displayName) {
          await credential.user.updateProfile({ displayName });
        }
        
        const user = this.mapFirebaseUser(credential.user);
        return { success: true, user };
      }
      
      return { success: false, error: 'No user returned from sign up' };
    } catch (error: any) {
      console.error('Email sign up failed:', error);
      return { success: false, error: this.getAuthErrorMessage(error.code) };
    }
  }

  /**
   * サインアウト
   */
  async signOut(): Promise<AuthResult> {
    try {
      await firebaseAuth.signOut();
      await this.clearLocalUser();
      return { success: true };
    } catch (error: any) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 現在のユーザーを取得
   */
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.mapFirebaseUser(this.currentUser);
    }
    return null;
  }

  /**
   * ユーザーがサインイン済みかチェック
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * 匿名ユーザーかチェック
   */
  isAnonymous(): boolean {
    return this.currentUser?.isAnonymous ?? false;
  }

  /**
   * 認証状態変更のリスナーを追加
   */
  onAuthStateChanged(listener: (user: User | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // 現在の状態を即座に通知
    const currentUser = this.getCurrentUser();
    listener(currentUser);
    
    // クリーンアップ関数を返す
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * 匿名アカウントをメールアカウントにアップグレード
   */
  async upgradeAnonymousAccount(email: string, password: string): Promise<AuthResult> {
    try {
      if (!this.currentUser || !this.currentUser.isAnonymous) {
        return { success: false, error: 'Current user is not anonymous' };
      }

      const credential = auth.EmailAuthProvider.credential(email, password);
      const userCredential = await this.currentUser.linkWithCredential(credential);
      
      if (userCredential.user) {
        const user = this.mapFirebaseUser(userCredential.user);
        return { success: true, user };
      }
      
      return { success: false, error: 'Failed to upgrade anonymous account' };
    } catch (error: any) {
      console.error('Account upgrade failed:', error);
      return { success: false, error: this.getAuthErrorMessage(error.code) };
    }
  }

  /**
   * パスワードリセットメールを送信
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      await firebaseAuth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset email failed:', error);
      return { success: false, error: this.getAuthErrorMessage(error.code) };
    }
  }

  /**
   * エラーコードから読みやすいメッセージに変換
   */
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'An authentication error occurred';
    }
  }

  /**
   * ユーザーIDトークンを取得（API認証用）
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    try {
      if (!this.currentUser) {
        return null;
      }
      
      const token = await this.currentUser.getIdToken(forceRefresh);
      return token;
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  /**
   * ユーザープロフィールを更新
   */
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<AuthResult> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'No user is signed in' };
      }

      await this.currentUser.updateProfile(updates);
      const user = this.mapFirebaseUser(this.currentUser);
      await this.saveUserToLocal(user);
      
      return { success: true, user };
    } catch (error: any) {
      console.error('Profile update failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService();