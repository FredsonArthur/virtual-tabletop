/**
 * @fileoverview Definições de Tipos e Estruturas de Dados do VTT
 */

// Posição espacial no grid
export const createPosition = (x = 0, y = 0) => ({ x, y });

// Estrutura de um Token (Criatura, Personagem ou Objeto)
export const createToken = ({
  id,
  name,
  imageUrl = '',
  x = 0,
  y = 0,
  size = 1,
  hp = 10,
  maxHp = 10,
  visible = true,
  ownerId = 'gm'
}) => ({
  id,
  name,
  imageUrl,
  position: createPosition(x, y),
  size, // Em células do grid (ex: 1x1, 2x2)
  stats: { hp, maxHp },
  visible,
  ownerId, // ID do jogador dono ou 'gm'
});

// Estrutura do Mapa / Cena
export const createMapState = ({
  id,
  name,
  backgroundUrl = '',
  gridSize = 50,
  width = 2000,
  height = 2000
}) => ({
  id,
  name,
  backgroundUrl,
  gridSize,
  dimensions: { width, height },
});

// Estado Global da Sessão de Jogo
export const createInitialGameState = () => ({
  currentMapId: 'map-1',
  maps: {},
  tokens: {},
  turnOrder: [],
  activeTurnIndex: 0,
});