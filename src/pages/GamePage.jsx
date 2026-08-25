import React, { useState } from 'react';
import { Trophy, Settings, RotateCcw, X } from 'lucide-react';
import LoadingScreen from '../game/components/LoadingScreen';
import MainMenu from '../game/components/MainMenu';
import GameSetup from '../game/components/GameSetup';
import BattleArena from '../game/components/BattleArena';
import { Chat } from '../App';
import { createInitialGameState } from '../game/utils/gameEngine';
import { soundFX } from '../game/utils/audio';
import './GamePage.css';
import { useNavigate } from 'react-router-dom';

export default function GamePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'setup' | 'arena' | 'rules'
  const [rulesReturnTab, setRulesReturnTab] = useState('menu');
  const [gameState, setGameState] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [tvMode, setTvMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);

  React.useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  React.useEffect(() => {
    try {
      if (window.screen && screen.orientation && screen.orientation.lock) {
        if (activeTab === 'arena' || activeTab === 'setup') {
          screen.orientation.lock('landscape').catch(e => console.log('Landscape lock failed', e));
        } else {
          screen.orientation.lock('portrait').catch(e => console.log('Portrait lock failed', e));
        }
      }
    } catch(e) {}
  }, [activeTab]);

  // Orientation managed by activeTab useEffect

  const handleToggleFullscreen = () => {
    soundFX.playMenuHover();
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handleStartGame = ({ players, direction, turnTimerDuration = 60 }) => {
    const initialState = createInitialGameState(players);
    initialState.direction = direction;
    initialState.turnDuration = turnTimerDuration;
    setGameState(initialState);
    setHistoryStack([]);
    setActiveTab('arena');
  };

  // Quick 1v1 Duel Mode (Chynaman vs Zabina "Bee" Sole)
  const handleStartQuickDuel = () => {
    const duelPlayers = [
      {
        name: 'Player 1',
        characterId: 'chynaman',
        startingHP: 100,
        startingET: 5,
        startingCrystals: 2
      },
      {
        name: 'Player 2',
        characterId: 'bee',
        startingHP: 100,
        startingET: 5,
        startingCrystals: 2
      }
    ];
    handleStartGame({ players: duelPlayers, direction: 'clockwise', turnTimerDuration: 60 });
  };

  const handleOpenNewMatchDialog = () => {
    setShowNewMatchModal(true);
  };

  const handleConfirmReturnToSetup = () => {
    setGameState(null);
    setHistoryStack([]);
    setShowNewMatchModal(false);
    setActiveTab('setup');
  };

  const handleQuickRestartSamePlayers = () => {
    if (!gameState) return;
    const rematchPlayers = gameState.players.map((p) => ({
      name: p.name,
      characterId: p.characterId,
      startingHP: 100,
      startingET: 5,
      startingCrystals: gameState.players.length === 2 ? 2 : 1
    }));
    setShowNewMatchModal(false);
    handleStartGame({ players: rematchPlayers, direction: 'clockwise' });
  };

  const handleDeclareWinner = () => {
    if (!gameState || !gameState.players.length) return;
    // Find player with highest crystals, then highest HP
    const sorted = [...gameState.players].sort((a, b) => (b.crystals - a.crystals) || (b.hp - a.hp));
    const winner = sorted[0];
    setShowNewMatchModal(false);
    setGameState({ ...gameState, winner });
  };

  const handleRematch = () => {
    if (!gameState) return;
    const rematchPlayers = gameState.players.map((p) => ({
      name: p.name,
      characterId: p.characterId,
      startingHP: 100,
      startingET: 5,
      startingCrystals: gameState.players.length === 2 ? 2 : 1
    }));
    handleStartGame({ players: rematchPlayers, direction: 'clockwise' });
  };

  const handleOpenRules = () => {
    soundFX.playCard();
    setRulesReturnTab(activeTab);
    setActiveTab('rules');
  };

  const handleGoToMenu = () => {
    setGameState(null);
    setShowNewMatchModal(false);
    setActiveTab('menu');
  };

  // 1. Initial Arcade Game Loading Screen
  if (isLoading) {
    return (
      <div className={`app-shell ${tvMode ? 'tv-mode-active' : ''} ${isFullscreen ? 'fullscreen-mode-active' : ''}`}>
        <main className="main-content-viewport">
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        </main>
      </div>
    );
  }

  return (
    <div className={`app-shell ${tvMode ? 'tv-mode-active' : ''} ${isFullscreen ? 'fullscreen-mode-active' : ''}`}>
      <div className="rotate-device-overlay">
        <div className="rotate-content">
          <RotateCcw size={48} className="rotate-icon" />
          <h2>Please Rotate Your Device</h2>
          <p>This game is best experienced in landscape mode.</p>
        </div>
      </div>
      <button 
        onClick={() => { soundFX.stopBGM(); navigate('/'); }} 
        style={{ position: 'absolute', top: '15px', right: '20px', zIndex: 9999, background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}
        title="Exit to Hub"
      >
        ×
      </button>
      <main className="main-content-viewport">
        {/* Main Menu Screen (Page 7) */}
        {activeTab === 'menu' && (
          <MainMenu
            onStartCustomGame={() => setActiveTab('setup')}
            onStartQuickDuel={handleStartQuickDuel}
            onOpenRules={handleOpenRules}
            tvMode={tvMode}
            setTvMode={setTvMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = soundFX.toggleMute();
              setIsMuted(muted);
            }}
          />
        )}

        {/* Game Setup Screen (Page 8 Top) */}
        {activeTab === 'setup' && (
          <GameSetup
            onStartGame={handleStartGame}
            onBack={() => setActiveTab('menu')}
          />
        )}

        {/* Live Match Battle Arena (Page 8 Bottom) */}
        {activeTab === 'arena' && gameState && (
          <BattleArena
            gameState={gameState}
            onUpdateGameState={setGameState}
            historyStack={historyStack}
            setHistoryStack={setHistoryStack}
            tvMode={tvMode}
            setTvMode={setTvMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onRematch={handleRematch}
            onOpenNewMatch={handleOpenNewMatchDialog}
            onOpenRules={handleOpenRules}
            onGoToMenu={handleGoToMenu}
          />
        )}

        {/* Rules Chatbot Overlay */}
        {activeTab === 'rules' && (
          <div style={{ position: 'fixed', top: '5%', left: '5%', width: '90%', height: '90%', zIndex: 999999, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--neon-cyan)', background: '#02040c', boxShadow: '0 0 30px rgba(0,240,255,0.2)' }}>
            <Chat onBack={() => setActiveTab(rulesReturnTab || 'menu')} />
          </div>
        )}
      </main>

      {/* End Match / Reset Confirmation Modal */}
      {showNewMatchModal && (
        <div className="pdf-modal-backdrop">
          <div className="pdf-dialog-card">
            <div className="pdf-dialog-header">
              <div className="header-title-box">
                <h2>MATCH</h2>
              </div>
              <button className="btn-close" onClick={() => setShowNewMatchModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="pdf-dialog-body">
              <div className="dialog-options-list icon-card-grid">
                <button className="dialog-opt-card primary" onClick={handleDeclareWinner}>
                  <Trophy size={26} />
                  <strong>WINNER</strong>
                </button>

                <button className="dialog-opt-card" onClick={handleQuickRestartSamePlayers}>
                  <RotateCcw size={26} />
                  <strong>REMATCH</strong>
                </button>

                <button className="dialog-opt-card" onClick={handleConfirmReturnToSetup}>
                  <Settings size={26} />
                  <strong>SETUP</strong>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
