import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import {
  aplPlacePiece,
  aplRemovePiece,
  boardsToGridArray,
  getNumberOfMills,
  getNumberOfPieces,
} from './apl';
import { gridIndexToAplIndex, startingBoard } from './utility';

const db = defAtom({
  phase: 1,
  boards: {
    w: startingBoard,
    b: startingBoard,
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
});
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
              const currentTurn = turn.deref();
              const currentAction = action.deref();
              const currentOpponent = opponent.deref();
              const clickedOnOpponent = pieceAtPoint === currentOpponent;
              const previousNumberOfPiecesOnBoard = numPiecesOnBoardCursor.deref();

              if (currentAction === 'place' && !pieceAtPoint) {
                const newBoard = aplPlacePiece(boards[currentTurn], aplIndex);
                boardsCursor.resetIn(currentTurn, newBoard);

                const q = numPiecesPlacedCursor.deref()[currentTurn] + 1

                numPiecesPlacedCursor.resetIn(currentTurn, q);

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
              }

              // TODO check number of pieces for each player
              const bx = boardsCursor.deref()
              console.log('bx', bx);
              const numCurrent = getNumberOfPieces(bx[currentTurn])
              const numOpponent = getNumberOfPieces(bx[currentOpponent])
              console.log('numCurrent', numCurrent);
              console.log('numOpponent', numOpponent);
              numPiecesOnBoardCursor.resetIn(currentTurn, getNumberOfPieces(bx[currentTurn]));
              numPiecesOnBoardCursor.resetIn(currentOpponent, getNumberOfPieces(bx[currentOpponent]));
              // TODO determine if advance to phase 2 or phase 3 or win/loss

              const currentPhase = phase.deref()
              console.log('currentPhase', currentPhase);

              const currentNumPlaced = numPiecesPlacedCursor.deref()
              console.log('currentNumPlaced', currentNumPlaced);

              if (currentPhase === 1 && currentNumPlaced['w'] >= 9 && currentNumPlaced['b'] >= 9) {
                console.log('yes advance to phase 2!!')
                phase.reset(2)
              } else {
                console.log('no stay in phase 1')
              }

              if (currentPhase === 2) {
                console.log('yep in phase 2')
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
