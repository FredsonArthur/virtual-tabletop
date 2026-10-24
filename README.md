# 🎲 Virtual Tabletop (VTT)

Uma plataforma modular e reativa de Virtual Tabletop (VTT) desenvolvida para sessões de RPG de mesa, com suporte a simulação local e sincronização em tempo real via WebSockets.

---

## 🚀 Funcionalidades Atuais

- **Canvas Gráfico de Alta Performance:** Renderização acelerada por GPU utilizando PixiJS (v8).
- **Grid Interativo & Navegação:** Sistema de Pan (arrastar o mapa) e Zoom dinâmico no cursor do mouse.
- **Gerenciamento de Tokens:**
  - Renderização de tokens de personagens e inimigos com cores distintas.
  - Exibição de nomes, rótulos e barras de vida (HP) proporcionais.
  - Drag & Drop com alinhamento automático no grid (*Grid Snapping* de 50px).
- **Gerenciamento de Estado Centralizado:** Arquitetura *Singleton* com `GameStore` e padrão Observer para reatividade fluida.
- **Sincronização em Tempo Real:** Servidor WebSocket (Socket.io) preparado para gerenciamento de salas (*rooms*) e transmissão de eventos de movimento.

---

## 🛠️ Stack Tecnológica

### **Frontend (`/client`)**
- **React 19 + Vite:** UI moderna e build ultrarrápido.
- **PixiJS v8:** Engine 2D para renderização de alta performance do canvas.
- **Socket.io Client:** Comunicação bi-direcional em tempo real com o servidor.

### **Backend (`/server`)**
- **Node.js (ES Modules):** Runtime leve e assíncrono.
- **Socket.io:** Servidor WebSocket configurado com suporte a salas e isolamento de estado.

### **Shared (`/shared`)**
- **Tipos e Construtores Padronizados:** Estruturas compartilhadas de `Token`, `MapState`, `Position` e `GameState` para garantir paridade de dados entre cliente e servidor.

---

## 📁 Estrutura do Projeto

```
virtual-tabletop/
├── client/                 # Aplicação React + PixiJS
│   ├── src/
│   │   ├── services/       # Conexão WebSocket (socket.js)
│   │   ├── state/          # Gerenciamento de estado (gameStore.js)
│   │   ├── App.jsx         # Componente principal e Canvas PixiJS
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Servidor WebSocket
│   ├── src/
│   │   └── index.js        # Lógica de salas e sincronização
│   └── package.json
│
├── shared/                 # Modelos de dados e tipos compartilhados
│   └── types/
│       └── index.js
│
└── README.md
```
🏁 Como Executar o Projeto
Pró-requisitos

    Node.js (versão 18 ou superior)

    npm ou yarn

1️⃣ Executando o Backend (Servidor)

    cd server
    npm install
    npm run dev

O servidor WebSocket iniciará na porta 3001 (ex: http://localhost:3001).
2️⃣ Executando o Frontend (Cliente)

Em outro terminal:

    cd client
    npm install
    npm run dev

Abra o navegador no endereço indicado pelo Vite (geralmente http://localhost:5173).
🎯 Próximos Passos (Roadmap)

    [ ] Sincronização em tempo real do Drag & Drop entre múltiplos navegadores via Socket.io.

    [ ] Rolador de dados interativo no painel lateral (React HUD).

    [ ] Carregamento dinâmico de mapas de fundo e fog of war (Névoa de Guerra).

    [ ] Modais para edição de ficha e criação de novos tokens.

📜 Licença

Este projeto está sob a licença ISC.