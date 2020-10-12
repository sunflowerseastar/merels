import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import {
  aplPlacePiece,
  aplRemovePiece,
  boardsToGridArray,
  getNumberOfMills,
  getNumberOfPieces,
  openPointsAdjacentToPiece,
} from './apl';
import { boardDbAtPhase2, gridIndexToAplIndex } from './utility';

const initialDb = {
  phase: 1,
  boards: {
    w: Array.from(Array(27), (_) => 0),
    b: Array.from(Array(27), (_) => 0),
  },
  numberOfMills: {
    w: 0,
    b: 0,
  },
  numberOfPiecesOnBoard: {
    w: 0,
    b: 0,
  },
  numberOfPiecesPlaced: {
    w: 0,
    b: 0,
  },
  turn: 'w',
  action: 'place',
};

// const db = defAtom(initialDb);
const db = defAtom(boardDbAtPhase2);
const phase = defCursor(db, 'phase');
const turn = defCursor(db, 'turn');
const opponent = defView(db, 'turn', (x) => (x === 'w' ? 'b' : 'w'));
const action = defCursor(db, 'action');
const boardsCursor = defCursor(db, 'boards');
const millCursor = defCursor(db, ['numberOfMills']);
const numPiecesOnBoardCursor = defCursor(db, ['numberOfPiecesOnBoards']);
const numPiecesPlacedCursor = defCursor(db, ['numberOfPiecesPlaced']);
const millCount = defView(db, ['numberOfMills']);

const changeTurn = () => {
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
              const currentAction = action.deref();
              const currentOpponent = opponent.deref();
              const currentPhase = phase.deref();
              const currentTurn = turn.deref();
              const previousNumberOfPiecesOnBoard = numPiecesOnBoardCursor.deref();

              const clickedOnOpponent = pieceAtPoint === currentOpponent;
              const clickedOnOwnPiece = pieceAtPoint === currentTurn;

              if (currentAction === 'place' && !pieceAtPoint) {
                const newBoard = aplPlacePiece(boards[currentTurn], aplIndex);
                boardsCursor.resetIn(currentTurn, newBoard);

                const newNumPiecesPlaced =
                  numPiecesPlacedCursor.deref()[currentTurn] + 1;
                numPiecesPlacedCursor.resetIn(currentTurn, newNumPiecesPlaced);

                const previousNumberOfMills = millCount.deref()[currentTurn];
                const newNumberOfMills = getNumberOfMills(newBoard);

                if (newNumberOfMills > previousNumberOfMills) {
                  action.reset('remove');
                  millCursor.resetIn(currentTurn, newNumberOfMills);
                } else {
                  changeTurn();
                }
              } else if (currentAction === 'remove' && clickedOnOpponent) {
                const newBoard = aplRemovePiece(
                  boards[currentOpponent],
                  aplIndex
                );
                boardsCursor.resetIn(currentOpponent, newBoard);
                millCursor.resetIn(currentOpponent, getNumberOfMills(newBoard));
                action.reset('place');
                changeTurn();
              } else if (currentAction === 'lift' && clickedOnOwnPiece) {
                console.log('yea lift', aplIndex);
                const openPoints = openPointsAdjacentToPiece(
                  boards[currentTurn],
                  boards[currentOpponent],
                  aplIndex
                );
                console.log('openPoints', openPoints);
              }

              // TODO check number of pieces for each player
              const boardAfterMove = boardsCursor.deref();
              const numberOfPiecesCurrent = getNumberOfPieces(
                boardAfterMove[currentTurn]
              );
              const numberOfPiecesOpponent = getNumberOfPieces(
                boardAfterMove[currentOpponent]
              );

              numPiecesOnBoardCursor.reset({
                [currentTurn]: numberOfPiecesCurrent,
                [currentOpponent]: numberOfPiecesOpponent,
              });

              const currentNumPlaced = numPiecesPlacedCursor.deref();

              if (
                currentPhase === 1 &&
                currentNumPlaced['w'] >= 9 &&
                currentNumPlaced['b'] >= 9
              ) {
                console.log('yes advance to phase 2!!');
                action.reset('lift');
                phase.reset(2);
              }

              if (currentPhase === 2) {
                console.log('yep in phase 2');

                if (numberOfPiecesOpponent === 3) {
                  console.log('opponent should start flying');
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
  ],
]);
