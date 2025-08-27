// コースデータの定義
// 各コースには名前、ホール数、各ホールの情報が含まれる
// 27ホールコースは3つの9ホールレイアウト（A,B,C）から2つを選択して18ホールプレイ

// 27ホールコースのレイアウトオプション
export const LAYOUT_OPTIONS_27 = [
  { id: 'a_b', name: 'A→B コース', startHoles: [1, 10], playableHoles: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'b_c', name: 'B→C コース', startHoles: [10, 19], playableHoles: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27] },
  { id: 'a_c', name: 'A→C コース', startHoles: [1, 19], playableHoles: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27] },
];

export const COURSES = [
  {
    id: 'fuji_country',
    name: '富士カントリークラブ',
    totalHoles: 18,
    holes: [
      { holeNumber: 1, par: 4, distance: 340 },
      { holeNumber: 2, par: 3, distance: 165 },
      { holeNumber: 3, par: 5, distance: 485 },
      { holeNumber: 4, par: 4, distance: 380 },
      { holeNumber: 5, par: 3, distance: 175 },
      { holeNumber: 6, par: 4, distance: 360 },
      { holeNumber: 7, par: 4, distance: 395 },
      { holeNumber: 8, par: 3, distance: 155 },
      { holeNumber: 9, par: 5, distance: 510 },
      { holeNumber: 10, par: 4, distance: 385 },
      { holeNumber: 11, par: 3, distance: 180 },
      { holeNumber: 12, par: 5, distance: 520 },
      { holeNumber: 13, par: 4, distance: 370 },
      { holeNumber: 14, par: 3, distance: 160 },
      { holeNumber: 15, par: 4, distance: 355 },
      { holeNumber: 16, par: 4, distance: 405 },
      { holeNumber: 17, par: 3, distance: 190 },
      { holeNumber: 18, par: 5, distance: 495 },
    ]
  },
  {
    id: 'sakuragaoka',
    name: '桜ヶ丘ゴルフコース',
    totalHoles: 9,
    holes: [
      { holeNumber: 1, par: 4, distance: 320 },
      { holeNumber: 2, par: 3, distance: 150 },
      { holeNumber: 3, par: 5, distance: 465 },
      { holeNumber: 4, par: 4, distance: 350 },
      { holeNumber: 5, par: 3, distance: 170 },
      { holeNumber: 6, par: 4, distance: 375 },
      { holeNumber: 7, par: 4, distance: 340 },
      { holeNumber: 8, par: 3, distance: 165 },
      { holeNumber: 9, par: 5, distance: 480 },
    ]
  },
  {
    id: 'nasu_highland',
    name: '那須ハイランドゴルフ',
    totalHoles: 18,
    holes: [
      { holeNumber: 1, par: 4, distance: 365 },
      { holeNumber: 2, par: 3, distance: 155 },
      { holeNumber: 3, par: 5, distance: 505 },
      { holeNumber: 4, par: 4, distance: 390 },
      { holeNumber: 5, par: 3, distance: 185 },
      { holeNumber: 6, par: 4, distance: 345 },
      { holeNumber: 7, par: 4, distance: 410 },
      { holeNumber: 8, par: 3, distance: 145 },
      { holeNumber: 9, par: 5, distance: 495 },
      { holeNumber: 10, par: 4, distance: 375 },
      { holeNumber: 11, par: 3, distance: 165 },
      { holeNumber: 12, par: 5, distance: 515 },
      { holeNumber: 13, par: 4, distance: 355 },
      { holeNumber: 14, par: 3, distance: 175 },
      { holeNumber: 15, par: 4, distance: 385 },
      { holeNumber: 16, par: 4, distance: 400 },
      { holeNumber: 17, par: 3, distance: 195 },
      { holeNumber: 18, par: 5, distance: 490 },
    ]
  },
  {
    id: 'karuizawa_prince',
    name: '軽井沢プリンスゴルフ',
    totalHoles: 9,
    holes: [
      { holeNumber: 1, par: 4, distance: 330 },
      { holeNumber: 2, par: 3, distance: 160 },
      { holeNumber: 3, par: 5, distance: 470 },
      { holeNumber: 4, par: 4, distance: 365 },
      { holeNumber: 5, par: 3, distance: null }, // 距離不明の例
      { holeNumber: 6, par: 4, distance: 380 },
      { holeNumber: 7, par: 4, distance: 355 },
      { holeNumber: 8, par: 3, distance: 175 },
      { holeNumber: 9, par: 5, distance: null }, // 距離不明の例
    ]
  },
  {
    id: 'simple_course',
    name: 'シンプルコース（データなし）',
    totalHoles: 18,
    holes: [] // ホールデータがない場合、動的に生成
  }
];

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
  // CSV形式：
  // name,totalHoles
  // hole,par,distance
  // 1,4,340
  // 2,3,165
  // ...
  
  const lines = csvData.trim().split('\n');
  const [name, totalHoles] = lines[0].split(',');
  
  const holes = [];
  for (let i = 2; i < lines.length; i++) {
    const [holeNumber, par, distance] = lines[i].split(',');
    holes.push({
      holeNumber: parseInt(holeNumber),
      par: parseInt(par),
      distance: distance === '' || distance === 'null' ? null : parseInt(distance)
    });
  }
  
  return {
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name: name,
    totalHoles: parseInt(totalHoles),
    holes: holes
  };
};

// CSVデータから複数コースを一括作成（新形式）
export const createCoursesFromCSV = (csvData) => {
  // CSV形式（prefecture有り/無し両対応）：
  // prefecture,course_name,total_holes,hole,par,distance
  // 静岡県,富士カントリークラブ,18,1,4,340
  // または
  // course_name,total_holes,hole,par,distance
  // 富士カントリークラブ,18,1,4,340
  
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
    
    if (!courseName || !hole || !par) {
      continue; // 不完全な行はスキップ
    }
    
    // totalHolesが空の場合はホール数から推測
    const totalHolesNum = totalHoles ? parseInt(totalHoles) : null;
    
    if (!courseMap.has(courseName)) {
      courseMap.set(courseName, {
        id: courseName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''),
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

// CSVデータをCOURSES配列に追加
export const addCoursesFromCSV = (csvData) => {
  const newCourses = createCoursesFromCSV(csvData);
  
  // 既存のコースと重複しないものだけ追加
  newCourses.forEach(newCourse => {
    const existingIndex = COURSES.findIndex(c => c.id === newCourse.id || c.name === newCourse.name);
    if (existingIndex >= 0) {
      // 既存のコースを更新
      COURSES[existingIndex] = newCourse;
    } else {
      // 新規コースを追加
      COURSES.push(newCourse);
    }
  });
  
  return COURSES;
};