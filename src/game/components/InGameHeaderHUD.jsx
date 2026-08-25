import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Music, Volume2, VolumeX, Tv, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function InGameHeaderHUD({
  onGoToMenu,
  onOpenRulebook,
  tvMode,
  setTvMode,
  isFullscreen: propFullscreen,
  onToggleFullscreen: propToggleFullscreen,
  isMuted,
  setIsMuted,
  onResetGame,
  gameActive
}) {
  const [bgmActive, setBgmActive] = useState(soundFX.bgmPlaying);
  const [localFullscreen, setLocalFullscreen] = useState(!!document.fullscreenElement);

  const isFullscreen = propFullscreen !== undefined ? propFullscreen : localFullscreen;

  useEffect(() => {
    const handleFsChange = () => setLocalFullscreen(!!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ));
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
    if (propToggleFullscreen) {
      propToggleFullscreen();
      return;
    }
    soundFX.playMenuHover();
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      setLocalFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setLocalFullscreen(false);
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setLocalFullscreen(false);
      }
    }
  };

  return (
    <div className="ingame-hud-bar hud-bar">
      {/* Left: Quick Return to Main Menu */}
      <button
        className="hud-btn hud-menu-btn"
        onClick={() => {
          soundFX.playMenuSelect();
          onGoToMenu();
        }}
        title="Home"
      >
        <Home size={16} />
        <span className="suit-mini-badge">🃏</span>
      </button>

      {/* Center: In-Game Game Rulebook */}
      <button
        className="hud-btn hud-rulebook-btn"
        onClick={() => {
          soundFX.playCard();
          onOpenRulebook();
        }}
        title="Rules"
      >
        <BookOpen size={16} />
        <span>RULES</span>
      </button>

      {/* Right: Sound & Display Controls */}
      <div className="hud-right-tools">
        <button
          className={`hud-btn ${bgmActive ? 'active-hud' : ''}`}



        <button
          className={`hud-btn ${tvMode ? 'active-hud' : ''}`}
          onClick={() => {
            soundFX.playMenuHover();
            setTvMode(!tvMode);
          }}
          title="Cast"
        >
          <Tv size={16} />
        </button>



        {gameActive && (
          <button
            className="hud-btn hud-reset-btn"
            onClick={onResetGame}
            title="New match"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
