import { getRandomElements } from './random';

test('getRandomElements_配列内の要素が取得できている', () => {
  const size = 3;
  const result = getRandomElements([1, 2, 3, 4, 5], size);
  // 要素数が正しい
  expect(result.length).toBe(size);
  // 要素が全て配列内に含まれている
  expect(result.every((element) => [1, 2, 3, 4, 5].includes(element))).toBe(true);
  // 要素が全て異なる
  expect(result.every((element, index, array) => array.indexOf(element) === index)).toBe(true);
});

test('getRandomElements_0を指定した場合は空配列が返る', () => {
  const result = getRandomElements([1, 2, 3, 4, 5], 0);
  expect(result).toEqual([]);
});

test('getRandomElements_配列の要素数より大きい数を指定した場合はエラーが発生する', () => {
  expect(() => getRandomElements([1, 2, 3, 4, 5], 6)).toThrowError();
});
