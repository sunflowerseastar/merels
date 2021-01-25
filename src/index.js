import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import {
  aplPlaceAndRemovePiece,
  aplPlacePiece,
  aplRemovePiece,
  boardsToGridArray,
  getNumberOfMills,
  getNumberOfPieces,
  isIndexInMill,
  openPointsAdjacentToPiece,
} from './aplGameFunctions';
import {
  aplIndexToMillIndex,
  areNonMillOpponentPiecesAvailable,
  areTherePossibleAdjacentMoves,
  connectedPointsGraph,
  gridIndexToAplIndex,
} from './utility';
import {
  boardDbAtPhase2,
  boardDbBeforePhase3,
  boardWithFourBlack,
} from './testBoards';

const initialDb = {
  phase: 1,
  feedback: '',
  liftedAplIndex: null,
  boards: {
    w: Array.from(Array(27), (_) => 0),
    b: Array.from(Array(27), (_) => 0),
  },
  isFlying: {
    w: false,
    b: false,
  },
  numberOfMills: {
    w: 0,
    b: 0,
  },
  numberOfPiecesPlaced: {
    w: 0,
    b: 0,
  },
  possiblePlaces: [],
  turn: 'w',
  action: 'place',
  hasInitiallyLoaded: false,
};

const db = defAtom(initialDb);
// const db = defAtom(boardDbAtPhase2);
const blockInteractions = defAtom(false);

const action = defCursor(db, 'action');
const boardsCursor = defCursor(db, 'boards');
const feedback = defCursor(db, 'feedback');
const hasInitiallyLoaded = defCursor(db, 'hasInitiallyLoaded');
const isFlying = defCursor(db, 'isFlying');
const liftedAplIndex = defCursor(db, 'liftedAplIndex');
const millCount = defView(db, ['numberOfMills']);
const millCursor = defCursor(db, ['numberOfMills']);
const numPiecesPlacedCursor = defCursor(db, ['numberOfPiecesPlaced']);
const opponent = defView(db, 'turn', (x) => (x === 'w' ? 'b' : 'w'));
const phase = defCursor(db, 'phase');
const possiblePlaces = defCursor(db, 'possiblePlaces');
const turn = defCursor(db, 'turn');

const checkAdvanceToPhase2 = () => {
  const currentNumPlaced = numPiecesPlacedCursor.deref();
  const currentOpponent = opponent.deref();
  const currentPhase = phase.deref();
  const currentTurn = turn.deref();

  // check to see if we should advance from phase 1 to phase 2
  if (
    currentPhase === 1 &&
    currentNumPlaced['w'] >= 9 &&
    currentNumPlaced['b'] >= 9
  ) {
    // advance to phase 2
    action.reset('lift');
    phase.reset(2);
  }

  // check to see if we should advance from phase 2 to phase 3
  if (currentPhase === 2) {
    const board = boardsCursor.deref();
    const numberOfPiecesOpponent = getNumberOfPieces(board[currentOpponent]);
    const numberOfPiecesCurrentTurn = getNumberOfPieces(board[currentTurn]);

    if (numberOfPiecesOpponent === 3) {
      feedback.reset('flying');
      isFlying.resetIn(currentOpponent, true);
    }
    if (numberOfPiecesOpponent === 2) {
      feedback.reset(`${currentTurn} wins`);
      isFlying.resetIn(currentOpponent, true);
    }
  }
};

const endGameOrChangeTurn = () => {
  const currentOpponent = opponent.deref();
  const currentPhase = phase.deref();
  const currentTurn = turn.deref();
  const boards = boardsCursor.deref();
  const numberOfPiecesOpponent = getNumberOfPieces(boards[currentOpponent]);

  const upcomingPlayerHasAdjacentMoves = areTherePossibleAdjacentMoves(
    boards[currentOpponent],
    boards[currentTurn]
  );
  const upcomingPlayerCannotMove =
    currentPhase === 2 &&
    numberOfPiecesOpponent > 2 &&
    !upcomingPlayerHasAdjacentMoves;
  const upcomingPlayerIsDownToTwoPieces =
    currentPhase === 2 && numberOfPiecesOpponent === 2;

  if (upcomingPlayerCannotMove || upcomingPlayerIsDownToTwoPieces) {
    // end game
    feedback.reset(`${currentTurn === 'w' ? 'white' : 'black'} wins`);
    action.reset('end');
    turn.reset('');
  } else {
    // change turn
    turn.reset(opponent.deref());
  }
};

const endTurn = () => {
  checkAdvanceToPhase2();

  endGameOrChangeTurn();
};

