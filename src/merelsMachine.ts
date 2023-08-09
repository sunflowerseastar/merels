import { meldDeepObj } from '@thi.ng/associative';
import { EventObject, assign, createMachine } from 'xstate';
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
interface WBNums {
  w: number;
  b: number;
}
interface WBBooleans {
  w: boolean;
  b: boolean;
}
type Context = {
  boards: Boards;
  isFlying: WBBooleans;
  liftedAplIndex: number;
  numberOfPiecesPlaced: WBNums;
  possiblePlaces: number[];
  turn: Turn;
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
  numberOfPiecesPlaced: {
    w: 0,
    b: 0,
  },
  possiblePlaces: [],
  turn: 'w',
  userAction: 'place',
  userFeedback: '',
};

const opponent = (x: Turn) => (x === 'w' ? 'b' : 'w');

interface PointClickEvent extends EventObject {
  type: 'point.click';
  aplIndex: number;
  pieceAtPoint: Turn | '';
}

export const merelsMachine = createMachine<Context, PointClickEvent>(
  // export const merelsMachine = createMachine(
  {
    types: {} as { context: Context },
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
              userAction: 'place',
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
                  guard: 'mill is formed',
                  actions: { type: 'place' },
                  target: 'Removing',
                  reenter: false,
                },
                {
                  guard: {
                    type: 'all pieces have not yet been placed',
                    params: { isPlacing: true },
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
              userAction: 'remove',
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
            // TODO if the current player has no legal moves, they lose (do I put a guard with an action for the Lifting state?)
            entry: assign({
              userAction: 'lift',
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
                  target: 'Moving',
                  reenter: false,
                },
              ],
            },
          },
          Moving: {
            entry: assign({
              userAction: 'place',
            }),
            on: {
              'point.click': [
                {
                  // TODO what about if there are no adjacent moves available? Will game be over already or will this state be stuck?
                  // ...correction... does it make more sense for a piece in this scenario to not have been lift-able in the first place..?
                  guard:
                    'invalid move (occupied || (not flying && not adjacent))',
                  actions: assign({
                    userFeedback: () => 'illegal',
                  }),
                  target: 'Lifting',
                  reenter: false,
                },
                {
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
            entry: assign({
              userAction: 'remove',
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
                    assign({
                      userFeedback: () => 'flying',
                    }),
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
            entry: assign({
              userAction: 'end',
            }),
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
        numberOfPiecesPlaced: ({ context: { numberOfPiecesPlaced, turn } }) => {
          console.log('numberOfPiecesPlaced', numberOfPiecesPlaced);
          return {
            ...numberOfPiecesPlaced,
            [turn]: numberOfPiecesPlaced[turn] + 1,
          };
        },
        userFeedback: () => '',
      }),
      move: assign({
        boards: ({
          context: { boards, liftedAplIndex, turn },
          event: { aplIndex },
        }) => ({
          ...boards,
          [turn]: aplPlacePiece(
            aplRemovePiece(boards[turn], liftedAplIndex),
            aplIndex
          ),
        }),
        userFeedback: () => '',
      }),
      lift: assign({
        liftedAplIndex: ({ event: { aplIndex } }) => aplIndex,
        possiblePlaces: ({ context: { boards, turn }, event: { aplIndex } }) =>
          openPointsAdjacentToPiece(
            boards[turn],
            boards[opponent(turn)],
            connectedPointsGraph[aplIndex]
          ),
        userFeedback: () => '',
      }),
      swap: assign({
        turn: ({ context: { turn } }) => opponent(turn),
        userFeedback: () => '',
      }),
      'set opponent to flying': assign({
        isFlying: ({ context: { isFlying, turn } }) => ({
          ...isFlying,
          [opponent(turn)]: true,
        }),
      }),
    },
    actors: {},
    guards: {
      'point is occupied': ({ event: { pieceAtPoint } }) => !!pieceAtPoint,
      'mill is formed': ({
        context: { boards, turn },
        event: { aplIndex },
      }) => {
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
        context: { numberOfPiecesPlaced, turn },
        guard: {
          params: { isPlacing },
        },
      }) => {
        console.log('all pieces have not yet been placed');
        console.log('numberOfPiecesPlaced[turn]', numberOfPiecesPlaced[turn]);
        console.log(
          'numberOfPiecesPlaced[opponent(turn)]',
          numberOfPiecesPlaced[opponent(turn)]
        );
        return (
          (isPlacing ? 1 : 0) +
            numberOfPiecesPlaced[turn] +
            numberOfPiecesPlaced[opponent(turn)] <
          18
        );
      },
      'invalid lift (empty || occupied by opponent || (not flying && piece has no adjacent moves possible))':
        ({ context: { boards, turn }, event: { aplIndex, pieceAtPoint } }) => {
          const isEmptyOrOccupiedByOpponent = pieceAtPoint !== turn;
          const areAdjacentMovesAvailable = !!openPointsAdjacentToPiece(
            boards[turn],
            boards[opponent(turn)],
            connectedPointsGraph[aplIndex]
          ).length;
          const isFlying = getNumberOfPieces(boards[turn]) === 3;

          return (
            isEmptyOrOccupiedByOpponent ||
            (!areAdjacentMovesAvailable && !isFlying)
          );
        },
      'invalid move (occupied || (not flying && not adjacent))': ({
        context: { boards, possiblePlaces, turn },
        event: { aplIndex, pieceAtPoint },
      }) => {
        const isOccupied = pieceAtPoint !== '';
        const isFlying = getNumberOfPieces(boards[turn]) === 3;
        const isAdjacent = possiblePlaces.includes(aplIndex);

        return isOccupied || (!isAdjacent && !isFlying);
      },
      'no mill is formed': ({
        context: { boards, liftedAplIndex, turn },
        event: { aplIndex },
      }) => {
        console.log('no mill is formed');
        const boardAfterRemoval = aplRemovePiece(boards[turn], liftedAplIndex);
        const previousNumberOfMills = getNumberOfMills(boardAfterRemoval);

        const boardAfterMove = aplPlacePiece(boardAfterRemoval, aplIndex);
        const newNumberOfMills = getNumberOfMills(boardAfterMove);

        const noMillIsFormed = newNumberOfMills === previousNumberOfMills;
        return noMillIsFormed;
      },
      'opponent has more than 3 pieces remaining after removal': ({
        context: { boards, turn },
      }) => getNumberOfPieces(boards[opponent(turn)]) - 1 > 3,
      'opponent has 3 pieces remaining after removal': ({
        context: { boards, turn },
      }) => getNumberOfPieces(boards[opponent(turn)]) - 1 === 3,
    },
    delays: {},
  }
);
