import { meldDeepObj } from '@thi.ng/associative';
import { EventObject, assign, createMachine } from 'xstate';
import {
  aplPlacePiece,
  aplRemovePiece,
  getNumberOfMills,
  getNumberOfPieces,
  isIndexInMill,
  openPointsAdjacentToPiece,
} from './aplGameFunctions';
import {
  aplIndexToMillIndex,
  areNonMillOpponentPiecesAvailable,
  areTherePossibleAdjacentMoves,
  connectedPointsGraph,
} from './utility';

export type Turn = 'w' | 'b';
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

export const defaultContext: Context = {
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

interface BaseEvent extends EventObject {
  type: string;
}

interface PointClickEvent extends BaseEvent {
  aplIndex: number;
  pieceAtPoint: Turn | '';
  type: 'point.click';
}

interface RestartClickEvent extends BaseEvent {
  type: 'restart.click';
}

type MyEvent = PointClickEvent | RestartClickEvent;

export const merelsMachine = createMachine(
  {
    types: {} as {
      context: Context;
      events: MyEvent;
    },
    context: ({ input }) => meldDeepObj(defaultContext, input),
    id: 'merels_statechart',
    initial: 'Placing',
    states: {
      Placing: {
        description:
          'Introductory gameplay: players alternate turns by individually placing the 18 pieces, removing an opponent piece after forming a mill.',
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
                  target: '#merels_statechart.Moving.Check Available Moves',
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
                  target: '#merels_statechart.Moving.Check Available Moves',
                  reenter: false,
                },
              ],
            },
          },
        },
      },
      Moving: {
        description:
          'Standard gameplay: players alternate turns to adjacently move a piece with formed-a-mill removals; player non-adjacently "flies" with 3 pieces remaining, and loses with 2 pieces remaining or no legal moves available.',
        initial: 'Check Available Moves',
        states: {
          'Check Available Moves': {
            always: [
              {
                target: 'Active player loses, Opponent wins',
                guard: 'not flying && no adjacent moves are available',
                actions: { type: 'end' },
                reenter: false,
              },
              { target: 'Lifting', reenter: false },
            ],
          },
          Lifting: {
            entry: assign({
              userAction: 'lift',
            }),
            on: {
              'point.click': [
                {
                  guard: 'invalid lift (empty || occupied by opponent)',
                  actions: assign({
                    userFeedback: () => 'invalid',
                  }),
                  reenter: true,
                },
                {
                  guard:
                    'invalid lift (not flying && piece has no adjacent moves possible)',
                  actions: assign({
                    userFeedback: () => 'immovable',
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
                  target: 'Check Available Moves',
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
                  target: 'Check Available Moves',
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
                  target: 'Active player loses, Opponent wins',
                  actions: [{ type: 'remove' }, { type: 'swap' }],
                  reenter: false,
                },
              ],
            },
          },
          'Active player loses, Opponent wins': {
            type: 'final',
            entry: assign({
              userAction: 'end',
              userFeedback: ({ context: { turn } }) =>
                `${turn === 'w' ? 'black' : 'white'} wins`,
            }),
            on: {
              'restart.click': {
                actions: assign(() => defaultContext),
                target: '#merels_statechart',
              },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      remove: assign({
        boards: ({ context: { boards, turn }, event }) => {
          const { aplIndex } = event as PointClickEvent;
          return {
            ...boards,
            [opponent(turn)]: aplRemovePiece(boards[opponent(turn)], aplIndex),
          };
        },
      }),
      place: assign({
        boards: ({ context: { boards, turn }, event }) => {
          const { aplIndex } = event as PointClickEvent;
          return {
            ...boards,
            [turn]: aplPlacePiece(boards[turn], aplIndex),
          };
        },
        numberOfPiecesPlaced: ({
          context: { numberOfPiecesPlaced, turn },
        }) => ({
          ...numberOfPiecesPlaced,
          [turn]: numberOfPiecesPlaced[turn] + 1,
        }),
        userFeedback: () => '',
      }),
      move: assign({
        boards: ({ context: { boards, liftedAplIndex, turn }, event }) => {
          const { aplIndex } = event as PointClickEvent;
          return {
            ...boards,
            [turn]: aplPlacePiece(
              aplRemovePiece(boards[turn], liftedAplIndex),
              aplIndex,
            ),
          };
        },
        userFeedback: () => '',
      }),
      lift: assign({
        liftedAplIndex: ({ event }) => {
          const { aplIndex } = event as PointClickEvent;
          return aplIndex;
        },
        possiblePlaces: ({ context: { boards, turn }, event }) => {
          const { aplIndex } = event as PointClickEvent;
          return openPointsAdjacentToPiece(
            boards[turn],
            boards[opponent(turn)],
            connectedPointsGraph[aplIndex],
          );
        },
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
    guards: {
      'point is occupied': ({ event }) => {
        const { pieceAtPoint } = event as PointClickEvent;
        return !!pieceAtPoint;
      },
      'mill is formed': ({ context: { boards, turn }, event }) => {
        const { aplIndex } = event as PointClickEvent;
        const previousNumberOfMills = getNumberOfMills(boards[turn]);
        const boardAfterPlace = aplPlacePiece(boards[turn], aplIndex);
        const newNumberOfMills = getNumberOfMills(boardAfterPlace);
        const isMillFormed = newNumberOfMills > previousNumberOfMills;
        return isMillFormed;
      },
      'invalid removal (empty point || occupied by self)': ({
        context: { turn },
        event,
      }) => {
        const { pieceAtPoint } = event as PointClickEvent;
        return pieceAtPoint !== opponent(turn);
      },
      'invalid removal (occupied by opponent locked in mill && others are available)':
        ({ context: { boards, turn }, event }) => {
          const { aplIndex } = event as PointClickEvent;
          const opponentBoard = boards[opponent(turn)];
          const playerClickedOnOpponentThatIsLockedInMill = !!isIndexInMill(
            opponentBoard,
            aplIndexToMillIndex[aplIndex],
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
      }) =>
        (isPlacing ? 1 : 0) +
          numberOfPiecesPlaced[turn] +
          numberOfPiecesPlaced[opponent(turn)] <
        18,
      'invalid lift (empty || occupied by opponent)': ({
        context: { turn },
        event,
      }) => {
        const { pieceAtPoint } = event as PointClickEvent;
        return pieceAtPoint !== turn;
      },
      'invalid lift (not flying && piece has no adjacent moves possible)': ({
        context: { boards, turn },
        event,
      }) => {
        const { aplIndex } = event as PointClickEvent;
        return (
          getNumberOfPieces(boards[turn]) > 3 &&
          !openPointsAdjacentToPiece(
            boards[turn],
            boards[opponent(turn)],
            connectedPointsGraph[aplIndex],
          ).length
        );
      },
      'invalid move (occupied || (not flying && not adjacent))': ({
        context: { boards, possiblePlaces, turn },
        event,
      }) => {
        const { aplIndex, pieceAtPoint } = event as PointClickEvent;
        const isOccupied = pieceAtPoint !== '';
        const isFlying = getNumberOfPieces(boards[turn]) === 3;
        const isAdjacent = possiblePlaces.includes(aplIndex);

        return isOccupied || (!isAdjacent && !isFlying);
      },
      'no mill is formed': ({
        context: { boards, liftedAplIndex, turn },
        event,
      }) => {
        const { aplIndex } = event as PointClickEvent;
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
      'not flying && no adjacent moves are available': ({
        context: { boards, turn },
      }) => {
        const isFlying = getNumberOfPieces(boards[turn]) === 3;
        const upcomingPlayerHasAdjacentMoves = areTherePossibleAdjacentMoves(
          boards[turn],
          boards[opponent(turn)],
        );
        return !isFlying && !upcomingPlayerHasAdjacentMoves;
      },
    },
  },
);
