import { createInitialGameState, createToken } from '../../../shared/types/index.js';

class GameStore {
  constructor() {
    this.state = createInitialGameState();
    this.listeners = new Set();

    // Adiciona alguns dados iniciais de teste para o Modo Simulação
    this.state.maps['map-1'] = {
      id: 'map-1',
      name: 'Taverna Abandonada',
      gridSize: 50,
    };

    this.state.tokens['token-1'] = createToken({
      id: 'token-1',
      name: 'Guerreiro',
      x: 150,
      y: 150,
      hp: 15,
      maxHp: 15,
      ownerId: 'player-1',
    });

    this.state.tokens['token-2'] = createToken({
      id: 'token-2',
      name: 'Goblin Chefe',
      x: 300,
      y: 200,
      hp: 7,
      maxHp: 10,
      ownerId: 'gm',
    });
  }

  // Retorna o estado atual
  getState() {
    return this.state;
  }

  // Inscreve componentes para escutar mudanças no estado
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notifica todos os ouvintes que o estado mudou
  _notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // --- AÇÕES DE MODIFICAÇÃO DE ESTADO ---

  moveToken(tokenId, x, y) {
    if (this.state.tokens[tokenId]) {
      this.state.tokens[tokenId].position = { x, y };
      this._notify();
    }
  }

  updateTokenHp(tokenId, newHp) {
    if (this.state.tokens[tokenId]) {
      this.state.tokens[tokenId].stats.hp = Math.max(0, newHp);
      this._notify();
    }
  }

  addToken(tokenData) {
    const newToken = createToken(tokenData);
    this.state.tokens[newToken.id] = newToken;
    this._notify();
  }
}

// Exporta uma única instância global (Singleton) para o cliente
export const gameStore = new GameStore();