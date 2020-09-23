import { defAtom, defCursor, defView } from '@thi.ng/atom';
import { resetIn } from '@thi.ng/paths';
import { start } from '@thi.ng/hdom';
import { capitalize } from '@thi.ng/strings';

const a = defAtom(23);

console.log('a.deref()', a.deref());

const db = defAtom({
  phase: 'phase1',
  t1: [1, 2, 3],
  wb: [0, 0, 1],
  bb: [1, 0, 0],
  board: [],
  turn: 'white',
});
const phase = defCursor(db, 'phase');

const advanceToPhase2 = () => {
  console.log('advanceToPhase2')
  phase.reset('phase2');
};
const returnToPhase1 = () => {
  console.log('returnToPhase1')
  phase.reset('phase1');
};

const placePiece = () => {
  console.log('placePiece()');
};

const t1 = defView(db, ['t1'], (x) => {
  console.log('t1', x);
  return x;
});
const t1cursor = defCursor(db, ['t1']);

const updateT1 = () => {
  console.log('updateT1()', t1);
  // a.deref();
  const add = (x, y) => x + y;
  a.swap(add, 1);
  t1cursor.reset([5, 6, 7]);
};

const uiViews = {
  phase1: () => [
    'div',
    ['h1', 'nmm'],
    // ['h2', `a, ${db.phase.deref()}!`],
    ['button', { onclick: updateT1 }, 'updateT1'],
    ['button', { onclick: advanceToPhase2 }, 'advanceToPhase2'],
  ],
  phase2: () => [
    'div',
    ['h1', 'phase2'],
    ['button', { onclick: updateT1 }, 'updateT1'],
    ['button', { onclick: returnToPhase1 }, 'returnToPhase1'],
  ],
};

const currView = defView(
  db,
  ['phase'],
  (phase) =>
    uiViews[phase] || ['div', ['h1', `No component for phase: ${phase}`]]
);

start(() => ['div', currView]);
