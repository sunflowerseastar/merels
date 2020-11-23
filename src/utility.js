import {
  isIndexInMill,
} from './myapl';

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

export const aplIndexToMillIndex = {
  0: [0, 1],
  1: [0, 12],
  2: [0, 2],
  3: [1, 13],
  5: [2, 14],
  6: [1, 3],
  7: [3, 15],
  8: [2, 3],

  9: [4, 5],
  10: [4, 12],
  11: [4, 6],
  12: [5, 13],
  14: [6, 14],
  15: [5, 7],
  16: [7, 15],
  17: [6, 7],

  18: [8, 9],
  19: [8, 12],
  20: [8, 10],
  21: [9, 13],
  23: [10, 14],
  24: [9, 11],
  25: [11, 15],
  26: [10, 11],
}

export const connectedPointsGraph = {
  0: [1, 3],
  1: [0, 2, 10],
  2: [1, 5],
  3: [0, 6, 12],
  5: [2, 8, 14],
  6: [3, 7],
  7: [6, 8, 16],
  8: [5, 7],

  9: [10, 12],
  10: [9, 11, 1, 19],
  11: [10, 14],
  12: [9, 15, 3, 21],
  14: [11, 17, 5, 23],
  15: [12, 16],
  16: [15, 17, 7, 25],
  17: [14, 16],

  18: [19, 21],
  19: [18, 20, 10],
  20: [19, 23],
  21: [18, 24, 12],
  23: [20, 26, 14],
  24: [21, 25],
  25: [24, 26, 16],
  26: [23, 25],
};

export const testWhiteBoard = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1,];
export const testBlackBoard = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,];

export const boardDbAtPhase2 = {
  phase: 1,
  boards: {
    w: [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0,],
    b: [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0,],
  },
  numberOfMills: {w: 0, b: 0,},
  numberOfPiecesOnBoard: {w: 0, b: 0,},
  numberOfPiecesPlaced: {w: 9, b: 8,},
  turn: 'b',
  action: 'place',
  isFlying: {w: false, b: false,},
  feedback: '',
  liftedAplIndex: null,
  possiblePlaces: [],
};

export const boardDbBeforePhase3 = {
  "phase": 2,
  "boards": {
    "w": [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    "b": [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0]},
  "numberOfMills": {"w": 0, "b": 2},
  "numberOfPiecesOnBoard": {"w": 0, "b": 0},
  "numberOfPiecesPlaced": {"w": 9, "b": 9},
  "turn": "b",
  "action": "lift",
  isFlying: {w: false, b: false,},
  "feedback": "",
  "possiblePlaces": [],
  "liftedAplIndex": null
}

export const areNonMillOpponentPiecesAvailable = (opponentBoard) =>
!!opponentBoard
  .reduce((acc, x, i) => {
    // 'for each' of the opponents' pieces
    if (!!x) {
      acc.push(
        isIndexInMill(
          opponentBoard,
          aplIndexToMillIndex[i] // aka 'possibleMills', above
        )
      );
    }
    return acc;
  }, [])
// remove the pieces that are in mills,
// and see if any pieces not in mills are left
  .filter((x) => x === 0).length;
