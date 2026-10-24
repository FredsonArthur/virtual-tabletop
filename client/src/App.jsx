import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { socket, joinRoom } from './services/socket';
import { gameStore } from './state/gameStore';
import './App.css';

function App() {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // --- ESCUTA DE CONEXÃO WEBSOCKET ---
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log('🟢 Conectado ao servidor WebSocket com ID:', socket.id);
      joinRoom('sala-principal', (state) => {
        console.log('📦 Estado inicial da sala recebido:', state);
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('🔴 Desconectado do servidor WebSocket');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // --- INICIALIZAÇÃO DO PIXIJS E RENDERIZAÇÃO DA MESA ---
  useEffect(() => {
    let isCancelled = false;
    let canvasElement = null;
    let handleResize = null;
    let onPointerMove = null;
    let onPointerUp = null;

    const initPixi = async () => {
      if (!pixiContainerRef.current) return;

      pixiContainerRef.current.innerHTML = '';

      const app = new PIXI.Application();
      appRef.current = app;

      const width = pixiContainerRef.current.clientWidth || window.innerWidth - 280;
      const height = pixiContainerRef.current.clientHeight || window.innerHeight;

      await app.init({
        background: '#1e1e24',
        width: width,
        height: height,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (isCancelled) {
        app.destroy(true, { children: true, texture: true });
        appRef.current = null;
        return;
      }

      if (pixiContainerRef.current) {
        pixiContainerRef.current.appendChild(app.canvas);
      }

      canvasElement = app.canvas;

      // --- CONTAINER DO MUNDO (Permite Pan & Zoom global) ---
      const world = new PIXI.Container();
      app.stage.addChild(world);

      // --- CRIANDO O GRID DE TESTE ---
      const gridSize = 50; 
      const graphics = new PIXI.Graphics();
      graphics.setStrokeStyle({ width: 1, color: 0x333340, alpha: 0.8 });

      const canvasWidth = width * 4;
      const canvasHeight = height * 4;

      for (let x = -canvasWidth; x <= canvasWidth; x += gridSize) {
        graphics.moveTo(x, -canvasHeight).lineTo(x, canvasHeight);
      }
      for (let y = -canvasHeight; y <= canvasHeight; y += gridSize) {
        graphics.moveTo(-canvasWidth, y).lineTo(canvasWidth, y);
      }
      graphics.stroke();
      world.addChild(graphics);

      // --- CONTAINER DOS TOKENS ---
      const tokensContainer = new PIXI.Container();
      world.addChild(tokensContainer);

      // --- FUNÇÃO PARA DESENHAR UM TOKEN NO CANVAS ---
      const renderToken = (tokenData) => {
        const tokenGroup = new PIXI.Container();
        tokenGroup.x = tokenData.position.x;
        tokenGroup.y = tokenData.position.y;
        tokenGroup.eventMode = 'static';
        tokenGroup.cursor = 'grab';

        const radius = (gridSize / 2) - 4; // Raio proporcional à célula do grid
        const isEnemy = tokenData.ownerId === 'gm';
        const color = isEnemy ? 0xcc2929 : 0x2979ff; // Vermelho para inimigos, Azul para aliados

        // 1. Círculo do Token
        const circle = new PIXI.Graphics();
        circle.fill({ color: color });
        circle.circle(0, 0, radius);
        circle.fill();
        circle.setStrokeStyle({ width: 2, color: 0xffffff });
        circle.stroke();
        tokenGroup.addChild(circle);

        // 2. Texto do Nome do Token
        const label = new PIXI.Text({
          text: tokenData.name,
          style: {
            fontSize: 12,
            fill: 0xffffff,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 3,
          }
        });
        label.anchor.set(0.5, 1);
        label.position.y = -radius - 8;
        tokenGroup.addChild(label);

        // 3. Barra de Vida (HP)
        const barWidth = gridSize - 8;
        const barHeight = 6;
        const hpPercentage = Math.max(0, tokenData.stats.hp / tokenData.stats.maxHp);

        const hpBg = new PIXI.Graphics();
        hpBg.fill({ color: 0x000000, alpha: 0.6 });
        hpBg.rect(-barWidth / 2, radius + 4, barWidth, barHeight);
        hpBg.fill();
        tokenGroup.addChild(hpBg);

        const hpFill = new PIXI.Graphics();
        hpFill.fill({ color: hpPercentage > 0.4 ? 0x4caf50 : 0xf44336 });
        hpFill.rect(-barWidth / 2, radius + 4, barWidth * hpPercentage, barHeight);
        hpFill.fill();
        tokenGroup.addChild(hpFill);

        // --- SISTEMA DE ARRASTAR TOKEN (DRAG & DROP) ---
        let isDraggingToken = false;
        let dragOffset = { x: 0, y: 0 };

        tokenGroup.on('pointerdown', (e) => {
          e.stopPropagation(); // Evita mover o mapa ao mesmo tempo que move o token
          isDraggingToken = true;
          tokenGroup.cursor = 'grabbing';

          const localPos = world.toLocal(e.global);
          dragOffset = {
            x: localPos.x - tokenGroup.x,
            y: localPos.y - tokenGroup.y,
          };
        });

        const onTokenMove = (e) => {
          if (!isDraggingToken) return;
          const localPos = world.toLocal(e.global);
          tokenGroup.x = localPos.x - dragOffset.x;
          tokenGroup.y = localPos.y - dragOffset.y;
        };

        const onTokenRelease = () => {
          if (!isDraggingToken) return;
          isDraggingToken = false;
          tokenGroup.cursor = 'grab';

          // Snapping (Alinhamento) no Grid de 50px
          const snappedX = Math.floor(tokenGroup.x / gridSize) * gridSize + gridSize / 2;
          const snappedY = Math.floor(tokenGroup.y / gridSize) * gridSize + gridSize / 2;

          tokenGroup.x = snappedX;
          tokenGroup.y = snappedY;

          // Atualiza a posição no GameStore
          gameStore.moveToken(tokenData.id, snappedX, snappedY);
        };

        app.stage.on('pointermove', onTokenMove);
        app.stage.on('pointerup', onTokenRelease);
        app.stage.on('pointerupoutside', onTokenRelease);

        tokensContainer.addChild(tokenGroup);
      };

      // --- RENDERIZA TOKENS DO STORE ---
      const state = gameStore.getState();
      Object.values(state.tokens).forEach((token) => renderToken(token));

      // --- SISTEMA DE PAN & ZOOM DO NAVEGADOR ---
      let isDraggingMap = false;
      let startPosition = { x: 0, y: 0 };

      const onPointerDown = (e) => {
        if (e.button === 0) {
          isDraggingMap = true;
          startPosition = { x: e.clientX - world.position.x, y: e.clientY - world.position.y };
        }
      };

      onPointerMove = (e) => {
        if (!isDraggingMap) return;
        world.position.x = e.clientX - startPosition.x;
        world.position.y = e.clientY - startPosition.y;
      };

      onPointerUp = () => {
        isDraggingMap = false;
      };

      const onWheel = (e) => {
        e.preventDefault();
        const zoomFactor = 1.15;
        let newScale = e.deltaY < 0 ? world.scale.x * zoomFactor : world.scale.x / zoomFactor;

        newScale = Math.max(0.2, Math.min(5, newScale));

        const rect = canvasElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        world.position.x = mouseX - (mouseX - world.position.x) * (newScale / world.scale.x);
        world.position.y = mouseY - (mouseY - world.position.y) * (newScale / world.scale.y);
        world.scale.set(newScale);
      };

      canvasElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      canvasElement.addEventListener('wheel', onWheel, { passive: false });

      handleResize = () => {
        if (pixiContainerRef.current && appRef.current) {
          const newW = pixiContainerRef.current.clientWidth;
          const newH = pixiContainerRef.current.clientHeight;
          appRef.current.renderer.resize(newW, newH);
        }
      };

      window.addEventListener('resize', handleResize);
    };

    initPixi();

    // --- CLEANUP ---
    return () => {
      isCancelled = true;
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
      if (onPointerUp) window.removeEventListener('pointerup', onPointerUp);

      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* Painel Lateral / HUD (React) */}
      <div style={{ width: '280px', backgroundColor: '#121216', color: '#fff', padding: '20px', borderRight: '1px solid #2a2a35', zIndex: 10, flexShrink: 0 }}>
        <h2>Virtual Tabletop</h2>
        
        {/* Indicador de Conexão */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
          <span style={{ height: '10px', width: '10px', borderRadius: '50%', backgroundColor: isConnected ? '#4caf50' : '#f44336', display: 'inline-block' }}></span>
          <span style={{ color: isConnected ? '#4caf50' : '#f44336' }}>
            {isConnected ? 'Conectado à Sala' : 'Desconectado'}
          </span>
        </div>

        <hr style={{ borderColor: '#2a2a35', margin: '20px 0' }} />
        <h3>Ferramentas</h3>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
          <li style={{ padding: '8px 0', cursor: 'pointer' }}>🗺️ Mapa & Grid</li>
          <li style={{ padding: '8px 0', cursor: 'pointer' }}>🪙 Tokens (Ativos)</li>
          <li style={{ padding: '8px 0', cursor: 'pointer' }}>🎲 Rolador de Dados</li>
        </ul>
        <div style={{ marginTop: '30px', fontSize: '12px', color: '#8c8c9e' }}>
          <p>💡 <b>Controles:</b></p>
          <p>- Arraste no fundo para mover o mapa.</p>
          <p>- Roda do mouse para Zoom.</p>
          <p>- Arraste um <b>Token</b> para movê-lo no grid.</p>
        </div>
      </div>

      {/* Área do Canvas PixiJS */}
      <div ref={pixiContainerRef} style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', cursor: 'grab' }} />
    </div>
  );
}

export default App;