import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../game/components/LoadingScreen';
import MainMenu from '../game/components/MainMenu';
import GameSetup from '../game/components/GameSetup';
import BattleArena from '../game/components/BattleArena';
import { createInitialGameState } from '../game/utils/gameEngine';
import { soundFX } from '../game/utils/audio';
import './GamePage.css';

export default function GamePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'setup' | 'arena'
  const [gameState, setGameState] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [tvMode, setTvMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);

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

  const handleGoToMenu = () => {
    setGameState(null);
    setShowNewMatchModal(false);
    setActiveTab('menu');
  };

  useEffect(() => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch((e) => console.log('Orientation lock failed:', e));
      }
    } catch (e) {
      console.log('Orientation API not supported');
    }
  }, []);

  // 1. Initial Arcade Game Loading Screen
  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className={`app-shell ${tvMode ? 'tv-mode-active' : ''}`}>
      <div className="force-orientation-overlay force-landscape-overlay">
        <div className="icon">📱</div>
        <h2>Please Rotate Your Device</h2>
        <p>The Battle Arena requires Landscape mode.</p>
      </div>

      <main className="main-content-viewport">
        {/* Main Menu Screen (Page 7) */}
        {activeTab === 'menu' && (
          <MainMenu
            onStartCustomGame={() => setActiveTab('setup')}
            onStartQuickDuel={handleStartQuickDuel}
            tvMode={tvMode}
            setTvMode={setTvMode}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = soundFX.toggleMute();
              setIsMuted(muted);
            }}
            onExitToHub={() => navigate('/')}
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
            setGameState={setGameState}
            historyStack={historyStack}
            setHistoryStack={setHistoryStack}
            tvMode={tvMode}
            onRematch={handleRematch}
            onOpenNewMatch={handleOpenNewMatchDialog}
            onExitToHub={() => navigate('/')}
          />
        )}
      </main>

      {/* End Match / Reset Confirmation Modal */}
      {showNewMatchModal && (
        <div className="pdf-modal-backdrop">
          <div className="pdf-dialog-card">
            <div className="pdf-dialog-header">
              <div className="header-title-box">
                <span className="step-pill">MATCH CONTROLS</span>
                <h2>End Match & Arena Options</h2>
              </div>
              <button className="btn-close" onClick={() => setShowNewMatchModal(false)}>✕</button>
            </div>

            <div className="pdf-dialog-body">
              <p className="dialog-desc">
                Choose how you would like to conclude or reset the current battle:
              </p>

              <div className="dialog-options-list">
                <button className="dialog-opt-btn primary" onClick={handleDeclareWinner}>
                  <span className="opt-icon">🏆</span>
                  <div>
                    <strong>End Match & Declare Winner</strong>
                    <span>Conclude battle and show victory podium for the leading warrior</span>
                  </div>
                </button>

                <button className="dialog-opt-btn secondary" onClick={handleConfirmReturnToSetup}>
                  <span className="opt-icon">⚙️</span>
                  <div>
                    <strong>Configure New Match</strong>
                    <span>Return to Setup screen to change warriors, roster, or match rules</span>
                  </div>
                </button>

                <button className="dialog-opt-btn secondary" onClick={handleQuickRestartSamePlayers}>
                  <span className="opt-icon">🔄</span>
                  <div>
                    <strong>Quick Rematch (Same Warriors)</strong>
                    <span>Restart immediately with full HP and 5 Energy Tokens</span>
                  </div>
                </button>

                <button className="dialog-opt-btn cancel" onClick={() => setShowNewMatchModal(false)}>
                  <span>Cancel / Continue Battle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