const onClickPoint = (boards, aplIndex, pieceAtPoint) => {
  feedback.reset('');

  const currentAction = action.deref();
  const currentOpponent = opponent.deref();
  const currentPhase = phase.deref();
  const currentTurn = turn.deref();

  const clickedOnOpponent = pieceAtPoint === currentOpponent;
  const clickedOnOwnPiece = pieceAtPoint === currentTurn;

  if (currentPhase === 1 && currentAction === 'place' && !pieceAtPoint) {
    // update board
    const boardAfterPlace = aplPlacePiece(boards[currentTurn], aplIndex);
    boardsCursor.resetIn(currentTurn, boardAfterPlace);

    // update numPiecesPlaced
    numPiecesPlacedCursor.swapIn(currentTurn, (x) => x + 1);

    // either continue or end turn depending on if there's a new mill
    const previousNumberOfMills = getNumberOfMills(boards[currentTurn]);
    const newNumberOfMills = getNumberOfMills(boardAfterPlace);
    if (newNumberOfMills > previousNumberOfMills) {
      action.reset('remove');
    } else {
      endTurn();
    }
  } else if (currentPhase === 2 && currentAction === 'place' && !pieceAtPoint) {
    if (
      isFlying.deref()[currentTurn] ||
      possiblePlaces.deref().includes(aplIndex)
    ) {
      // update board
      const boardAfterRemoval = aplRemovePiece(
        boards[currentTurn],
        liftedAplIndex.deref()
      );
      const boardAfterPlace = aplPlacePiece(boardAfterRemoval, aplIndex);
      boardsCursor.resetIn(currentTurn, boardAfterPlace);

      // either continue or end turn depending on if there's a new mill
      const previousNumberOfMills = getNumberOfMills(boardAfterRemoval);
      const newNumberOfMills = getNumberOfMills(boardAfterPlace);
      if (newNumberOfMills > previousNumberOfMills) {
        action.reset('remove');
      } else {
        action.reset('lift');
        endTurn();
      }
    } else {
      feedback.reset('illegal');
      action.reset('lift');
    }

    liftedAplIndex.reset(null);
    possiblePlaces.reset([]);
  } else if (currentAction === 'remove' && clickedOnOpponent) {
    const opponentBoard = boards[currentOpponent];
    const pieceToRemoveIsInMill = isIndexInMill(
      opponentBoard,
      aplIndexToMillIndex[aplIndex]
    );

    if (
      pieceToRemoveIsInMill &&
      areNonMillOpponentPiecesAvailable(opponentBoard)
    ) {
      // this piece is in a mill and others are available
      feedback.reset('locked in mill');
    } else {
      // either piece is not in a mill, or no other non-mill pieces are available

      const newBoard = aplRemovePiece(boards[currentOpponent], aplIndex);
      boardsCursor.resetIn(currentOpponent, newBoard);
      millCursor.resetIn(currentOpponent, getNumberOfMills(newBoard));
      if (currentPhase === 1) {
        action.reset('place');
      } else {
        action.reset('lift');
      }
      endTurn();
    }
  } else if (currentAction === 'lift' && clickedOnOwnPiece) {
    const openPoints = openPointsAdjacentToPiece(
      boards[currentTurn],
      boards[currentOpponent],
      connectedPointsGraph[aplIndex]
    );

    if (isFlying.deref()[currentTurn]) {
      // flying
      action.reset('place');
      liftedAplIndex.reset(aplIndex);
    } else if (!!openPoints.length) {
      action.reset('place');
      possiblePlaces.reset(openPoints);
      liftedAplIndex.reset(aplIndex);
    } else {
      feedback.reset('immovable');
    }
  } else if (currentAction === 'remove' && !clickedOnOpponent) {
    // un-removable piece
    feedback.reset('invalid');
  } else {
    if (currentPhase === 2) {
      action.reset('lift');
    }
  }
};

const boardsView = defView(db, ['boards'], (boards) => [
  'div.grid',
  boardsToGridArray(boards).map((x, i) => {
    const aplIndex = gridIndexToAplIndex[i];
    const pieceAtPoint = x === 1 ? 'w' : x === 2 ? 'b' : '';

    return typeof aplIndex !== 'undefined'
      ? [
          'span.point',
          {
            'data-lines': `line-${aplIndex}`,
            onclick: () => {
              if (!blockInteractions.deref()) {
                blockInteractions.reset(true);

                onClickPoint(boards, aplIndex, pieceAtPoint);

                setTimeout(() => {
                  blockInteractions.reset(false);
                }, 0);
              }
            },
          },
          ['span.piece', { class: pieceAtPoint || 'empty' }, ''],
        ]
      : ['span', ''];
  }),
]);

start(() => [
  'div.app-inner',
  {
    class: `phase-${phase.deref()} turn-${turn.deref()} action-${action.deref()} ${
      hasInitiallyLoaded.deref() ? 'has-initially-loaded' : ''
    }`,
  },
  [
    'div.board',
    {
      class: 'fade-in-1',
    },
    boardsView,
  ],
  [
    'div.controls',
    {
      class: `${action.deref()} fade-in-2`,
    },
    [
      'div.turn-pieces-container',
      [
        'div.turn-piece-container',
        ['span.piece.w', { class: `current-${turn.deref()}` }],
      ],
      [
        'div.turn-piece-container',
        ['span.piece.b', { class: `current-${turn.deref()}` }],
      ],
    ],
    [
      'p.reset',
      {
        onclick: () => (action.deref() === 'end' ? db.reset(initialDb) : {}),
      },
      action.deref() === 'end' ? 'restart' : '',
    ],
    ['p.action', action.deref()],
  ],
  ['p.feedback', feedback.deref()],
]);

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    setTimeout(() => {
      hasInitiallyLoaded.reset(true);
    }, 0);
  }
};
