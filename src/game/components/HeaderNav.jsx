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
    <header className="header-nav dance-header-nav">
      <div className="header-left">
        <div
          className="logo-badge clickable"
          onClick={() => {
            soundFX.playMenuSelect();
            onGoToMenu();
          }}
          title="Return to Main Menu"
        >
          <span className="kanji-badge">注意!</span>
          <div className="title-group">
            <h1 className="logo-title">DANCE WITH MII!</h1>
            <span className="logo-sub">ANIME EXPRESS TV • COMBAT COMPANION</span>
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
          <span>Main Menu</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'arena' ? 'active' : ''}`}
          onClick={() => {
            soundFX.playCard();
            setActiveTab('arena');
          }}
        >
          <Swords size={18} />
          <span>Battle Arena</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'rulebook' ? 'active' : ''}`}
          onClick={() => {
            soundFX.playCard();
            setActiveTab('rulebook');
          }}
        >
          <BookOpen size={18} />
          <span>Rulebook & Codex</span>
        </button>
      </div>

      <div className="header-right">
        <button
          className={`icon-btn ${bgmActive ? 'active-glow' : ''}`}
          title={bgmActive ? 'Music BGM: ON (Click to Stop)' : 'Music BGM: OFF (Click to Play)'}
          onClick={handleToggleBgm}
        >
          <Music size={18} color={bgmActive ? '#00f0ff' : '#d0b8e8'} />
          <span className="btn-label">{bgmActive ? 'BGM ON' : 'BGM OFF'}</span>
        </button>

        <button
          className={`icon-btn ${tvMode ? 'active-glow' : ''}`}
          title="Toggle Large TV / Tabletop Cast Mode"
          onClick={() => {
            soundFX.playCard();
            setTvMode(!tvMode);
          }}
        >
          <Tv size={18} />
          <span className="btn-label">TV Mode</span>
        </button>

        <button
          className="icon-btn"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          onClick={handleToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button
          className="icon-btn"
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
          onClick={handleToggleMute}
        >
          {isMuted ? <VolumeX size={18} color="#ff007f" /> : <Volume2 size={18} color="#39ff14" />}
        </button>

        {gameActive && (
          <button
            className="icon-btn reset-btn"
            title="Reset / New Match"
            onClick={onResetGame}
          >
            <RotateCcw size={18} />
            <span className="btn-label">New Match</span>
          </button>
        )}
      </div>
    </header>
  );
}
