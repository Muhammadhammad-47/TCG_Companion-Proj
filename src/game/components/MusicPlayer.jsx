import React, { useState, useEffect, useRef } from 'react';
import { musicService } from '../../services/musicService';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, List, Shuffle, Repeat, ChevronUp, ChevronDown, X } from 'lucide-react';

export default function MusicPlayer() {
  // Playlist and current song state
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'one', 'all'
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);

  // Load preferences from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('musicVolume');
    const savedShuffle = localStorage.getItem('musicShuffle');
    const savedRepeat = localStorage.getItem('musicRepeat');

    if (savedVolume) setVolume(parseFloat(savedVolume));
    if (savedShuffle) setShuffle(JSON.parse(savedShuffle));
    if (savedRepeat) setRepeatMode(savedRepeat);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('musicVolume', volume.toString());
    localStorage.setItem('musicShuffle', JSON.stringify(shuffle));
    localStorage.setItem('musicRepeat', repeatMode);
  }, [volume, shuffle, repeatMode]);

  // Fetch approved music on mount
  useEffect(() => {
    const fetchMusic = async () => {
      setIsLoading(true);
      try {
        const songs = await musicService.getApprovedMusic();
        if (songs && songs.length > 0) {
          setPlaylist(songs);
          setError(null);
        } else {
          setError('No approved songs available');
          setPlaylist([]);
        }
      } catch (err) {
        console.error('Failed to fetch music:', err);
        setError('Failed to load music playlist');
        setPlaylist([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMusic();
  }, []);

  // Update audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      handleSongEnd();
    };

    const handleError = () => {
      console.error('Audio playback error:', audio.error);
      setError('Failed to play audio');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, playlist.length]);

  // Play or pause the current song
  const handlePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play:', err);
        setError('Failed to play audio');
      });
      setIsPlaying(true);
    }
  };

  // Handle song end - auto-play next
  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      // Replay the same song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error('Failed to replay:', err));
      }
    } else {
      // Play next song
      playNextSong();
    }
  };

  // Play next song
  const playNextSong = () => {
    if (playlist.length === 0) return;

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentSongIndex + 1) % playlist.length;
    }

    setCurrentSongIndex(nextIndex);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Play previous song
  const playPreviousSong = () => {
    if (playlist.length === 0) return;

    let prevIndex;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    }

    setCurrentSongIndex(prevIndex);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Play a specific song from playlist
  const playSong = (index) => {
    setCurrentSongIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
    setIsExpanded(false);
  };

  // Toggle repeat mode
  const toggleRepeatMode = () => {
    const modes = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  // Update audio src when song changes
  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      const currentSong = playlist[currentSongIndex];
      if (currentSong && currentSong.music_url) {
        audioRef.current.src = currentSong.music_url;
        audioRef.current.load();

        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.error('Failed to play new song:', err);
            setError('Failed to play audio');
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentSongIndex, playlist]);

  // Format time (MM:SS)
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get filtered playlist based on search
  const filteredPlaylist = searchQuery
    ? playlist.filter(
        song =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : playlist;

  const currentSong = playlist[currentSongIndex];

  return (
    <>
      <audio ref={audioRef} crossOrigin="anonymous" />

      {/* Compact Player - Bottom Right */}
      <div
        style={{
          position: 'fixed',
          bottom: isExpanded ? 0 : '20px',
          right: isExpanded ? 0 : '20px',
          width: isExpanded ? '100%' : '360px',
          height: isExpanded ? '100%' : 'auto',
          backgroundColor: '#0f0f1e',
          border: isExpanded ? 'none' : '2px solid #FBC80D',
          borderRadius: isExpanded ? 0 : '12px',
          boxShadow: isExpanded ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {/* Expanded Playlist View */}
        {isExpanded && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #FBC80D',
                backgroundColor: '#0f0f1e'
              }}
            >
              <h2 style={{ margin: 0, color: '#FBC80D', fontSize: '18px' }}>
                <Music size={20} style={{ marginRight: '8px', display: 'inline' }} />
                Playlist
              </h2>
              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FBC80D',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '20px'
                }}
              >
                <ChevronDown size={24} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a3a' }}>
              <input
                type="text"
                placeholder="Search by title or artist..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1a1a2a',
                  border: '1px solid #FBC80D',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Playlist Songs */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 0'
              }}
            >
              {isLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#FBC80D' }}>
                  Loading playlist...
                </div>
              ) : error && playlist.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#ff6b6b' }}>
                  {error}
                </div>
              ) : filteredPlaylist.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
                  No songs found
                </div>
              ) : (
                filteredPlaylist.map((song, index) => {
                  const actualIndex = playlist.findIndex(s => s.id === song.id);
                  const isCurrentSong = actualIndex === currentSongIndex;
                  return (
                    <div
                      key={song.id}
                      onClick={() => playSong(actualIndex)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #2a2a3a',
                        cursor: 'pointer',
                        backgroundColor: isCurrentSong ? 'rgba(251, 200, 13, 0.1)' : 'transparent',
                        borderLeft: isCurrentSong ? '3px solid #FBC80D' : 'none',
                        paddingLeft: isCurrentSong ? '13px' : '16px',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: 'rgba(251, 200, 13, 0.05)'
                        }
                      }}
                      onMouseEnter={e => (e.target.style.backgroundColor = 'rgba(251, 200, 13, 0.05)')}
                      onMouseLeave={e =>
                        (e.target.style.backgroundColor = isCurrentSong
                          ? 'rgba(251, 200, 13, 0.1)'
                          : 'transparent')
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCurrentSong && (isPlaying ? <Pause size={16} color="#FBC80D" /> : <Play size={16} color="#FBC80D" />)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: isCurrentSong ? '#FBC80D' : '#f3f4f6',
                              fontSize: '14px',
                              fontWeight: isCurrentSong ? '600' : '500',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {song.title}
                          </div>
                          <div
                            style={{
                              color: '#9ca3af',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {song.username}
                          </div>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '12px', minWidth: '30px', textAlign: 'right' }}>
                          {/* Duration can be added if available in data */}
                          ♫
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Compact Player View */}
        {!isExpanded && (
          <>
            {/* Current Song Display */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #FBC80D' }}>
              {error && playlist.length === 0 ? (
                <div style={{ color: '#ff6b6b', fontSize: '12px', textAlign: 'center' }}>
                  {error}
                </div>
              ) : currentSong ? (
                <>
                  <div
                    style={{
                      color: '#FBC80D',
                      fontSize: '13px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {currentSong.title}
                  </div>
                  <div
                    style={{
                      color: '#9ca3af',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {currentSong.username}
                  </div>
                </>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {isLoading ? 'Loading...' : 'No songs available'}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {currentSong && (
              <div style={{ padding: '8px 16px' }}>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={e => {
                    const newTime = parseFloat(e.target.value);
                    setCurrentTime(newTime);
                    if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '4px',
                    cursor: 'pointer',
                    backgroundColor: '#2a2a3a',
                    outline: 'none',
                    borderRadius: '2px',
                    accentColor: '#FBC80D'
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    fontSize: '11px',
                    color: '#9ca3af'
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                padding: '12px'
              }}
            >
              <button
                onClick={() => setShuffle(!shuffle)}
                style={{
                  background: shuffle ? 'rgba(251, 200, 13, 0.2)' : 'transparent',
                  border: `1px solid ${shuffle ? '#FBC80D' : '#2a2a3a'}`,
                  color: shuffle ? '#FBC80D' : '#9ca3af',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                title="Shuffle"
              >
                <Shuffle size={16} />
              </button>

              <button
                onClick={playPreviousSong}
                disabled={playlist.length === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FBC80D',
                  cursor: playlist.length === 0 ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: playlist.length === 0 ? 0.5 : 1
                }}
                title="Previous"
              >
                <SkipBack size={18} fill="#FBC80D" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={playlist.length === 0}
                style={{
                  background: '#FBC80D',
                  border: 'none',
                  color: '#0f0f1e',
                  cursor: playlist.length === 0 ? 'not-allowed' : 'pointer',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '600',
                  opacity: playlist.length === 0 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>

              <button
                onClick={playNextSong}
                disabled={playlist.length === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FBC80D',
                  cursor: playlist.length === 0 ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: playlist.length === 0 ? 0.5 : 1
                }}
                title="Next"
              >
                <SkipForward size={18} fill="#FBC80D" />
              </button>

              <button
                onClick={toggleRepeatMode}
                style={{
                  background:
                    repeatMode === 'off'
                      ? 'transparent'
                      : 'rgba(251, 200, 13, 0.2)',
                  border: `1px solid ${
                    repeatMode === 'off'
                      ? '#2a2a3a'
                      : '#FBC80D'
                  }`,
                  color:
                    repeatMode === 'off'
                      ? '#9ca3af'
                      : '#FBC80D',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                title={`Repeat: ${repeatMode}`}
              >
                <Repeat size={16} style={{ marginRight: '2px' }} />
                {repeatMode === 'one' && <span style={{ fontSize: '10px' }}>1</span>}
              </button>
            </div>

            {/* Volume Control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 16px 12px'
              }}
            >
              <Volume2 size={16} color="#9ca3af" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  height: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#2a2a3a',
                  outline: 'none',
                  borderRadius: '2px',
                  accentColor: '#FBC80D'
                }}
              />
              <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '20px' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Playlist Button */}
            <button
              onClick={() => setIsExpanded(true)}
              disabled={playlist.length === 0}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(251, 200, 13, 0.1)',
                border: '1px solid #FBC80D',
                color: '#FBC80D',
                cursor: playlist.length === 0 ? 'not-allowed' : 'pointer',
                borderTop: '1px solid #FBC80D',
                borderRadius: '0 0 10px 10px',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: playlist.length === 0 ? 0.5 : 1
              }}
              title="View playlist"
            >
              <List size={16} />
              Playlist ({filteredPlaylist.length})
            </button>
          </>
        )}
      </div>
    </>
  );
}
