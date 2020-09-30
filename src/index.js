import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import { aplPlacePiece, aplRemovePiece, boardsToGridArray } from './apl';
import { gridIndexToAplIndex, startingBoard } from './utility';

const db = defAtom({
  phase: 'phase1',
  boards: {
    w: startingBoard,
    b: startingBoard,
  },
  turn: 'w',
  action: 'place',
});
const phase = defCursor(db, 'phase');
const turn = defCursor(db, 'turn');
const opponent = defView(db, 'turn', (x) => (x === 'w' ? 'b' : 'w'));
const action = defCursor(db, 'action');
const boardsCursor = defCursor(db, 'boards');

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

              if (currentAction === 'place' && !pieceAtPoint) {
                boardsCursor.resetIn(
                  currentTurn,
                  aplPlacePiece(boards[currentTurn], aplIndex)
                );

                // TODO logic
                const anyNewMillsCreated = Math.random() > 0.8;
                if (anyNewMillsCreated) {
                  action.reset('remove');
                } else {
                  changeTurn();
                }
              } else if (currentAction === 'remove' && clickedOnOpponent) {
                boardsCursor.resetIn(
                  currentOpponent,
                  aplRemovePiece(boards[currentOpponent], aplIndex)
                );
                action.reset('place');
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
  [
    'div.info',
    ['p.turn', 'turn: ', turn.deref()],
    ['p.action', 'action: ', action.deref()],
  ],
]);
