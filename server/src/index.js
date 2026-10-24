import { createServer } from 'http';
import { Server } from 'socket.io';

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões do cliente local durante o desenvolvimento
    methods: ["GET", "POST"]
  }
});

// Estado global das salas ativas no servidor
const roomsState = {};

io.on('connection', (socket) => {
  console.log(`> Novo cliente conectado: ${socket.id}`);

  // Entrar numa sala de jogo (Sessão de VTT)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`> Cliente ${socket.id} entrou na sala: ${roomId}`);

    // Se a sala não existe, inicializa com o estado padrão (incluindo tokens de teste)
    if (!roomsState[roomId]) {
      roomsState[roomId] = {
        tokens: {
          'token-1': {
            id: 'token-1',
            name: 'Guerreiro',
            position: { x: 150, y: 150 },
            stats: { hp: 15, maxHp: 15 },
            ownerId: 'player-1',
          },
          'token-2': {
            id: 'token-2',
            name: 'Goblin Chefe',
            position: { x: 300, y: 200 },
            stats: { hp: 7, maxHp: 10 },
            ownerId: 'gm',
          }
        },
        currentTurn: null
      };
    }

    // Envia o estado atual da sala para o jogador que acabou de entrar
    socket.emit('sync_state', roomsState[roomId]);
  });

  // Evento de movimentação de Token disparado por um cliente
  socket.on('move_token', ({ roomId, tokenId, position }) => {
    if (roomsState[roomId] && roomsState[roomId].tokens[tokenId]) {
      roomsState[roomId].tokens[tokenId].position = position;
      
      // Reenvia a movimentação para todos os outros jogadores na mesma sala
      socket.to(roomId).emit('token_moved', { tokenId, position });
    }
  });

  // Desconexão do cliente
  socket.on('disconnect', () => {
    console.log(`> Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor VTT rodando na porta ${PORT}`);
});