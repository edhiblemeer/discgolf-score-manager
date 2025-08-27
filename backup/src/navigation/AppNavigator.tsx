// メインナビゲーター設定

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

// 画面インポート（後で実装）
import HomeScreen from '@/screens/HomeScreen';
import PlayScreen from '@/screens/PlayScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import CourseSelectScreen from '@/screens/CourseSelectScreen';
import PlayerSetupScreen from '@/screens/PlayerSetupScreen';
import ScoreCardScreen from '@/screens/ScoreCardScreen';
import RoundSummaryScreen from '@/screens/RoundSummaryScreen';
import StatisticsScreen from '@/screens/StatisticsScreen';

import {
  RootStackParamList,
  MainTabParamList,
  PlayStackParamList,
} from './types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const PlayStack = createStackNavigator<PlayStackParamList>();

// プレイスタックナビゲーター
function PlayStackNavigator() {
  return (
    <PlayStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <PlayStack.Screen 
        name="PlayHome" 
        component={PlayScreen}
        options={{ title: 'Play' }}
      />
      <PlayStack.Screen 
        name="CourseSelect" 
        component={CourseSelectScreen}
        options={{ title: 'Select Course' }}
      />
      <PlayStack.Screen 
        name="PlayerSetup" 
        component={PlayerSetupScreen}
        options={{ title: 'Setup Players' }}
      />
      <PlayStack.Screen 
        name="ScoreCard" 
        component={ScoreCardScreen}
        options={{ title: 'Score Card' }}
      />
      <PlayStack.Screen 
        name="RoundSummary" 
        component={RoundSummaryScreen}
        options={{ title: 'Round Summary' }}
      />
    </PlayStack.Navigator>
  );
}

// タブナビゲーター
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Play') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Play" 
        component={PlayStackNavigator}
        options={{ 
          title: 'Play',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={StatisticsScreen}
        options={{ title: 'Statistics' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// ルートナビゲーター
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}