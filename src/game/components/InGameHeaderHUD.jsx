import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Music, Volume2, VolumeX, Tv, Maximize2, Minimize2, RotateCcw, ArrowLeft } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function InGameHeaderHUD({
  onGoToMenu,
  onOpenRulebook,
  tvMode,
  setTvMode,
  isMuted,
  setIsMuted,
  onResetGame,
  gameActive
}) {
  const [bgmActive, setBgmActive] = useState(soundFX.bgmPlaying);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
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
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="ingame-hud-bar dance-hud-bar">
      {/* Left: Quick Return to Main Menu with Kanji Badge */}
      <button
        className="hud-btn hud-menu-btn"
        onClick={() => {
          soundFX.playMenuSelect();
          onGoToMenu();
        }}
        title="Return to Dance With Mii! Main Menu"
      >
        <Home size={16} />
        <span className="kanji-mini-badge">注意!</span>
        <span>MAIN MENU</span>
      </button>

      <button
        className="hud-btn"
        style={{
          background: 'rgba(225, 29, 72, 0.2)',
          border: '1px solid #e11d48',
          color: '#fff',
        }}
        onClick={() => { window.location.href = '../index.html'; }}
        title="Exit to Hub"
      >
        <ArrowLeft size={16} />
        <span>EXIT TO HUB</span>
      </button>



      {/* Right: Sound & Display Controls */}
      <div className="hud-right-tools">
        <button
          className={`hud-btn ${bgmActive ? 'active-hud' : ''}`}
          onClick={handleToggleBgm}
          title="Toggle Music BGM"
        >
          <Music size={16} color={bgmActive ? '#00f0ff' : '#d0b8e8'} />
        </button>

        <button
          className="hud-btn"
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {isMuted ? <VolumeX size={16} color="#ff007f" /> : <Volume2 size={16} color="#39ff14" />}
        </button>

        <button
          className={`hud-btn ${tvMode ? 'active-hud' : ''}`}
          onClick={() => {
            soundFX.playMenuHover();
            setTvMode(!tvMode);
          }}
          title="Toggle TV Tabletop Projection"
        >
          <Tv size={16} />
        </button>

        <button
          className="hud-btn"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {gameActive && (
          <button
            className="hud-btn hud-reset-btn"
            onClick={onResetGame}
            title="Reset Match / Start New Game"
          >
            <RotateCcw size={16} />
            <span>NEW MATCH</span>
          </button>
        )}
      </div>
    </div>
  );
}
