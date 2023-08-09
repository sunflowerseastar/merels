import { $compile, $klist } from '@thi.ng/rdom';
import { indexed } from '@thi.ng/transducers';
import { reactive } from '@thi.ng/rstream';
import { defAtom, defCursor } from '@thi.ng/atom';
// import { defAtom, defCursor, defView } from '@thi.ng/atom';
// import { start } from '@thi.ng/hdom';
// import { useMachine } from '@xstate/react';
import { interpret } from 'xstate';
import { merelsMachine } from './merelsMachine';

import {
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
// import {
//   boardDbAtPhase2,
//   boardDbBeforePhase3,
//   boardWithFourBlack,
// } from './testBoards';
// import { boardJustPriorToMovingPhase } from './testContexts';

type Turn = 'w' | 'b';
export interface Boards {
  w: number[];
  b: number[];
}
interface WBNums {
  w: number;
  b: number;
}
interface WBBooleans {
  w: boolean;
  b: boolean;
}
interface State {
  phase: number;
  feedback: string;
  liftedAplIndex: number;
  boards: Boards;
  isFlying: WBBooleans;
  numberOfMills: WBNums;
  numberOfPiecesPlaced: WBNums;
  possiblePlaces: number[];
  turn: Turn;
  action: Actions;
}
type Actions = 'place' | 'lift' | 'remove' | 'end';
const initialDb: State = {
  phase: 1,
  feedback: '',
  liftedAplIndex: -1,
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
};

const db = defAtom<State>(initialDb);
// const db = defAtom(boardDbAtPhase2);
// const db = defAtom(boardWithFourBlack);

// const blockInteractions = defAtom<boolean>(false);
const hasInitiallyLoaded = defAtom<boolean>(false);
const action = defCursor(db, ['action']);
const boardsCursor = defCursor(db, ['boards']);
const feedback = defCursor(db, ['feedback']);
const isFlying = defCursor(db, ['isFlying']);
const liftedAplIndex = defCursor(db, ['liftedAplIndex']);
const millCursor = defCursor(db, ['numberOfMills']);
const numPiecesPlacedCursor = defCursor(db, ['numberOfPiecesPlaced']);

const opponent = (x: Turn) => (x === 'w' ? 'b' : 'w');

const phase = defCursor(db, ['phase']);
const possiblePlaces = defCursor(db, ['possiblePlaces']);
// const turn = defCursor(db, ['turn']);

const checkAdvanceToPhase2 = () => {
  const currentNumPlaced: WBNums = numPiecesPlacedCursor.deref();
  // const currentOpponent: Turn = opponent.deref() || initialTurn;
  // const currentOpponent: Turn = opponent.deref();
  const currentPhase = phase.deref();
  const currentTurn = turn.deref();
  const currentOpponent = opponent(currentTurn);

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

    if (numberOfPiecesOpponent === 3) {
      feedback.reset('flying');
      isFlying.resetIn([currentOpponent], true);
    }
    if (numberOfPiecesOpponent === 2) {
      feedback.reset(`${currentTurn} wins`);
      isFlying.resetIn([currentOpponent], true);
    }
  }
};

const endGameOrChangeTurn = () => {
  const currentPhase = phase.deref();
  const currentTurn = turn.deref();
  const currentOpponent = opponent(currentTurn);
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
  } else {
    // change turn
    turn.reset(currentOpponent);
  }
};

const endTurn = () => {
  checkAdvanceToPhase2();

  endGameOrChangeTurn();
};

