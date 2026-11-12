import React from 'react';

/**
 * DiscordAvatarDecoration Component
 * Renders authentic, sculpted foreground avatar decorations matching Discord's aesthetic.
 * Sits directly on top of the avatar circle with z-index foreground layering,
 * projecting thematic elements (crowns, dragon horns, cyber visors, void tendrils,
 * pilot goggles, and angel wings) outward and over the portrait rim.
 */
export default function DiscordAvatarDecoration({ frameId, size = 40 }) {
  if (!frameId || frameId === 'none') return null;

  const cleanId = String(frameId).toLowerCase();

  return (
    <div
      className="discord-avatar-decoration-root"
      style={{
        position: 'absolute',
        top: '-16%',
        left: '-16%',
        width: '132%',
        height: '132%',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          display: 'block'
        }}
      >
        <defs>
          {/* Filters */}
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="redGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="purpleGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="apexGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff3a8" />
            <stop offset="35%" stopColor="#FBC80D" />
            <stop offset="70%" stopColor="#b38600" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>

          <linearGradient id="crownGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#FBC80D" />
            <stop offset="100%" stopColor="#996c00" />
          </linearGradient>

          <linearGradient id="dragonFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff0055" />
            <stop offset="50%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#ffdd00" />
          </linearGradient>

          <linearGradient id="hornDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22000a" />
            <stop offset="60%" stopColor="#800020" />
            <stop offset="100%" stopColor="#ff0055" />
          </linearGradient>

          <linearGradient id="voidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d001a" />
            <stop offset="50%" stopColor="#7209b7" />
            <stop offset="100%" stopColor="#e0aaff" />
          </linearGradient>

          <linearGradient id="pioneerGogglesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d1b02" />
            <stop offset="50%" stopColor="#b36200" />
            <stop offset="100%" stopColor="#FBC80D" />
          </linearGradient>

          <linearGradient id="championGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#ff8800" />
            <stop offset="75%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#b38600" />
          </linearGradient>
          <linearGradient id="wingGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#7a5500" />
          </linearGradient>
        </defs>

        {/* 1. STANDARD GOLD: Duel Champion Crown & Golden Laurels */}
        {(cleanId === 'frame_standard' || cleanId === 'standard') && (
          <g className="discord-decor-group">
            {/* Base Beveled Golden Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#goldRingGrad)"
              strokeWidth="3.2"
              filter="url(#goldGlow)"
            />
            <circle
              cx="50"
              cy="50"
              r="36.4"
              fill="none"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="0.8"
            />
            
            {/* Duel Champion 3-Point Crown on Top Foreground */}
            <polygon
              points="34,18 29,8 42,13 50,3 58,13 71,8 66,18"
              fill="url(#crownGoldGrad)"
              stroke="#ffd700"
              strokeWidth="1"
              filter="url(#goldGlow)"
            />
            {/* Crown Base Rim */}
            <path
              d="M 33 18 Q 50 23 67 18 Q 50 20.5 33 18"
              fill="#b38600"
              stroke="#ffd700"
              strokeWidth="0.8"
            />
            {/* Center Royal Ruby Jewel */}
            <polygon
              points="50,8 53.5,12.5 50,17 46.5,12.5"
              fill="#ff0044"
              stroke="#ffffff"
              strokeWidth="0.6"
              filter="url(#goldGlow)"
            />
            {/* Side Diamonds */}
            <circle cx="36" cy="14" r="1.5" fill="#00f0ff" stroke="#fff" strokeWidth="0.4" />
            <circle cx="64" cy="14" r="1.5" fill="#00f0ff" stroke="#fff" strokeWidth="0.4" />

            {/* Bottom Golden Laurel Leaves */}
            <path
              d="M 50,88 C 36,88 22,79 17,66"
              fill="none"
              stroke="#ffd700"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 50,88 C 64,88 78,79 83,66"
              fill="none"
              stroke="#ffd700"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Left Laurel Leaves */}
            <path d="M 44,88 C 41,83 36,83 38,87 Z" fill="url(#goldRingGrad)" />
            <path d="M 33,83 C 28,78 24,80 27,84 Z" fill="url(#goldRingGrad)" />
            <path d="M 23,75 C 18,70 15,73 19,77 Z" fill="url(#goldRingGrad)" />
            {/* Right Laurel Leaves */}
            <path d="M 56,88 C 59,83 64,83 62,87 Z" fill="url(#goldRingGrad)" />
            <path d="M 67,83 C 72,78 76,80 73,84 Z" fill="url(#goldRingGrad)" />
            <path d="M 77,75 C 82,70 85,73 81,77 Z" fill="url(#goldRingGrad)" />

            {/* Sparkling Stars */}
            <path
              d="M 21,28 Q 21,31 18,31 Q 21,31 21,34 Q 21,31 24,31 Q 21,31 21,28"
              fill="#ffffff"
              className="discord-sparkle-anim"
            />
            <path
              d="M 79,28 Q 79,31 76,31 Q 79,31 79,34 Q 79,31 82,31 Q 79,31 79,28"
              fill="#ffffff"
              className="discord-sparkle-anim-delayed"
            />
          </g>
        )}

        {/* 2. CYBER MATRIX CYAN: Cybernetic HUD Visor & Headset Nodes */}
        {(cleanId === 'frame_neon_cyan' || cleanId === 'neon_cyan' || cleanId === 'cyber_matrix') && (
          <g className="discord-decor-group">
            {/* Segmented Neon Cyan Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.8"
              strokeDasharray="18 4 8 4"
              filter="url(#cyanGlow)"
            />
            <circle
              cx="50"
              cy="50"
              r="35.5"
              fill="none"
              stroke="rgba(0, 240, 255, 0.3)"
              strokeWidth="1"
            />

            {/* Holographic Forehead HUD Visor Bar */}
            <path
              d="M 24,24 Q 50,15 76,24 L 74,31 Q 50,23 26,31 Z"
              fill="rgba(0, 240, 255, 0.32)"
              stroke="#00f0ff"
              strokeWidth="1.2"
              filter="url(#cyanGlow)"
            />
            {/* Visor Reticles & HUD Data */}
            <path d="M 44,22 L 40,22 L 40,26" fill="none" stroke="#ffffff" strokeWidth="0.9" />
            <path d="M 56,22 L 60,22 L 60,26" fill="none" stroke="#ffffff" strokeWidth="0.9" />
            <circle cx="50" cy="23.5" r="1.6" fill="#ff0055" filter="url(#cyanGlow)" />
            <line x1="30" y1="26" x2="36" y2="26" stroke="#00f0ff" strokeWidth="1" strokeDasharray="1 1" />
            <line x1="64" y1="26" x2="70" y2="26" stroke="#00f0ff" strokeWidth="1" strokeDasharray="1 1" />

            {/* Left Cyber Headset Earpiece */}
            <rect
              x="6"
              y="43"
              width="7.5"
              height="14"
              rx="3"
              fill="#061224"
              stroke="#00f0ff"
              strokeWidth="1.3"
              filter="url(#cyanGlow)"
            />
            <line x1="8.5" y1="46" x2="11" y2="46" stroke="#00f0ff" strokeWidth="1.2" />
            <line x1="8.5" y1="50" x2="11" y2="50" stroke="#00ffaa" strokeWidth="1.2" />
            <line x1="8.5" y1="54" x2="11" y2="54" stroke="#00f0ff" strokeWidth="1.2" />

            {/* Right Cyber Headset Earpiece */}
            <rect
              x="86.5"
              y="43"
              width="7.5"
              height="14"
              rx="3"
              fill="#061224"
              stroke="#00f0ff"
              strokeWidth="1.3"
              filter="url(#cyanGlow)"
            />
            <line x1="89" y1="46" x2="91.5" y2="46" stroke="#00f0ff" strokeWidth="1.2" />
            <line x1="89" y1="50" x2="91.5" y2="50" stroke="#00ffaa" strokeWidth="1.2" />
            <line x1="89" y1="54" x2="91.5" y2="54" stroke="#00f0ff" strokeWidth="1.2" />

            {/* Bottom Energy Conduits & Power Diode */}
            <path
              d="M 28,79 Q 50,91 72,79"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeDasharray="4 2"
            />
            <polygon
              points="50,84 54,88.5 50,93 46,88.5"
              fill="#00f0ff"
              stroke="#ffffff"
              strokeWidth="0.8"
              filter="url(#cyanGlow)"
            />
          </g>
        )}

        {/* 3. CRIMSON FURY: Dragon Horns, Spikes & Hellfire Flames */}
        {(cleanId === 'frame_crimson_dragon' || cleanId === 'crimson_dragon' || cleanId === 'crimson_fury') && (
          <g className="discord-decor-group">
            {/* Fiery Crimson Border */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#dragonFlameGrad)"
              strokeWidth="3.2"
              filter="url(#redGlow)"
            />

            {/* Left Crimson Dragon Horn (Sweeping upward & outward) */}
            <path
              d="M 29,24 C 23,15 17,9 10,4 C 15,12 24,18 34,21 Z"
              fill="url(#hornDarkGrad)"
              stroke="#ff0055"
              strokeWidth="1.2"
              filter="url(#redGlow)"
            />
            <path
              d="M 23,17 C 19,13 15,9 11,5"
              fill="none"
              stroke="#ffaa00"
              strokeWidth="0.8"
            />

            {/* Right Crimson Dragon Horn (Sweeping upward & outward) */}
            <path
              d="M 71,24 C 77,15 83,9 90,4 C 85,12 76,18 66,21 Z"
              fill="url(#hornDarkGrad)"
              stroke="#ff0055"
              strokeWidth="1.2"
              filter="url(#redGlow)"
            />
            <path
              d="M 77,17 C 81,13 85,9 89,5"
              fill="none"
              stroke="#ffaa00"
              strokeWidth="0.8"
            />

            {/* Dragon Forehead Ruby Crest */}
            <polygon
              points="50,14 54,19 50,24 46,19"
              fill="#ff0055"
              stroke="#ffffff"
              strokeWidth="0.8"
              filter="url(#redGlow)"
            />

            {/* Licking Flame Tongues across Bottom & Lower Rim */}
            <path
              d="M 18,66 C 12,58 16,50 22,54 C 18,61 24,65 21,72 Z"
              fill="url(#dragonFlameGrad)"
              filter="url(#redGlow)"
              className="discord-flame-anim-left"
            />
            <path
              d="M 82,66 C 88,58 84,50 78,54 C 82,61 76,65 79,72 Z"
              fill="url(#dragonFlameGrad)"
              filter="url(#redGlow)"
              className="discord-flame-anim-right"
            />
            <path
              d="M 46,92 C 43,83 48,77 50,73 C 52,77 57,83 54,92 Z"
              fill="#ffdd00"
              filter="url(#redGlow)"
              className="discord-flame-anim-center"
            />
            <path
              d="M 36,88 C 32,81 37,76 40,79 C 38,84 41,87 38,91 Z"
              fill="#ff5500"
            />
            <path
              d="M 64,88 C 68,81 63,76 60,79 C 62,84 59,87 62,91 Z"
              fill="#ff5500"
            />
          </g>
        )}

        {/* 4. VOID SHADOW: Dark Matter Tendrils, Void Crystals & Arcane Third Eye */}
        {(cleanId === 'frame_void_purple' || cleanId === 'void_purple' || cleanId === 'void_shadow') && (
          <g className="discord-decor-group">
            {/* Deep Violet Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#voidGrad)"
              strokeWidth="3.2"
              filter="url(#purpleGlow)"
            />

            {/* Floating Arcane Third-Eye Diamond Glyphs */}
            <polygon
              points="50,6 58,14 50,22 42,14"
              fill="#120022"
              stroke="#b5179e"
              strokeWidth="1.4"
              filter="url(#purpleGlow)"
            />
            {/* Glowing Ethereal Pupil */}
            <circle cx="50" cy="14" r="3.2" fill="#e0aaff" filter="url(#purpleGlow)" />
            <line x1="50" y1="8" x2="50" y2="20" stroke="#7209b7" strokeWidth="1" />

            {/* Void Crystal Shards on Upper Rim */}
            <polygon
              points="25,15 20,6 30,12"
              fill="#7209b7"
              stroke="#e0aaff"
              strokeWidth="0.8"
              filter="url(#purpleGlow)"
            />
            <polygon
              points="75,15 80,6 70,12"
              fill="#7209b7"
              stroke="#e0aaff"
              strokeWidth="0.8"
              filter="url(#purpleGlow)"
            />

            {/* Dark Shadow Tendrils Creeping into Foreground */}
            <path
              d="M 12,48 C 14,37 23,43 28,40 C 23,46 17,47 13,55 Z"
              fill="url(#voidGrad)"
              filter="url(#purpleGlow)"
              className="discord-tendril-anim-1"
            />
            <path
              d="M 88,48 C 86,37 77,43 72,40 C 77,46 83,47 87,55 Z"
              fill="url(#voidGrad)"
              filter="url(#purpleGlow)"
              className="discord-tendril-anim-2"
            />
            <path
              d="M 36,87 C 44,81 53,84 60,79 C 55,86 47,88 38,91 Z"
              fill="#b5179e"
              filter="url(#purpleGlow)"
            />
            <circle cx="50" cy="85" r="2.2" fill="#e0aaff" />
          </g>
        )}

        {/* 5. CYBER PIONEER: Pilot Aviator Holo-Goggles, Radar Compass & Brass Thrusters */}
        {(cleanId === 'frame_pioneer' || cleanId === 'pioneer' || cleanId === 'cyber_pioneer') && (
          <g className="discord-decor-group">
            {/* Tactical Compass Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#7209b7"
              strokeWidth="2.8"
            />
            <circle
              cx="50"
              cy="50"
              r="35.5"
              fill="none"
              stroke="rgba(251, 200, 13, 0.45)"
              strokeWidth="0.9"
              strokeDasharray="4 2"
            />
            {/* Cardinal Navigation Markers */}
            <line x1="50" y1="12" x2="50" y2="15" stroke="#FBC80D" strokeWidth="1.2" />
            <line x1="50" y1="85" x2="50" y2="88" stroke="#FBC80D" strokeWidth="1.2" />
            <line x1="12" y1="50" x2="15" y2="50" stroke="#FBC80D" strokeWidth="1.2" />
            <line x1="85" y1="50" x2="88" y2="50" stroke="#FBC80D" strokeWidth="1.2" />

            {/* Aviator Cyber-Goggles Resting on Top Rim */}
            {/* Left Lens */}
            <circle
              cx="38"
              cy="18"
              r="8.5"
              fill="rgba(251, 200, 13, 0.28)"
              stroke="url(#pioneerGogglesGrad)"
              strokeWidth="2"
              filter="url(#goldGlow)"
            />
            <circle cx="38" cy="18" r="6.8" fill="none" stroke="#FBC80D" strokeWidth="0.7" />
            <path d="M 33,14 Q 38,13 42,16" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.85" />

            {/* Right Lens */}
            <circle
              cx="62"
              cy="18"
              r="8.5"
              fill="rgba(251, 200, 13, 0.28)"
              stroke="url(#pioneerGogglesGrad)"
              strokeWidth="2"
              filter="url(#goldGlow)"
            />
            <circle cx="62" cy="18" r="6.8" fill="none" stroke="#FBC80D" strokeWidth="0.7" />
            <path d="M 57,14 Q 62,13 66,16" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.85" />

            {/* Goggle Center Bridge */}
            <rect
              x="44"
              y="16"
              width="12"
              height="4"
              rx="2"
              fill="#2e0854"
              stroke="#FBC80D"
              strokeWidth="1.2"
            />
            <circle cx="50" cy="18" r="1.6" fill="#00f0ff" filter="url(#goldGlow)" />

            {/* Goggle Leather Straps reaching sides */}
            <path d="M 29.5,19 C 22,23 16,30 13,38" fill="none" stroke="#3d1b02" strokeWidth="2.4" />
            <path d="M 70.5,19 C 78,23 84,30 87,38" fill="none" stroke="#3d1b02" strokeWidth="2.4" />

            {/* Side Thruster / Exhaust Modules */}
            <rect
              x="6.5"
              y="44"
              width="6.5"
              height="12"
              rx="2"
              fill="#b36200"
              stroke="#7209b7"
              strokeWidth="1.2"
            />
            <rect
              x="87"
              y="44"
              width="6.5"
              height="12"
              rx="2"
              fill="#b36200"
              stroke="#7209b7"
              strokeWidth="1.2"
            />

            {/* Rotating Radar Crosshair Sweep */}
            <g className="discord-radar-sweep">
              <line x1="50" y1="50" x2="50" y2="13" stroke="#FBC80D" strokeWidth="1.2" opacity="0.7" />
            </g>
          </g>
        )}

        {/* 6. APEX CHAMPION: Prestige Golden Angel Wings & Celestial Tiara */}
        {(cleanId === 'frame_tournament_champion' || cleanId === 'tournament_champion' || cleanId === 'apex_champion') && (
          <g className="discord-decor-group">
            {/* Rainbow Prismatic Shimmer Outer Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#championGoldGrad)"
              strokeWidth="3.6"
              filter="url(#apexGlow)"
            />
            <circle
              cx="50"
              cy="50"
              r="35.8"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.8"
            />

            {/* Left Majestic Golden Angel Wing (Spreading wide beyond circle) */}
            <g className="discord-wing-left">
              <path
                d="M 22,44 C 14,35 4,33 0,25 C 3,36 12,45 22,53 Z"
                fill="url(#wingGrad)"
                filter="url(#apexGlow)"
              />
              <path
                d="M 24,51 C 15,46 7,46 3,39 C 7,47 16,53 24,58 Z"
                fill="url(#wingGrad2)"
              />
              <path
                d="M 25,58 C 17,57 11,59 7,54 C 11,60 18,63 26,62 Z"
                fill="#ffd700"
              />
            </g>

            {/* Right Majestic Golden Angel Wing (Spreading wide beyond circle) */}
            <g className="discord-wing-right">
              <path
                d="M 78,44 C 86,35 96,33 100,25 C 97,36 88,45 78,53 Z"
                fill="url(#wingGrad)"
                filter="url(#apexGlow)"
              />
              <path
                d="M 76,51 C 85,46 93,46 97,39 C 93,47 84,53 76,58 Z"
                fill="url(#wingGrad2)"
              />
              <path
                d="M 75,58 C 83,57 89,59 93,54 C 89,60 82,63 74,62 Z"
                fill="#ffd700"
              />
            </g>

            {/* Floating Celestial Tiara Halo */}
            <ellipse
              cx="50"
              cy="8"
              rx="22"
              ry="4.5"
              fill="none"
              stroke="url(#championGoldGrad)"
              strokeWidth="2"
              filter="url(#apexGlow)"
            />
            {/* 5 Diamond Starbursts on Halo */}
            <polygon
              points="50,1 51.8,4.2 55,5 51.8,5.8 50,9 48.2,5.8 45,5 48.2,4.2"
              fill="#ffffff"
              filter="url(#apexGlow)"
              className="discord-sparkle-anim"
            />
            <circle cx="41" cy="7" r="1.5" fill="#ffd700" />
            <circle cx="59" cy="7" r="1.5" fill="#ffd700" />
            <circle cx="34" cy="9" r="1.2" fill="#ffffff" />
            <circle cx="66" cy="9" r="1.2" fill="#ffffff" />
          </g>
        )}
      </svg>
    </div>
  );
}

