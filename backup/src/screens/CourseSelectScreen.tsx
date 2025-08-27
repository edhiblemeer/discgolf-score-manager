import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PlayStackScreenProps } from '@/navigation/types';
import { Course } from '@/types/models';
import { courseService } from '@/services/courseService';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = PlayStackScreenProps<'CourseSelect'>;

export default function CourseSelectScreen({ navigation }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const courseList = await courseService.getCourses();
      setCourses(courseList);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleContinue = () => {
    if (selectedCourse) {
      navigation.navigate('PlayerSetup', { courseId: selectedCourse.id });
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => {
    const isSelected = selectedCourse?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.courseCard, isSelected && styles.courseCardSelected]}
        onPress={() => handleCourseSelect(item)}
      >
        <View style={styles.courseHeader}>
          <Ionicons 
            name="golf" 
            size={24} 
            color={isSelected ? COLORS.primary : COLORS.textSecondary} 
          />
          <View style={styles.courseInfo}>
            <Text style={[styles.courseName, isSelected && styles.courseNameSelected]}>
              {item.name}
            </Text>
            <Text style={styles.courseDetails}>
              {item.holes} holes • Par {item.totalPar}
            </Text>
          </View>
        </View>
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Course</Text>
        <Text style={styles.subtitle}>Choose where you'll be playing today</Text>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="golf-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No courses available</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addCourseButton}
        onPress={() => {/* TODO: Navigate to add course */}}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.addCourseText}>Add Custom Course</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedCourse && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedCourse}
        >
          <Text style={styles.continueButtonText}>
            Continue to Player Setup
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
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
  listContent: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courseCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseInfo: {
    marginLeft: 12,
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  courseNameSelected: {
    color: COLORS.primary,
  },
  courseDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 36,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  addCourseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addCourseText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});