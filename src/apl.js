import libraryApl from 'apl';
import { fmt } from './aplLibrary';

export const aplToJs = (aplResult) => {
  return fmt(aplResult)[0]
    .split(' ')
    .map((x) => parseInt(x) || 0);
};

const apl = (input) => aplToJs(libraryApl(input));

const boardsToGridInput = ({ b, w }) => `
pb1←1 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 1
pb2←0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0
pb3←0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 1 1 1 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
s1←{9↑⍵}
s2←{9↑9↓⍵}
s3←{18↓⍵}

w←${w}
ws1←pb1 \\ (s1 w)
ws2←pb2 \\ (s2 w)
ws3←pb3 \\ (s3 w)

combinedwhite ← ws1 ∨ ws2 ∨ ws3

b←${b}
bs1←pb1 \\ (s1 b)
bs2←pb2 \\ (s2 b)
bs3←pb3 \\ (s3 b)

combinedblack ← bs1 ∨ bs2 ∨ bs3
combinedblack ← 2× ¨ combinedblack

finalboard ← combinedwhite ∨ combinedblack
`;

export const boardsToGridArray = (boards) => apl(boardsToGridInput(boards));

export const aplPlacePiece = (board, aplIndex) =>
  apl(`b ← ${board} \n b[${aplIndex}] ← 1`);

export const aplRemovePiece = (board, aplIndex) =>
  apl(`b ← ${board} \n b[${aplIndex}] ← 0`);

export const getNumberOfMills = (board) =>
  apl(`
squares ← ⊂[1 2] 3 3 3⍴${board}

intralines ← {(⍵[0;])(⍵[;0])(⍵[;2])(⍵[2;])}
numintramills ← +/ ∧/ ¨ ⊃,/ intralines ¨ squares

interlines ← {(⍵[0;1])(⍵[1;0])(⍵[1;2])(⍵[2;1])}
numintermills ← +/ ⊃ ∧/ interlines ¨ squares

nummills ← numintramills + numintermills
`)[0];

export const getNumberOfPieces = (board) => apl(`+/${board}`)[0];

export const openPointsAdjacentToPiece = (board, boardOpponent, aplIndex) => {
  console.log(
    'openPointsAdjacentToPiece(): board, boardOpponent, aplIndex',
    board,
    boardOpponent,
    aplIndex
  );
  // doesn't work
  // TODO make APL return possible moves
//   const wipentry = `
// a ← ${board}[${aplIndex}]
// b ← ${boardOpponent}[${aplIndex}]
// a, b
// `;
  const entry = `
123
`;
  const x = libraryApl(entry);
  const x2 = aplToJs(x);
  console.log('x, x2', x, x2);
};
