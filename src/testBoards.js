export const testWhiteBoard = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1,];
export const testBlackBoard = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,];

// actually, final place right before phase 2
export const boardWithFourBlack = {
  phase: 2,
  boards: {
    w: [0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0,],
    b: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1,],
  },
  numberOfMills: { w: 0, b: 0 },
  numberOfPiecesOnBoard: { w: 9, b: 4 },
  numberOfPiecesPlaced: { w: 9, b: 9 },
  turn: 'w',
  action: 'lift',
  isFlying: { w: false, b: false },
  feedback: '',
  liftedAplIndex: null,
  possiblePlaces: [],
};

// actually, final place right before phase 2
export const boardDbAtPhase2 = {
  phase: 1,
  boards: {
    w: [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0,],
    b: [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0,],
  },
  numberOfMills: { w: 0, b: 0 },
  numberOfPiecesOnBoard: { w: 0, b: 0 },
  numberOfPiecesPlaced: { w: 9, b: 8 },
  turn: 'b',
  action: 'place',
  isFlying: { w: false, b: false },
  feedback: '',
  liftedAplIndex: null,
  possiblePlaces: [],
};

export const boardDbBeforePhase3 = {
  phase: 2,
  boards: {
    w: [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,],
    b: [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0,],
  },
  numberOfMills: { w: 0, b: 2 },
  numberOfPiecesOnBoard: { w: 0, b: 0 },
  numberOfPiecesPlaced: { w: 9, b: 9 },
  turn: 'b',
  action: 'lift',
  isFlying: { w: false, b: false },
  feedback: '',
  possiblePlaces: [],
  liftedAplIndex: null,
};
