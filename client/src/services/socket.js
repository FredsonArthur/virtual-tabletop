import { io } from 'socket.io-client';

// Endereço do backend rodando localmente na porta 3001
const SOCKET_URL = 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});

/**
 * Entra numa sala de jogo específica e escuta o estado inicial.
 * @param {string} roomId - Identificador da sala
 * @param {Function} callback - Função executada ao receber o estado inicial
 */
export const joinRoom = (roomId, callback) => {
  socket.emit('join_room', roomId);

  // Remove ouvintes anteriores para evitar duplicações em reconexões
  socket.off('sync_state');

  socket.on('sync_state', (initialState) => {
    if (callback) callback(initialState);
  });
};

/**
 * Envia a nova posição de um token para o servidor sincronizar com os outros jogadores.
 */
export const moveTokenRemote = (roomId, tokenId, position) => {
  socket.emit('move_token', { roomId, tokenId, position });
};