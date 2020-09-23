// takes a board index, looks it up, and if it's a point position, returns that
export const gridIndexToAplIndex = {
  0: 0,
  3: 1,
  6: 2,
  8: 9,
  10: 10,
  12: 11,
  16: 18,
  17: 19,
  18: 20,
  21: 3,
  22: 12,
  23: 21,
  25: 23,
  26: 14,
  27: 5,
  30: 24,
  31: 25,
  32: 26,
  36: 15,
  38: 16,
  40: 17,
  42: 6,
  45: 7,
  48: 8,
};

export const startingBoard = Array.from(Array(27), (_) => 0);

export const testWhiteBoard = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1]
export const testBlackBoard = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
