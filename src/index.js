import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import {
  aplPlacePiece,
  aplPlaceAndRemovePiece,
  aplRemovePiece,
  boardsToGridArray,
  getNumberOfMills,
  getNumberOfPieces,
  openPointsAdjacentToPiece,
  atest,
} from './apl';
import {
  boardDbAtPhase2,
  boardDbBeforePhase3,
  connectedPointsGraph,
  gridIndexToAplIndex,
} from './utility';

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
};

// const db = defAtom(initialDb);
const db = defAtom(boardDbBeforePhase3);

const action = defCursor(db, 'action');
const boardsCursor = defCursor(db, 'boards');
const feedback = defCursor(db, 'feedback');
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
  console.log('checkAdvanceToPhase2()');

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
    console.log('yes advance to phase 2!!');
    console.log('LIFT 4');
    action.reset('lift');
    phase.reset(2);
  }

  // check to see if we should advance from phase 2 to phase 3
  if (currentPhase === 2) {
    // console.log('yep in phase 2');

    const board = boardsCursor.deref();
    const numberOfPiecesOpponent = getNumberOfPieces(board[currentOpponent]);
    const numberOfPiecesCurrentTurn = getNumberOfPieces(board[currentTurn]);
    console.log('currentTurn, currentOpponent', currentTurn, currentOpponent);
    console.log(
      'numberOfPiecesOpponent,numberOfPiecesCurrentTurn',
      numberOfPiecesOpponent,
      numberOfPiecesCurrentTurn
    );

    if (numberOfPiecesOpponent === 3) {
      console.log('opponent should start flying');
      isFlying.resetIn(currentOpponent, true)
    }
  }
};

const endTurn = () => {
  console.log('endTurn');
  checkAdvanceToPhase2();
  turn.reset(opponent.deref());
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
            onclick: () => {
              console.log('db.deref()', db.deref());
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
                numPiecesPlacedCursor.swapIn(currentTurn, x => x + 1);

                // either continue or end turn depending on if there's a new mill
                const previousNumberOfMills = getNumberOfMills(boards[currentTurn])
                const newNumberOfMills = getNumberOfMills(boardAfterPlace);
                if (newNumberOfMills > previousNumberOfMills) {
                  console.log('REMOVE 1');
                  action.reset('remove');
                } else {
                  console.log('ENDTURN 1');
                  endTurn();
                }
              } else if (currentPhase === 2 && currentAction === 'place' && !pieceAtPoint) {
                if (isFlying.deref()[currentTurn] || possiblePlaces.deref().includes(aplIndex)) {
                  // update board
                  const boardAfterRemoval = aplRemovePiece(boards[currentTurn], liftedAplIndex.deref());
                  const boardAfterPlace = aplPlacePiece(boardAfterRemoval, aplIndex);
                  boardsCursor.resetIn(currentTurn, boardAfterPlace);

                  // either continue or end turn depending on if there's a new mill
                  const previousNumberOfMills = getNumberOfMills(boardAfterRemoval);
                  const newNumberOfMills = getNumberOfMills(boardAfterPlace);
                  if (newNumberOfMills > previousNumberOfMills) {
                    action.reset('remove');
                  } else {
                    console.log('LIFT 1');
                    action.reset('lift');
                    console.log('ENDTURN 2');
                    endTurn();
                  }
                } else {
                  feedback.reset('not legal move, cancel');
                  console.log('LIFT 2');
                  action.reset('lift');
                }

                liftedAplIndex.reset(null);
                possiblePlaces.reset([]);
              } else if (currentAction === 'remove' && clickedOnOpponent) {
                const newBoard = aplRemovePiece(
                  boards[currentOpponent],
                  aplIndex
                );
                boardsCursor.resetIn(currentOpponent, newBoard);
                millCursor.resetIn(currentOpponent, getNumberOfMills(newBoard));
                if (currentPhase === 1) {
                  action.reset('place');
                } else {
                  console.log('LIFT 3');
                  action.reset('lift');
                }
                console.log('ENDTURN 3');
                endTurn();
              } else if (currentAction === 'lift' && clickedOnOwnPiece) {
                const openPoints = openPointsAdjacentToPiece(
                  boards[currentTurn],
                  boards[currentOpponent],
                  connectedPointsGraph[aplIndex]
                );

                console.log('openPoints', openPoints);

                if (isFlying.deref()[currentTurn]) {
                  console.log('yep we are flying')
                  action.reset('place');
                  liftedAplIndex.reset(aplIndex);
                } else if (!!openPoints.length) {
                  console.log('PLACE 2');
                  action.reset('place');
                  possiblePlaces.reset(openPoints);
                  liftedAplIndex.reset(aplIndex);
                } else {
                  feedback.reset("this piece doesn't have any available moves");
                }
              } else {
                console.log('clicked on "invalid" point')
                if (currentPhase === 2) {
                  action.reset('lift')
                }
              }
            },
          },
          ['span.inner', pieceAtPoint],
        ]
      : ['span', ''];
  }),
]);

start(() => [
  'div.app-inner',
  ['h1.title', 'mill'],
  boardsView,
  [
    'div.info',
    ['p.turn', 'turn: ', turn.deref()],
    ['p.action', 'action: ', action.deref()],
    ['p.feedback', 'feedback: ', feedback.deref()],
  ],
]);
