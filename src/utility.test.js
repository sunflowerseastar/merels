import { expect, test } from 'vitest';
import { areNonMillOpponentPiecesAvailable } from './utility';

const testBoardWithMill = [
  1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0,
];

const testBoardWithoutMill = [
  1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0,
];

test('determine if there are non-milled', () => {
  expect(areNonMillOpponentPiecesAvailable(testBoardWithMill)).toBe(false);
  expect(areNonMillOpponentPiecesAvailable(testBoardWithoutMill)).toBe(true);
});
