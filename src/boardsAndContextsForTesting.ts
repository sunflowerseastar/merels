export const boardJustBeforeMovingState = {
  boards: {
    w: [
      1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0,
      1, 0,
    ],
    b: [
      0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1,
      0, 0,
    ],
  },
  numberOfPiecesPlaced: { w: 9, b: 8 },
  turn: 'b',
};

export const boardJustBeforeWhiteIsFlying = {
  boards: {
    w: [
      1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
      0, 0,
    ],
    b: [
      0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
      0, 0,
    ],
  },
  numberOfPiecesPlaced: { w: 9, b: 9 },
  turn: 'b',
  userAction: 'lift',
};

// TODO fix
export const boardWithFourBlack = {
  boards: {
    w: [
      0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0,
      1, 0,
    ],
    b: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
      0, 1,
    ],
  },
  numberOfPiecesPlaced: { w: 9, b: 9 },
  userAction: 'lift',
};

export const whiteHasFormedAMillAndRemovedABlack = {
  boards: {
    w: [
      0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0,
      0, 1,
    ],
    b: [
      1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
      0, 0,
    ],
  },
  numberOfPiecesPlaced: { w: 6, b: 5 },
  turn: 'b',
};
