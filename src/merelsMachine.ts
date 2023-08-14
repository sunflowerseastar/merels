import { meldDeepObj } from '@thi.ng/associative';
import { assign, createMachine } from 'xstate';
import {
  aplPlacePiece,
  aplRemovePiece,
  // boardsToGridArray,
  getNumberOfMills,
  getNumberOfPieces,
  isIndexInMill,
  openPointsAdjacentToPiece,
} from './aplGameFunctions';
import {
  aplIndexToMillIndex,
  areNonMillOpponentPiecesAvailable,
  // areTherePossibleAdjacentMoves,
  connectedPointsGraph,
  // gridIndexToAplIndex,
} from './utility';

type Turn = 'w' | 'b';
type Actions = 'place' | 'lift' | 'remove' | 'end';
export interface Boards {
  w: number[];
  b: number[];
}
interface WBBooleans {
  w: boolean;
  b: boolean;
}
type Context = {
  boards: Boards;
  isFlying: WBBooleans;
  liftedAplIndex: number;
  turn: Turn;
  // userAction is called 'action' in the original state
  userAction: Actions;
  userFeedback: string;
};

const defaultContext: Context = {
  boards: {
    w: Array.from(Array(27), (_) => 0),
    b: Array.from(Array(27), (_) => 0),
  },
  isFlying: { w: false, b: false },
  liftedAplIndex: -1,
  possiblePlaces: [],
  turn: 'w',
  userAction: 'place',
  userFeedback: '',
};

const opponent = (x: Turn) => (x === 'w' ? 'b' : 'w');

