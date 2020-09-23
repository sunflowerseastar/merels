import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import { aplPlacePiece, boardsToGridArray } from './apl';
import { gridIndexToAplIndex, startingBoard } from './utility';

const db = defAtom({
  phase: 'phase1',
  boards: {
    white: startingBoard,
    black: startingBoard,
  },
  turn: 'white',
});
const phase = defCursor(db, 'phase');
const turn = defCursor(db, 'turn');
const boardsCursor = defCursor(db, 'boards');

const advanceToPhase2 = () => {
  phase.reset('phase2');
};
const returnToPhase1 = () => {
  phase.reset('phase1');
};
const changeTurn = () => {
  turn.reset(turn.deref() === 'white' ? 'black' : 'white');
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
              if (!pieceAtPoint) {
                const currentTurn = turn.deref();
                boardsCursor.resetIn(
                  currentTurn,
                  aplPlacePiece(currentTurn, boards[currentTurn], aplIndex)
                );
                changeTurn();
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
  ['p.turn', 'turn: ', turn.deref()],
]);
