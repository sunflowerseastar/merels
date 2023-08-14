import libraryApl from '../lib/apl/apl';
import { fmt } from '../lib/aplLibraryHelpers';
import { Board } from './utility';
import { Boards } from './merelsMachine';

export const aplToJs = (aplResult: string) =>
  fmt(aplResult)[0]
    .split(' ')
    .filter((x: string) => x)
    .map((x: string) => parseInt(x));

const apl = (input: string) => aplToJs(libraryApl(input));

const boardsToGridInput = ({ b, w }: { b: Board; w: Board }) => `
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

export const boardsToGridArray = (boards: Boards) => apl(boardsToGridInput(boards));

export const aplPlacePiece = (board: Board, aplIndex: number) =>
  apl(`b ← ${board} \n b[${aplIndex}] ← 1`);

export const aplPlaceAndRemovePiece = (board: Board, aplPlaceIndex: number, aplRemoveIndex: number) =>
  apl(`b ← ${board} \n b[${aplPlaceIndex}] ← 1 \n b[${aplRemoveIndex}] ← 0`);

export const aplRemovePiece = (board: Board, aplIndex: number) =>
  apl(`b ← ${board} \n b[${aplIndex}] ← 0`);

export const getNumberOfMills = (board: Board) =>
  apl(`
squares ← ⊂[1 2] 3 3 3⍴${board}

intralines ← {(⍵[0;])(⍵[;0])(⍵[;2])(⍵[2;])}
numintramills ← +/ ∧/ ¨ ⊃,/ intralines ¨ squares

interlines ← {(⍵[0;1])(⍵[1;0])(⍵[1;2])(⍵[2;1])}
numintermills ← +/ ⊃ ∧/ interlines ¨ squares

nummills ← numintramills + numintermills
`)[0];

export const isIndexInMill = (board: Board, possibleMills: number[]) =>
  apl(`
squares ← ⊂[1 2] 3 3 3⍴${board}
flatten ← {⊃,/⍵}

intralines ← {(⍵[0;])(⍵[;0])(⍵[;2])(⍵[2;])}
intramills ← ∧/ ¨ flatten intralines ¨ squares

interlines ← {(⍵[0;1])(⍵[1;0])(⍵[1;2])(⍵[2;1])}
intermills ← ⊃ ∧/ interlines ¨ squares

allmills ← flatten intramills intermills

∨/ {⍵[${possibleMills}]} allmills
`)[0];

export const getNumberOfPieces = (board: Board) => apl(`+/${board}`)[0];

// TODO maybe change w/b to current/opponent?
export const openPointsAdjacentToPiece = (w: Board, b: Board, ptc: number[]) =>
  apl(`
w ← ${w}
b ← ${b}

pointstocheck ← ${ptc}
whiteandblackatpoint ← {w[⍵] b[⍵]}
p3 ← whiteandblackatpoint ¨ pointstocheck
p4 ← ~∨/ ¨ p3
p4 / pointstocheck
`);
