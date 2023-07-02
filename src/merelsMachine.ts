import { assign, createMachine } from 'xstate';
import {
  aplPlacePiece,
  // aplRemovePiece,
  // boardsToGridArray,
  getNumberOfMills,
  // getNumberOfPieces,
  // isIndexInMill,
  // openPointsAdjacentToPiece,
} from './aplGameFunctions';

type Turn = 'w' | 'b';
export interface Boards {
  w: number[];
  b: number[];
}

const opponent = (x: Turn) => (x === 'w' ? 'b' : 'w');

export const merelsMachine = createMachine(
  {
    types: {} as {
      context: {
        boards: Boards;
        turn: Turn;
      };
    },
    context: {
      boards: {
        w: Array.from(Array(27), (_) => 0),
        b: Array.from(Array(27), (_) => 0),
      },
      turn: 'w',
    },
    id: 'merels 1',
    initial: 'Placement',
    states: {
      Placement: {
        description: 'This is a _state description_.',
        initial: 'Placing',
        states: {
          Placing: {
            on: {
              'point.click': [
                {
                  guard: 'point is occupied',
                  reenter: true,
                },
                {
                  target: 'Lifting',
                  guard: 'form mill',
                  actions: {
                    type: 'place',
                    params: {},
                  },
                  reenter: false,
                },
                {
                  actions: [
                    {
                      type: 'place',
                      params: {},
                    },
                    {
                      type: 'swap',
                      params: {},
                    },
                  ],
                  reenter: true,
                },
              ],
            },
          },
          Lifting: {
            on: {
              'valid lift (occupied by opponent, not locked in mill)': [
                {
                  target: '[STATE] swap players',
                  guard: 'all pieces have not yet been placed',
                  reenter: false,
                },
                {
                  target: '#merels 1.Moving.[STATE] swap players',
                  reenter: false,
                },
              ],
              'invalid lift (empty space || occupied by self || occupied by opponent locked in mill)':
                {
                  reenter: true,
                },
            },
          },
          '[STATE] swap players': {
            always: {
              target: 'Placing',
              reenter: false,
            },
          },
        },
      },
      Moving: {
        description: 'This is a _state description_.',
        initial: '[STATE] swap players',
        states: {
          '[STATE] swap players': {
            always: {
              target: 'Selecting',
              reenter: false,
            },
          },
          Selecting: {
            on: {
              'invalid select (empty || occupied by opponent || (not flying && piece has no adjacent moves possible))':
                {
                  target: 'Selecting',
                  reenter: false,
                },
              'valid select': {
                target: 'Placing',
                reenter: false,
              },
            },
          },
          Placing: {
            on: {
              'invalid place (occupied || (not flying && not adjacent))': {
                target: 'Selecting',
                reenter: false,
              },
              'valid place': [
                {
                  target: 'Lifting',
                  guard: 'mill is formed',
                  reenter: false,
                },
                {
                  target: '[STATE] swap players',
                  reenter: false,
                },
              ],
            },
          },
          Lifting: {
            on: {
              'valid lift': [
                {
                  target: '[STATE] swap players',
                  guard: 'opponent has more than 3 pieces remaining after lift',
                  reenter: false,
                },
                {
                  target: '[STATE] opponent is now flying',
                  guard: 'opponent has 3 pieces remaining after lift',
                  reenter: false,
                },
                {
                  target: 'Active player wins, Opponent loses',
                  reenter: false,
                },
              ],
              'invalid lift (empty space || occupied by self || occupied by opponent locked in mill)':
                {
                  target: 'Lifting',
                  reenter: false,
                },
            },
          },
          '[STATE] opponent is now flying': {
            always: {
              target: '[STATE] swap players',
              reenter: false,
            },
          },
          'Active player wins, Opponent loses': {
            type: 'final',
          },
        },
      },
    },
  },
  {
    actions: {
      test: ({ action }) => {
        console.log(action.params);
      },
      place: assign({
        boards: ({ context: { boards, turn }, event: { aplIndex } }) => ({
          ...boards,
          [turn]: aplPlacePiece(boards[turn], aplIndex),
        }),
      }),
      swap: assign({
        turn: ({ context: { turn } }) => opponent(turn),
      }),
    },
    actors: {},
    guards: {
      'point is occupied': ({ event: { pieceAtPoint } }) => !!pieceAtPoint,
      'form mill': ({ context: { boards, turn }, event: { aplIndex } }) => {
        console.log('guard: form mill', boards, turn, aplIndex);

        // TODO determine if this forms a mill. If so, return true. Otherwise,
        // return false and then let the next event else happen

        const previousNumberOfMills = getNumberOfMills(boards[turn]);
        console.log('previousNumberOfMills', previousNumberOfMills);

        const boardAfterPlace = aplPlacePiece(boards[turn], aplIndex);
        console.log('boardAfterPlace', boardAfterPlace);

        const newNumberOfMills = getNumberOfMills(boardAfterPlace);
        console.log('newNumberOfMills', newNumberOfMills);

        const isMillFormed = newNumberOfMills > previousNumberOfMills;
        console.log('isMillFormed', isMillFormed);

        return isMillFormed;
      },
      'mill is formed': createMachine({}),
      'all pieces have not yet been placed': createMachine({}),
      'opponent has more than 3 pieces remaining after lift': createMachine({}),
      'opponent has 3 pieces remaining after lift': createMachine({}),
    },
    delays: {},
  }
);
