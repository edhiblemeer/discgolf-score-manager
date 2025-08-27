// コースデータの定義
// 各コースには名前、ホール数、各ホールの情報が含まれる
// 27ホールコースは3つの9ホールレイアウト（A,B,C）から2つを選択して18ホールプレイ

// 27ホールコースのレイアウトオプション（全6パターン）
export const LAYOUT_OPTIONS_27 = [
  { id: 'a_b', name: '1-9 → 10-18番', startHoles: [1, 10], playableHoles: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'a_c', name: '1-9 → 19-27番', startHoles: [1, 19], playableHoles: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27] },
  { id: 'b_a', name: '10-18 → 1-9番', startHoles: [10, 1], playableHoles: [10,11,12,13,14,15,16,17,18,1,2,3,4,5,6,7,8,9] },
  { id: 'b_c', name: '10-18 → 19-27番', startHoles: [10, 19], playableHoles: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27] },
  { id: 'c_a', name: '19-27 → 1-9番', startHoles: [19, 1], playableHoles: [19,20,21,22,23,24,25,26,27,1,2,3,4,5,6,7,8,9] },
  { id: 'c_b', name: '19-27 → 10-18番', startHoles: [19, 10], playableHoles: [19,20,21,22,23,24,25,26,27,10,11,12,13,14,15,16,17,18] },
];

