// コース管理サービス

import { Course } from '@/types/models';
import { databaseManager } from '@/database/helpers';

interface HoleInfo {
  number: number;
  par: number;
  distance?: number;
}

// デフォルトコース情報
const DEFAULT_COURSES: Course[] = [
  {
    id: 'default_18',
    name: 'Standard 18 Holes',
    holes: 18,
    totalPar: 54, // 18 x 3
    location: 'Local',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default_9',
    name: 'Standard 9 Holes',
    holes: 9,
    totalPar: 27, // 9 x 3
    location: 'Local',
    createdAt: new Date().toISOString(),
  },
];

// 標準的なホール構成（18ホール）
const STANDARD_18_HOLES: HoleInfo[] = [
  { number: 1, par: 3 },
  { number: 2, par: 3 },
  { number: 3, par: 3 },
  { number: 4, par: 3 },
  { number: 5, par: 3 },
  { number: 6, par: 3 },
  { number: 7, par: 3 },
  { number: 8, par: 3 },
  { number: 9, par: 3 },
  { number: 10, par: 3 },
  { number: 11, par: 3 },
  { number: 12, par: 3 },
  { number: 13, par: 3 },
  { number: 14, par: 3 },
  { number: 15, par: 3 },
  { number: 16, par: 3 },
  { number: 17, par: 3 },
  { number: 18, par: 3 },
];

class CourseService {
  private courses: Course[] = DEFAULT_COURSES;

  // コース一覧取得
  async getCourses(): Promise<Course[]> {
    // TODO: データベースから取得
    return this.courses;
  }

  // コースIDで取得
  async getCourseById(id: string): Promise<Course | undefined> {
    return this.courses.find(c => c.id === id);
  }

  // コース追加
  async addCourse(course: Omit<Course, 'id' | 'createdAt'>): Promise<Course> {
    const newCourse: Course = {
      ...course,
      id: `course_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    this.courses.push(newCourse);
    // TODO: データベースに保存
    
    return newCourse;
  }

  // コース更新
  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    const index = this.courses.findIndex(c => c.id === id);
    if (index >= 0) {
      this.courses[index] = { ...this.courses[index], ...updates };
      // TODO: データベースで更新
      return this.courses[index];
    }
    return null;
  }

  // コース削除
  async deleteCourse(id: string): Promise<boolean> {
    const index = this.courses.findIndex(c => c.id === id);
    if (index >= 0) {
      this.courses.splice(index, 1);
      // TODO: データベースから削除
      return true;
    }
    return false;
  }

  // ホール情報取得
  getHoleInfo(courseId: string, holeNumber: number): HoleInfo | undefined {
    // 現在は固定値を返す
    return STANDARD_18_HOLES.find(h => h.number === holeNumber);
  }

  // 全ホール情報取得
  getAllHoles(courseId: string): HoleInfo[] {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return [];

    if (course.holes === 9) {
      return STANDARD_18_HOLES.slice(0, 9);
    }
    return STANDARD_18_HOLES;
  }

  // デフォルトコースの初期化
  async initializeDefaultCourses(): Promise<void> {
    // TODO: データベースにデフォルトコースを保存
    console.log('Default courses initialized');
  }
}

export const courseService = new CourseService();