const onClickPoint = (
  boards: Boards,
  aplIndex: number,
  pieceAtPoint: Turn | ''
) => {
  feedback.reset('');

  const currentAction = action.deref();
  const currentPhase = phase.deref();
  const currentTurn = turn.deref();
  const currentOpponent = opponent(currentTurn);

  const clickedOnOpponent = pieceAtPoint === currentOpponent;
  const clickedOnOwnPiece = pieceAtPoint === currentTurn;

  if (currentPhase === 1 && currentAction === 'place' && !pieceAtPoint) {
    // update board
    const boardAfterPlace = aplPlacePiece(boards[currentTurn], aplIndex);
    boardsCursor.resetIn([currentTurn], boardAfterPlace);

    // update numPiecesPlaced
    numPiecesPlacedCursor.swapIn([currentTurn], (x: number) => x + 1);

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
      boardsCursor.resetIn([currentTurn], boardAfterPlace);

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
      boardsCursor.resetIn([currentOpponent], newBoard);
      millCursor.resetIn([currentOpponent], getNumberOfMills(newBoard));
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
      boards[opponent(currentTurn)],
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

const actor = interpret(merelsMachine, {
  // input: boardJustPriorToMovingPhase,
}).start();

const actorBoards = actor.getSnapshot().context.boards;
const boards = reactive(actorBoards);
const actorTurn = actor.getSnapshot().context.turn;
const turn = reactive(actorTurn);

const userAction = reactive(actor.getSnapshot().context.userAction);
const userFeedback = reactive(actor.getSnapshot().context.userFeedback);

actor.subscribe((snapshot) => {
  boards.next(snapshot.context.boards);
  turn.next(snapshot.context.turn);
  userAction.next(snapshot.context.userAction);
  userFeedback.next(snapshot.context.userFeedback);
});

const boardView = $klist(
  boards.map((board) => [...indexed(0, boardsToGridArray(board))]),
  'div.grid',
  {},
  ([i, x]) => {
    // console.log('i, x', i, x);

    const aplIndex: number = gridIndexToAplIndex[i];
    const pieceAtPoint: Turn | '' = x === 1 ? 'w' : x === 2 ? 'b' : '';

    return typeof aplIndex !== 'undefined'
      ? [
          'span.point',
          {
            'data-lines': `line-${aplIndex}`,
            onclick: () => {
              // console.log(
              //   'i, x, aplIndex, pieceAtPoint',
              //   i,
              //   x,
              //   aplIndex,
              //   pieceAtPoint
              // );
              actor.send({ type: 'point.click', aplIndex, pieceAtPoint });
            },
          },
          [
            'span',
            {
              class: `piece ${pieceAtPoint ? pieceAtPoint : 'empty'}`,
            },
          ],
        ]
      : ['span', {}, ''];
  },
  ([i, x]) => `${i}${x}`
);

$compile([
  'div#app',
  {},
  [
    'div.app-inner',
    {},
    ['div.board', {}, boardView],
    [
      'div.controls',
      {},
      [
        'div.turn-pieces-container',
        {},
        [
          'div.turn-piece-container',
          {},
          ['span', { class: turn.map((turn) => `piece w current-${turn}`) }],
        ],
        [
          'div.turn-piece-container',
          {},
          ['span', { class: turn.map((turn) => `piece b current-${turn}`) }],
        ],
      ],
      [
        'p.reset',
        {
          onclick: () => {
            console.log('onclick reset');
          },
        },
        'reset stub',
      ],
      ['p.action', {}, userAction],
    ],
    ['p.feedback', {}, userFeedback],
  ],
]).mount(document.body);

// const boardsView = defView(db, ['boards'], (boards) => {
//   console.log('boardsView', boards);
//   console.log('boardsToGridArray(boards)', boardsToGridArray(boards));
//   return [
//     'div.grid',
//     boardsToGridArray(boards).map((x: number, i: number) => {
//       const aplIndex: number = gridIndexToAplIndex[i];
//       const pieceAtPoint: Turn | '' = x === 1 ? 'w' : x === 2 ? 'b' : '';

// return typeof aplIndex !== 'undefined'
//   ? [
//       'span.point',
//       {
//         'data-lines': `line-${aplIndex}`,
//         onclick: () => {
//           if (!blockInteractions.deref()) {
//             blockInteractions.reset(true);

//             onClickPoint(boards, aplIndex, pieceAtPoint);

//             setTimeout(() => {
//               blockInteractions.reset(false);
//             }, 0);
//           }
//         },
//       },
//       ['span.piece', { class: pieceAtPoint || 'empty' }, ''],
//     ]
//         : ['span', ''];
//     }),
//   ];
// });

// start(() => [
//   'div.app-inner',
//   {
//     class: `phase-${phase.deref()} turn-${turn.deref()} action-${action.deref()} ${
//       hasInitiallyLoaded.deref() ? 'has-initially-loaded' : ''
//     }`,
//   },
//   [
//     'div.board',
//     {
//       class: 'fade-in-1',
//     },
//     boardsView,
//   ],
//   [
//     'div.controls',
//     {
//       class: `${action.deref()} fade-in-2`,
//     },
//     [
//       'div.turn-pieces-container',
//       [
//         'div.turn-piece-container',
//         ['span.piece.w', { class: `current-${turn.deref()}` }],
//       ],
//       [
//         'div.turn-piece-container',
//         ['span.piece.b', { class: `current-${turn.deref()}` }],
//       ],
//     ],
//     [
//       'p.reset',
//       {
//         onclick: () => (action.deref() === 'end' ? db.reset(initialDb) : {}),
//       },
//       action.deref() === 'end' ? 'restart' : '',
//     ],
//     ['p.action', action.deref()],
//   ],
//   ['p.feedback', feedback.deref()],
// ]);

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    setTimeout(() => {
      hasInitiallyLoaded.reset(true);
    }, 0);
  }
};
