// CSVデータをインポートしてcourses.jsに統合するスクリプト
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSVファイルを読み込み
const csvPath = path.join(__dirname, 'all_courses_template.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');

// createCoursesFromCSV関数（courses.jsから複製）
const createCoursesFromCSV = (csvData) => {
  const lines = csvData.trim().split('\n');
  
  // ヘッダー行を解析してカラムの位置を特定
  const header = lines[0].toLowerCase();
  const hasPrefecture = header.includes('prefecture');
  
  // ヘッダー行をスキップ
  if (header.includes('course_name') || header.includes('prefecture')) {
    lines.shift();
  }
  
  // コースごとにデータをグループ化
  const courseMap = new Map();
  
  for (const line of lines) {
    const columns = line.split(',');
    
    let prefecture, courseName, totalHoles, hole, par, distance;
    
    if (hasPrefecture) {
      [prefecture, courseName, totalHoles, hole, par, distance] = columns;
    } else {
      [courseName, totalHoles, hole, par, distance] = columns;
      prefecture = null;
    }
    
    // "で囲まれたコース名の処理
    if (courseName && courseName.startsWith('"') && courseName.endsWith('"')) {
      courseName = courseName.slice(1, -1);
    }
    
    if (!courseName || !hole || !par) {
      continue; // 不完全な行はスキップ
    }
    
    // totalHolesが空の場合はホール数から推測
    const totalHolesNum = totalHoles ? parseInt(totalHoles) : null;
    
    if (!courseMap.has(courseName)) {
      courseMap.set(courseName, {
        id: courseName.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf_]/g, ''), // 日本語文字も保持
        name: courseName.trim(),
        prefecture: prefecture ? prefecture.trim() : null,
        totalHoles: totalHolesNum,
        holes: []
      });
    }
    
    const course = courseMap.get(courseName);
    course.holes.push({
      holeNumber: parseInt(hole),
      par: parseInt(par),
      distance: distance === '' || distance === 'null' || !distance || !distance.trim() ? null : parseInt(distance)
    });
  }
  
  // Map を配列に変換
  const courses = Array.from(courseMap.values());
  
  // 各コースのホールを番号順にソート
  courses.forEach(course => {
    course.holes.sort((a, b) => a.holeNumber - b.holeNumber);
    
    // totalHolesが未設定の場合、ホール数から推測
    if (!course.totalHoles) {
      course.totalHoles = course.holes.length;
    }
  });
  
  return courses;
};

// CSVをパース
const importedCourses = createCoursesFromCSV(csvData);

console.log(`インポート結果: ${importedCourses.length}コース`);
importedCourses.forEach(course => {
  console.log(`- ${course.prefecture} ${course.name}: ${course.totalHoles}ホール`);
});

// courses.jsを生成
const coursesContent = `// コースデータの定義
// 各コースには名前、ホール数、各ホールの情報が含まれる
// 27ホールコースは3つの9ホールレイアウト（A,B,C）から2つを選択して18ホールプレイ

// 27ホールコースのレイアウトオプション
export const LAYOUT_OPTIONS_27 = [
  { id: 'a_b', name: 'A→B コース', startHoles: [1, 10], playableHoles: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'b_c', name: 'B→C コース', startHoles: [10, 19], playableHoles: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27] },
  { id: 'a_c', name: 'A→C コース', startHoles: [1, 19], playableHoles: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27] },
];

export const COURSES = ${JSON.stringify(importedCourses, null, 2)};

// コース名のリストを取得
export const getCourseNames = () => {
  return COURSES.map(course => course.name);
};

// コース名からコースデータを取得
export const getCourseByName = (name) => {
  return COURSES.find(course => course.name === name);
};

// コースIDからコースデータを取得
export const getCourseById = (id) => {
  return COURSES.find(course => course.id === id);
};

// 指定したホール番号のデータを取得
export const getHoleData = (courseName, holeNumber) => {
  const course = getCourseByName(courseName);
  if (!course || !course.holes || course.holes.length === 0) {
    // データがない場合はデフォルト値を返す
    return null;
  }
  return course.holes.find(hole => hole.holeNumber === holeNumber);
};

// CSVデータから単一コースを作成（旧形式用）
export const createCourseFromCSV = (csvData) => {
  // 省略...
};

// CSVデータから複数コースを一括作成（新形式）
export const createCoursesFromCSV = (csvData) => {
  // 省略...
};

// CSVデータをCOURSES配列に追加
export const addCoursesFromCSV = (csvData) => {
  // 省略...
};
`;

// ファイルを書き込み
const outputPath = path.join(__dirname, 'courses_imported.js');
fs.writeFileSync(outputPath, coursesContent, 'utf8');

console.log('\ncourses_imported.js を生成しました！');