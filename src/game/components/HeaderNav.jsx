import React, { useState, useEffect } from 'react';
import { Swords, Home, Tv, Volume2, VolumeX, RotateCcw, BookOpen, Maximize2, Minimize2, Music } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function HeaderNav({
  activeTab,
  setActiveTab,
  tvMode,
  setTvMode,
  isMuted,
  setIsMuted,
  onResetGame,
  gameActive,
  onGoToMenu
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bgmActive, setBgmActive] = useState(soundFX.bgmPlaying);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleMute = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    setBgmActive(!muted && soundFX.bgmPlaying);
  };

  const handleToggleBgm = () => {
    const playing = soundFX.toggleBGM();
    setBgmActive(playing);
  };

  const handleToggleFullscreen = () => {
    soundFX.playMenuHover();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="header-nav brand-header-nav">
      <div className="header-left">
        <div
          className="logo-badge clickable"
          onClick={() => {
            soundFX.playMenuSelect();
            onGoToMenu();
          }}
          title="Home"
        >
          <span className="suit-badge">🃏</span>
          <div className="title-group">
            <h1 className="logo-title">TCG CARD GAME</h1>
          </div>
        </div>
      </div>

      <div className="header-center">
        <button
          className={`nav-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => {
            soundFX.playMenuSelect();
            onGoToMenu();
          }}
        >
          <Home size={18} />
          <span>Menu</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'arena' ? 'active' : ''}`}
          onClick={() => {
            soundFX.playCard();
            setActiveTab('arena');
          }}
        >
          <Swords size={18} />
          <span>Arena</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'rulebook' ? 'active' : ''}`}
          onClick={() => {
            soundFX.playCard();
            setActiveTab('rulebook');
          }}
        >
          <BookOpen size={18} />
          <span>Rules</span>
        </button>
      </div>

      <div className="header-right">
        <button
          className={`icon-btn ${bgmActive ? 'active-glow' : ''}`}
          title="Music"
          onClick={handleToggleBgm}
        >
          <Music size={18} color={bgmActive ? '#2df6ff' : '#d9bdf2'} />
        </button>

        <button
          className={`icon-btn ${tvMode ? 'active-glow' : ''}`}
          title="Cast"
          onClick={() => {
            soundFX.playCard();
            setTvMode(!tvMode);
          }}
        >
          <Tv size={18} />
        </button>

        <button
          className="icon-btn"
          title="Fullscreen"
          onClick={handleToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button
          className="icon-btn"
          title="Sound"
          onClick={handleToggleMute}
        >
          {isMuted ? <VolumeX size={18} color="#ff1a9d" /> : <Volume2 size={18} color="#39ff14" />}
        </button>

        {gameActive && (
          <button
            className="icon-btn reset-btn"
            title="New match"
            onClick={onResetGame}
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
