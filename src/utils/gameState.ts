export interface DropState { index: number; round: number; score: number; lives: number }
export type DropAction = { type: 'restart' } | { type: 'answer'; index: number; round: number; correct: boolean };
export const initialDrop: DropState = { index: 0, round: 0, score: 0, lives: 3 };
export function dropReducer(state: DropState, action: DropAction): DropState {
  if (action.type === 'restart') return { ...initialDrop, round: state.round + 1 };
  if (state.lives === 0 || action.index !== state.index || action.round !== state.round) return state;
  return { ...state, index: state.index + 1, score: state.score + (action.correct ? 10 : 0), lives: Math.max(0, state.lives - (action.correct ? 0 : 1)) };
}

export interface MatchTile { id: string; text: string; type: 'term' | 'translation'; pairId: number; isMatched: boolean; isSelected: boolean; isWrong: boolean }
export interface MatchState { tiles: MatchTile[]; selected: string | null; resolving: boolean; matched: number; penalty: number }
export function matchReducer(state: MatchState, action: { type: 'click'; id: string } | { type: 'resolved' }): MatchState {
  if (action.type === 'resolved') return { ...state, selected: null, resolving: false, tiles: state.tiles.map(tile => tile.isWrong ? { ...tile, isWrong: false, isSelected: false } : tile) };
  if (state.resolving) return state;
  const tile = state.tiles.find(item => item.id === action.id);
  if (!tile || tile.isMatched || tile.isSelected) return state;
  if (state.selected === null) return { ...state, selected: tile.id, tiles: state.tiles.map(item => item.id === tile.id ? { ...item, isSelected: true } : item) };
  const first = state.tiles.find(item => item.id === state.selected)!;
  const correct = tile.pairId === first.pairId && tile.type !== first.type;
  return { ...state, selected: null, resolving: !correct, matched: state.matched + (correct ? 1 : 0), penalty: state.penalty + (correct ? 0 : 1), tiles: state.tiles.map(item => item.id === first.id || item.id === tile.id ? { ...item, isSelected: true, isMatched: correct, isWrong: !correct } : item) };
}
