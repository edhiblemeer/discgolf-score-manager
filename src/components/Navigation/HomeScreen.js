import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/theme';
import { 
  getCourseNames, 
  getCourseByName, 
  getPrefectures, 
  getCoursesByPrefecture,
  searchCourses 
} from '../../data/courses';
import { useSettings } from '../../hooks/useSettings';

const HomeScreen = ({ onCourseSelect }) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState('全て');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 設定を取得
  const { settings, isFavorite, toggleFavorite } = useSettings();
  
  // 県リストを取得（「全て」と「お気に入り」を追加）
  const prefectures = useMemo(() => {
    return ['全て', 'お気に入り', ...getPrefectures()];
  }, []);

  // フィルタリングされたコースリスト
  const filteredCourses = useMemo(() => {
    let courses;
    
    // お気に入りタブの場合
    if (selectedPrefecture === 'お気に入り') {
      const favorites = settings.profile.favoriteCourses || [];
      courses = getCoursesByPrefecture('全て').filter(course => 
        favorites.includes(course.name)
      );
    } else {
      courses = getCoursesByPrefecture(selectedPrefecture);
    }
    
    // 検索クエリがある場合はさらにフィルタリング
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      courses = courses.filter(course => 
        course.name.toLowerCase().includes(lowerQuery) ||
        (course.prefecture && course.prefecture.toLowerCase().includes(lowerQuery))
      );
    }
    
    return courses;
  }, [selectedPrefecture, searchQuery, settings.profile.favoriteCourses]);

  // 県別のコース数を計算
  const courseCountByPrefecture = useMemo(() => {
    const counts = { '全て': getCoursesByPrefecture('全て').length };
    const favorites = settings.profile.favoriteCourses || [];
    counts['お気に入り'] = favorites.length;
    prefectures.slice(2).forEach(pref => {
      counts[pref] = getCoursesByPrefecture(pref).length;
    });
    return counts;
  }, [prefectures, settings.profile.favoriteCourses]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ディスクゴルフ スコアカード</Text>
        <Text style={styles.subtitle}>コースを選択してください</Text>
      </View>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="コース名または県名で検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* 県別タブ */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
        >
          {prefectures.map((prefecture) => (
            <TouchableOpacity
              key={prefecture}
              style={[
                styles.tabButton,
                selectedPrefecture === prefecture && styles.activeTab
              ]}
              onPress={() => setSelectedPrefecture(prefecture)}
            >
              <Text 
                style={[
                  styles.tabText,
                  selectedPrefecture === prefecture && styles.activeTabText
                ]}
              >
                {prefecture}
              </Text>
              <Text 
                style={[
                  styles.tabCount,
                  selectedPrefecture === prefecture && styles.activeTabCount
                ]}
              >
                ({courseCountByPrefecture[prefecture]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* コースリスト */}
      <View style={styles.courseList}>
        {filteredCourses.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
              該当するコースが見つかりません
            </Text>
          </View>
        ) : (
          filteredCourses.map((course, index) => {
            const isFav = isFavorite(course.name);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.courseButton,
                  isFav && styles.favoriteCourseButton
                ]}
                onPress={() => onCourseSelect(course.name)}
              >
                <View style={styles.courseContent}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseButtonText}>
                      {course.name}
                    </Text>
                    {course.prefecture && (
                      <View style={styles.prefectureBadge}>
                        <Text style={styles.prefectureBadgeText}>
                          {course.prefecture}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.courseHoles}>
                    {course.totalHoles}ホール
                  </Text>
                </View>
                <View style={styles.courseActions}>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(course.name);
                    }}
                  >
                    <Text style={styles.favoriteIcon}>
                      {isFav ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.courseArrow}>→</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.grayDark,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  searchInput: {
    backgroundColor: colors.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: fontSize.base,
  },
  tabContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  tabScroll: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.light,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.grayDark,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  tabCount: {
    fontSize: fontSize.xs,
    color: colors.gray,
    marginLeft: spacing.xs,
  },
  activeTabCount: {
    color: colors.white,
  },
  courseList: {
    padding: spacing.md,
  },
  noResults: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: fontSize.base,
    color: colors.gray,
  },
  courseButton: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteCourseButton: {
    backgroundColor: colors.light,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  courseContent: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  courseButtonText: {
    fontSize: fontSize.lg,
    color: colors.dark,
    fontWeight: '500',
    flex: 1,
  },
  prefectureBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.sm,
  },
  prefectureBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: 'bold',
  },
  courseHoles: {
    fontSize: fontSize.sm,
    color: colors.grayDark,
  },
  courseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  favoriteIcon: {
    fontSize: fontSize.xxl,
    color: colors.warning,
  },
  courseArrow: {
    fontSize: fontSize.xl,
    color: colors.primary,
  },
});

export default HomeScreen;