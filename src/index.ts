import { $compile, $klist } from '@thi.ng/rdom';
import { indexed } from '@thi.ng/transducers';
import { reactive } from '@thi.ng/rstream';
import { interpret } from 'xstate';
import { Turn, merelsMachine } from './merelsMachine';

import { boardsToGridArray } from './aplGameFunctions';
import { gridIndexToAplIndex } from './utility';
// import { boardJustPriorToMovingPhase } from './testContexts';

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
    const aplIndex: number = gridIndexToAplIndex[i];
    const pieceAtPoint: Turn | '' = x === 1 ? 'w' : x === 2 ? 'b' : '';

    return typeof aplIndex !== 'undefined'
      ? [
          'span.point',
          {
            'data-lines': `line-${aplIndex}`,
            onclick: () => {
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
      'div',
      {
        class: userAction.map((userAction) => `controls ${userAction}`),
      },
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
            actor.send({
              type: 'restart.click',
            });
          },
        },
        'restart',
      ],
      ['p.action', {}, userAction],
    ],
    ['p.feedback', {}, userFeedback],
  ],
]).mount(document.body);
