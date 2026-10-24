import { useSyncExternalStore } from 'react';
import { gameStore } from './gameStore.js';

export function useGameStore() {
  const state = useSyncExternalStore(
    (listener) => gameStore.subscribe(listener),
    () => gameStore.getState()
  );

  return {
    state,
    moveToken: (id, x, y) => gameStore.moveToken(id, x, y),
    updateTokenHp: (id, hp) => gameStore.updateTokenHp(id, hp),
    addToken: (tokenData) => gameStore.addToken(tokenData),
  };
}