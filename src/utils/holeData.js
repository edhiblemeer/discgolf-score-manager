// ホールデータのテンプレートと生成関数

// 一般的な18ホールのコース設定テンプレート
export const holeTemplates = [
  { par: 4, minDist: 280, maxDist: 380 }, // PAR4: 280-380m
  { par: 3, minDist: 120, maxDist: 180 }, // PAR3: 120-180m
  { par: 5, minDist: 420, maxDist: 520 }, // PAR5: 420-520m
  { par: 4, minDist: 300, maxDist: 400 }, // PAR4: 300-400m
  { par: 3, minDist: 140, maxDist: 200 }, // PAR3: 140-200m
  { par: 4, minDist: 320, maxDist: 420 }, // PAR4: 320-420m
];

// ホールデータを生成する関数
export const generateHoleData = (holeNumber) => {
  const template = holeTemplates[holeNumber % 6];
  const distance = template.minDist + Math.floor(Math.random() * (template.maxDist - template.minDist));
  
  return {
    par: template.par,
    distance: distance
  };
};

// デフォルトのパー値を取得
export const getDefaultPar = () => 4;

// デフォルトの距離を取得
export const getDefaultDistance = () => 250;