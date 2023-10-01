// 一次元の盤面の配列を二次元に変換する
export const convertToMatrix = <T>(source: Array<T>, rows: number, cols: number): T[][] => {
  const matrix: T[][] = [];
  for (let i = 0; i < rows; i++) {
    matrix.push(source.slice(i * cols, (i + 1) * cols));
  }
  return matrix;
};

type MatrixPosition = [number, number];

// 一次元配列の座標を二次元配列の座標に変換する
export const toMarixPosition = (index: number, itemsInRow: number): MatrixPosition => {
  const row = Math.floor(index / itemsInRow);
  const col = index % itemsInRow;
  return [row, col];
};

const directions = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export const getAroundItems = <T>(source: T[][], position: MatrixPosition): Array<T> => {
  const positions = getAroundPositions(source, position);
  return positions.map(([row, col]) => source[row][col]);
};

export const getAroundPositions = <T>(
  source: T[][],
  position: MatrixPosition,
): Array<MatrixPosition> => {
  const [row, col] = position;
  const positions = directions.map(([dRow, dCol]) => [row + dRow, col + dCol] as MatrixPosition);
  return positions.filter(([_row, _col]) => isInside([_row, _col], source));
};

export const isInside = <T>(position: MatrixPosition, source: T[][]): boolean => {
  const [row, col] = position;
  return row >= 0 && row < source.length && col >= 0 && col < source[0].length;
};