export const merelsMachine = createMachine(
  {
    types: {} as {
      context: {
        boards: Boards;
        isFlying: WBBooleans;
        liftedAplIndex: number;
        possiblePlaces: number[];
        turn: Turn;
        // userAction is called 'action' in the original state
        userAction: Actions;
        userFeedback: string;
      };
    },
    context: ({ input }) => meldDeepObj(defaultContext, input),
    id: 'merels_statechart',
    initial: 'Placing',
    states: {
      Placing: {
        description:
          'Placing the initial 18 places, alternate turns, along with mill-forming removals',
        initial: 'Placing',
        states: {
          Placing: {
            entry: assign({
              userAction: () => 'place',
            }),
            on: {
              'point.click': [
                {
                  guard: 'point is occupied',
                  actions: assign({
                    userFeedback: () => 'invalid',
                  }),
                  reenter: true,
                },
                {
                  guard: 'form mill',
                  actions: { type: 'place' },
                  target: 'Removing',
                  reenter: false,
                },
                {
                  guard: {
                    type: 'all pieces have not yet been placed',
                    // the guard needs a +1 for the impending 'place' action
                    params: { isUserPlacing: true },
                  },
                  actions: [{ type: 'place' }, { type: 'swap' }],
                  target: 'Placing',
                  reenter: true,
                },
                {
                  target: '#merels_statechart.Moving.Lifting',
                  actions: [{ type: 'place' }, { type: 'swap' }],
                  reenter: false,
                },
              ],
            },
          },
          Removing: {
            entry: assign({
              userAction: () => 'remove',
            }),
            on: {
              'point.click': [
                {
                  guard: 'invalid removal (empty point || occupied by self)',
                  actions: assign({
                    userFeedback: () => 'invalid',
                  }),
                  reenter: true,
                },
                {
                  guard:
                    'invalid removal (occupied by opponent locked in mill && others are available)',
                  actions: assign({
                    userFeedback: () => 'locked in mill',
                  }),
                  reenter: true,
                },
                {
                  guard: 'all pieces have not yet been placed',
                  actions: [{ type: 'remove' }, { type: 'swap' }],
                  target: 'Placing',
                  reenter: false,
                },
                {
                  actions: [{ type: 'remove' }, { type: 'swap' }],
                  target: '#merels_statechart.Moving.Lifting',
                  reenter: false,
                },
              ],
            },
          },
        },
      },
      Moving: {
        description: 'This is a _state description_.',
        initial: 'Lifting',
        states: {
          Lifting: {
            entry: assign({
              userAction: () => 'lift',
            }),
            on: {
              'point.click': [
                {
                  guard:
                    'invalid lift (empty || occupied by opponent || (not flying && piece has no adjacent moves possible))',
                  actions: assign({
                    userFeedback: () => 'invalid',
                  }),
                  reenter: true,
                },
                {
                  actions: ['lift'],
                  target: 'Placing',
                  reenter: false,
                },
              ],
            },
          },
          Placing: {
            entry: assign({
              userAction: () => 'place',
            }),
            on: {
              'point.click': [
                {
                  // TODO what about if there are no adjacent moves available? Will game be over already or will this state be stuck?
                  // ...correction... does it make more sense for a piece in this scenario to not have been lift-able in the first place..?
                  guard:
                    'invalid place (occupied || (not flying && not adjacent))',
                  target: 'Lifting',
                  // actions: ['unlift'],
                  reenter: false,
                },
                {
                  // TODO think about players locked in a mill..?
                  guard: 'no mill is formed',
                  actions: [{ type: 'move' }, { type: 'swap' }],
                  target: 'Lifting',
                  reenter: false,
                },
                {
                  // [implicit] mill is formed
                  actions: [{ type: 'move' }],
                  target: 'Removing',
                  reenter: false,
                },
              ],
            },
          },
          Removing: {
            on: {
              'point.click': [
                {
                  target: 'Removing',
                  guard:
                    'invalid removal (empty space || occupied by self || occupied by opponent locked in mill)',
                  reenter: false,
                },
                {
                  guard:
                    'opponent has more than 3 pieces remaining after removal',
                  actions: [{ type: 'remove' }, { type: 'swap' }],
                  target: 'Lifting',
                  reenter: false,
                },
                {
                  target: 'Lifting',
                  guard: 'opponent has 3 pieces remaining after removal',
                  actions: [
                    { type: 'remove' },
                    { type: 'set opponent to flying' },
                    { type: 'swap' },
                  ],
                  reenter: false,
                },
                {
                  target: 'Active player wins, Opponent loses',
                  reenter: false,
                },
              ],
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
      remove: assign({
        boards: ({ context: { boards, turn }, event: { aplIndex } }) => ({
          ...boards,
          [opponent(turn)]: aplRemovePiece(boards[opponent(turn)], aplIndex),
        }),
      }),
      place: assign({
        boards: ({ context: { boards, turn }, event: { aplIndex } }) => ({
          ...boards,
          [turn]: aplPlacePiece(boards[turn], aplIndex),
        }),
        userFeedback: () => '',
      }),
      move: assign({
        boards: ({
          context: { boards, liftedAplIndex, turn },
          event: { aplIndex },
        }) => {
          console.log('move');
          console.log(
            'aplRemovePiece(boards[turn], liftedAplIndex)',
            aplRemovePiece(boards[turn], liftedAplIndex)
          );
          return {
            ...boards,
            [turn]: aplPlacePiece(
              aplRemovePiece(boards[turn], liftedAplIndex),
              aplIndex
            ),
          };
        },
        userFeedback: () => '',
      }),
      lift: assign({
        liftedAplIndex: ({ event: { aplIndex } }) => aplIndex,
        possiblePlaces: ({
          context: { boards, turn },
          event: { aplIndex },
        }) => {
          // TODO is this wrong somehow..?
          const poss = openPointsAdjacentToPiece(
            boards[turn],
            boards[opponent(turn)],
            connectedPointsGraph[aplIndex]
          );
          console.log('poss', poss);
          return poss;
        },
        userFeedback: () => '',
      }),
      unlift: ({ context, event }) => {
        // TODO figure out what to do here - is this on the right track or no?
        console.log('unlift', context, event);
      },
      swap: assign({
        turn: ({ context: { turn } }) => opponent(turn),
        userFeedback: () => '',
      }),
    },
    actors: {},
    guards: {
      'point is occupied': ({ event: { pieceAtPoint } }) => !!pieceAtPoint,
      'form mill': ({ context: { boards, turn }, event: { aplIndex } }) => {
        const previousNumberOfMills = getNumberOfMills(boards[turn]);
        const boardAfterPlace = aplPlacePiece(boards[turn], aplIndex);
        const newNumberOfMills = getNumberOfMills(boardAfterPlace);
        const isMillFormed = newNumberOfMills > previousNumberOfMills;
        return isMillFormed;
      },
      'invalid removal (empty point || occupied by self)': ({
        context: { turn },
        event: { pieceAtPoint },
      }) => {
        const playerClickedOnEmptyPoint = pieceAtPoint === '';
        const playerClickedOnTheirOwnPiece = pieceAtPoint === turn;

        return playerClickedOnEmptyPoint || playerClickedOnTheirOwnPiece;
      },
      'invalid removal (occupied by opponent locked in mill && others are available)':
        ({ context: { boards, turn }, event: { aplIndex } }) => {
          const opponentBoard = boards[opponent(turn)];
          const playerClickedOnOpponentThatIsLockedInMill = !!isIndexInMill(
            opponentBoard,
            aplIndexToMillIndex[aplIndex]
          );
          const areOtherRemovablePiecesAvailable =
            areNonMillOpponentPiecesAvailable(opponentBoard);

          return (
            playerClickedOnOpponentThatIsLockedInMill &&
            areOtherRemovablePiecesAvailable
          );
        },
      'all pieces have not yet been placed': ({
        context: { boards, turn },
        guard: {
          params: { isUserPlacing = false },
        },
      }) =>
        (isUserPlacing ? 1 : 0) +
          getNumberOfPieces(boards[turn]) +
          getNumberOfPieces(boards[opponent(turn)]) <
        18,
      'invalid lift (empty || occupied by opponent || (not flying && piece has no adjacent moves possible))':
        ({ context: { boards, turn }, event: { aplIndex, pieceAtPoint } }) => {
          // equivalent to empty || occupied by opponent
          const didNotClickOnSelf = pieceAtPoint !== turn;

          // TODO put 'isAdjacent' (if !isFlying) logic here? Or let the user pick a "bad" one and then cancel?
          const areAdjacentMovesAvailable = !!openPointsAdjacentToPiece(
            boards[turn],
            boards[opponent(turn)],
            connectedPointsGraph[aplIndex]
          ).length;
          const isFlying = getNumberOfPieces(boards[turn]) === 3;
          console.log('areAdjacentMovesAvailable', areAdjacentMovesAvailable);
          console.log('isFlying', isFlying);

          const x =
            didNotClickOnSelf || (!areAdjacentMovesAvailable && !isFlying);
          console.log('x', x);

          // verify this is right and clean it up
          return x;

          // const openPoints = openPointsAdjacentToPiece(
          //   boards[currentTurn],
          //   boards[opponent(currentTurn)],
          //   connectedPointsGraph[aplIndex]
          // );
          //
          // if (isFlying.deref()[currentTurn]) {
          //   // flying
          //   action.reset('place');
          //   liftedAplIndex.reset(aplIndex);
          // } else if (!!openPoints.length) {
          //   action.reset('place');
          //   possiblePlaces.reset(openPoints);
          //   liftedAplIndex.reset(aplIndex);
          // } else {
          //   feedback.reset('immovable');
          // }
        },
      'invalid place (occupied || (not flying && not adjacent))': ({
        context: { boards, possiblePlaces, turn },
        event: { aplIndex, pieceAtPoint },
      }) => {
        const isOccupied = pieceAtPoint !== '';
        console.log('isOccupied', isOccupied);

        const isFlying = getNumberOfPieces(boards[turn]) === 3;
        console.log('isFlying', isFlying);

        console.log('possiblePlaces', possiblePlaces);
        const isAdjacent = possiblePlaces.includes(aplIndex);
        console.log('isAdjacent', isAdjacent);

        const z = isOccupied || (!isAdjacent && !isFlying);
        console.log('z', z);

        // verfy this is right and clean it up (seems like this isn't right..?)
        return z;
      },
      'mill is formed': createMachine({}),
      'opponent has more than 3 pieces remaining after removal': createMachine(
        {}
      ),
      'opponent has 3 pieces remaining after removal': createMachine({}),
    },
    delays: {},
  }
);
