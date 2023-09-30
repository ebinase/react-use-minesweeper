export const getRandomElements = (source: any[], size: number) => {
  if (size > source.length) {
    throw new Error('Size is greater than array length');
  }

  return sampleWithRecursion(source, size);
};

// 渡された配列からランダムな要素を指定された数だけ返す再帰関数
const sampleWithRecursion = (source: any[], size: number): any[] => {
  if (size === 0) return [];

  const index = generateRandomIndex(source.length);

  const result = sampleWithRecursion(
    source.filter((_, j) => j !== index),
    size - 1,
  );

  return [source[index], ...result];
};

const generateRandomIndex = (size: number) => Math.floor(Math.random() * size);