export const COURSES = [
  {
    "id": "ひたち海浜公園",
    "name": "ひたち海浜公園",
    "prefecture": "茨城県",
    "totalHoles": 27,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 43
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 52
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 40
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 57
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 69
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 48
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 10,
        "par": 3,
        "distance": 70
      },
      {
        "holeNumber": 11,
        "par": 3,
        "distance": 43
      },
      {
        "holeNumber": 12,
        "par": 3,
        "distance": 35
      },
      {
        "holeNumber": 13,
        "par": 3,
        "distance": 42
      },
      {
        "holeNumber": 14,
        "par": 3,
        "distance": 44
      },
      {
        "holeNumber": 15,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 16,
        "par": 3,
        "distance": 46
      },
      {
        "holeNumber": 17,
        "par": 3,
        "distance": 40
      },
      {
        "holeNumber": 18,
        "par": 3,
        "distance": 49
      },
      {
        "holeNumber": 19,
        "par": 3,
        "distance": 73
      },
      {
        "holeNumber": 20,
        "par": 3,
        "distance": 72
      },
      {
        "holeNumber": 21,
        "par": 3,
        "distance": 75
      },
      {
        "holeNumber": 22,
        "par": 3,
        "distance": 71
      },
      {
        "holeNumber": 23,
        "par": 3,
        "distance": 66
      },
      {
        "holeNumber": 24,
        "par": 3,
        "distance": 66
      },
      {
        "holeNumber": 25,
        "par": 3,
        "distance": 61
      },
      {
        "holeNumber": 26,
        "par": 3,
        "distance": 68
      },
      {
        "holeNumber": 27,
        "par": 3,
        "distance": 99
      }
    ]
  },
  {
    "id": "美浦村_光と風の丘公園",
    "name": "美浦村 光と風の丘公園",
    "prefecture": "茨城県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 60
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 48
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 87
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 93
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 80
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 71
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 78
      }
    ]
  },
  {
    "id": "龍ヶ崎ふるさとふれあい公園",
    "name": "龍ヶ崎ふるさとふれあい公園",
    "prefecture": "茨城県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 59
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 51
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 56
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 61
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 58
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 53
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 63
      }
    ]
  },
  {
    "id": "日光だいや川公園",
    "name": "日光だいや川公園",
    "prefecture": "茨城県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 40
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 30
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 40
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 54
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 33
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 35
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 35
      }
    ]
  },
  {
    "id": "清原3号緑地",
    "name": "清原3号緑地",
    "prefecture": "栃木県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 61
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 62
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 63
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 54
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 47
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 79
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 60
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 49
      }
    ]
  },
  {
    "id": "_小山思いの森",
    "name": "小山思いの森",
    "prefecture": "栃木県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 4,
        "distance": 71
      },
      {
        "holeNumber": 2,
        "par": 4,
        "distance": 81
      },
      {
        "holeNumber": 3,
        "par": 4,
        "distance": 60
      },
      {
        "holeNumber": 4,
        "par": 4,
        "distance": 72
      },
      {
        "holeNumber": 5,
        "par": 4,
        "distance": 63
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 7,
        "par": 4,
        "distance": 65
      },
      {
        "holeNumber": 8,
        "par": 4,
        "distance": 52
      },
      {
        "holeNumber": 9,
        "par": 4,
        "distance": 62
      }
    ]
  },
  {
    "id": "足利岩井分水路緑地",
    "name": "足利岩井分水路緑地",
    "prefecture": "栃木県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 70
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 40
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 80
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 48
      }
    ]
  },
  {
    "id": "城見ヶ丘運動公園",
    "name": "城見ヶ丘運動公園",
    "prefecture": "栃木県",
    "totalHoles": 18,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 10,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 11,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 12,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 13,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 14,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 15,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 16,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 17,
        "par": 3,
        "distance": null
      },
      {
        "holeNumber": 18,
        "par": 3,
        "distance": null
      }
    ]
  },
  {
    "id": "赤城林間学園",
    "name": "赤城林間学園",
    "prefecture": "群馬県",
    "totalHoles": 12,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 56
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 51
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 52
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 53
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 53
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 34
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 61
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 62
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 46
      },
      {
        "holeNumber": 10,
        "par": 3,
        "distance": 46
      },
      {
        "holeNumber": 11,
        "par": 3,
        "distance": 68
      },
      {
        "holeNumber": 12,
        "par": 3,
        "distance": 68
      }
    ]
  },
  {
    "id": "国営昭和記念公園",
    "name": "国営昭和記念公園",
    "prefecture": "東京都",
    "totalHoles": 18,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 34
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 47
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 3
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 40
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 37
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 73
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 53
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 41
      },
      {
        "holeNumber": 10,
        "par": 3,
        "distance": 43
      },
      {
        "holeNumber": 11,
        "par": 3,
        "distance": 80
      },
      {
        "holeNumber": 12,
        "par": 3,
        "distance": 74
      },
      {
        "holeNumber": 13,
        "par": 3,
        "distance": 44
      },
      {
        "holeNumber": 14,
        "par": 3,
        "distance": 75
      },
      {
        "holeNumber": 15,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 16,
        "par": 3,
        "distance": 70
      },
      {
        "holeNumber": 17,
        "par": 3,
        "distance": 77
      },
      {
        "holeNumber": 18,
        "par": 3,
        "distance": 82
      }
    ]
  },
  {
    "id": "辰巳の森海浜公園",
    "name": "辰巳の森海浜公園",
    "prefecture": "東京都",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 36
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 37
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 35
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 41
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 41
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 27
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 33
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 43
      }
    ]
  },
  {
    "id": "船橋市運動公園",
    "name": "船橋市運動公園",
    "prefecture": "千葉県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 30
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 38
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 32
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 42
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 35
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 82
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 30
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 20
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 37
      }
    ]
  },
  {
    "id": "愛川ふれあいの村",
    "name": "愛川ふれあいの村",
    "prefecture": "神奈川県",
    "totalHoles": 18,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 48
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 52
      },
      {
        "holeNumber": 3,
        "par": 5,
        "distance": 93
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 37
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 52
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 52
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 54
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 35
      },
      {
        "holeNumber": 10,
        "par": 3,
        "distance": 34
      },
      {
        "holeNumber": 11,
        "par": 3,
        "distance": 41
      },
      {
        "holeNumber": 12,
        "par": 3,
        "distance": 44
      },
      {
        "holeNumber": 13,
        "par": 3,
        "distance": 55
      },
      {
        "holeNumber": 14,
        "par": 3,
        "distance": 33
      },
      {
        "holeNumber": 15,
        "par": 3,
        "distance": 42
      },
      {
        "holeNumber": 16,
        "par": 3,
        "distance": 29
      },
      {
        "holeNumber": 17,
        "par": 3,
        "distance": 46
      },
      {
        "holeNumber": 18,
        "par": 3,
        "distance": 44
      }
    ]
  },
  {
    "id": "細谷戸エコ広場",
    "name": "細谷戸エコ広場",
    "prefecture": "神奈川県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 37
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 39
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 89
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 38
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 53
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 42
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 38
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 43
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 30
      }
    ]
  },
  {
    "id": "国営武蔵丘陵森林公園",
    "name": "国営武蔵丘陵森林公園",
    "prefecture": "埼玉県",
    "totalHoles": 9,
    "holes": [
      {
        "holeNumber": 1,
        "par": 3,
        "distance": 45
      },
      {
        "holeNumber": 2,
        "par": 3,
        "distance": 50
      },
      {
        "holeNumber": 3,
        "par": 3,
        "distance": 51
      },
      {
        "holeNumber": 4,
        "par": 3,
        "distance": 67
      },
      {
        "holeNumber": 5,
        "par": 3,
        "distance": 73
      },
      {
        "holeNumber": 6,
        "par": 3,
        "distance": 39
      },
      {
        "holeNumber": 7,
        "par": 3,
        "distance": 48
      },
      {
        "holeNumber": 8,
        "par": 3,
        "distance": 48
      },
      {
        "holeNumber": 9,
        "par": 3,
        "distance": 42
      }
    ]
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

// 県の一覧を取得
export const getPrefectures = () => {
  const prefectures = [...new Set(COURSES.map(course => course.prefecture).filter(Boolean))];
  return prefectures.sort();
};

// 県別にコースを取得
export const getCoursesByPrefecture = (prefecture) => {
  if (!prefecture || prefecture === '全て') {
    return COURSES;
  }
  return COURSES.filter(course => course.prefecture === prefecture);
};

// コース名で検索
export const searchCourses = (query) => {
  if (!query) return COURSES;
  const lowerQuery = query.toLowerCase();
  return COURSES.filter(course => 
    course.name.toLowerCase().includes(lowerQuery) ||
    (course.prefecture && course.prefecture.toLowerCase().includes(lowerQuery))
  );
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
