import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Music } from 'lucide-react';

export default function MusicPlayer({ track, onPlayStatusChange = null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayStatusChange) onPlayStatusChange(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlayStatusChange]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPlayStatusChange) onPlayStatusChange(false);
    } else {
      // Stop all other players before playing this one
      const allAudios = document.querySelectorAll('audio');
      allAudios.forEach(audio => {
        if (audio !== audioRef.current) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      
      audioRef.current.play();
      setIsPlaying(true);
      if (onPlayStatusChange) onPlayStatusChange(true);
    }
  };

  const handleProgressChange = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0, 150, 255, 0.1) 0%, rgba(0, 100, 200, 0.05) 100%)',
      border: '1px solid rgba(0, 200, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '8px'
    }}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        style={{
          background: 'rgba(0, 200, 255, 0.15)',
          border: '1px solid rgba(0, 200, 255, 0.3)',
          borderRadius: '8px',
          color: '#00ccff',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(0, 200, 255, 0.25)';
          e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 200, 255, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(0, 200, 255, 0.15)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Time */}
      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', minWidth: '30px' }}>
        {formatTime(currentTime)}
      </span>

      {/* Progress Slider */}
      <input
        ref={audioRef}
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleProgressChange}
        style={{
          flex: 1,
          height: '4px',
          background: 'rgba(0, 200, 255, 0.2)',
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ccff;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 200, 255, 0.6);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ccff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(0, 200, 255, 0.6);
        }
      `}</style>

      {/* Duration */}
      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', minWidth: '30px', textAlign: 'right' }}>
        {formatTime(duration)}
      </span>

      {/* Volume Control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
        <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            flex: 1,
            height: '3px',
            background: 'rgba(0, 200, 255, 0.15)',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={track?.music_url}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
    </div>
  );
}
