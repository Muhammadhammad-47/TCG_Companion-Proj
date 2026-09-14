// Chatbot character configurations and viseme mapping for lip-sync animation

export const CHAT_AVATARS = {
  chyna: {
    id: 'chyna',
    name: 'Chynaman',
    shortName: 'Chyna',
    subtitle: 'The Blazing Duelist',
    element: 'Fire',
    icon: '🔥',
    quote: 'You have to believe in your own strength.',
    idlePath: 'Chatbot Characters/Chyna/Idle/SILENCE.png',
    talkDir: 'Chatbot Characters/Chyna/MouthShapes',
    scale: 0.65,
    offsetY: '0px',
    themeColor: '#ff3366',
    glowColor: 'rgba(255, 51, 102, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #ff3366, #ff6600, #ff0055, #ff3366)',
    visuals: {
      enableWaves: false,
      enableOutline: true,
      enableCircleBg: true,
      pumpScaleWide: 1.25,
      pumpScalePartial: 1.15,
      pumpScaleConsonant: 1.08,
      pumpScaleClosed: 1.0
    }
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Sole',
    shortName: 'Bee',
    subtitle: 'Queen of the Hive',
    element: 'Lightning',
    icon: '🐝',
    quote: 'The hive always protects its own.',
    idlePath: 'Chatbot Characters/Bee/Idle/SILENCE.png',
    talkDir: 'Chatbot Characters/Bee/MouthShapes',
    scale: 0.65,
    offsetY: '0px',
    themeColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #00f0ff, #ffd700, #ffaa00, #00f0ff)',
    visuals: {
      enableWaves: false,
      enableOutline: true,
      enableCircleBg: true,
      pumpScaleWide: 1.25,
      pumpScalePartial: 1.15,
      pumpScaleConsonant: 1.08,
      pumpScaleClosed: 1.0
    }
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko the Monkey',
    shortName: 'Kiko',
    subtitle: 'The Electric Prankster',
    element: 'Sonic / Lightning',
    icon: '⚡',
    quote: 'Too fast for you to catch!',
    // NOTE: git tracks as 'Kiko' (capital K) — must match exactly for GitHub Pages (Linux)
    idlePath: 'Chatbot Characters/Kiko/Idle/SILENCE.png',
    talkDir: 'Chatbot Characters/Kiko/MouthShapes',
    scale: 0.65,
    offsetY: '0px',
    themeColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #00e5ff, #3d8bfd, #00ffaa, #00e5ff)',
    visuals: {
      enableWaves: false,
      enableOutline: true,
      enableCircleBg: true,
      pumpScaleWide: 1.25,
      pumpScalePartial: 1.15,
      pumpScaleConsonant: 1.08,
      pumpScaleClosed: 1.0
    }
  },
  katsumi: {
    id: 'katsumi',
    name: 'Katsumi',
    shortName: 'Katsumi',
    subtitle: 'Feline Blade Mistress',
    element: 'Shadow / Steel',
    icon: '🌸',
    quote: 'One strike, one truth.',
    idlePath: 'Chatbot Characters/Katsumi/Idle/SILENCE.png',
    talkDir: 'Chatbot Characters/Katsumi/MouthShapes',
    scale: 0.65,
    offsetY: '0px',
    themeColor: '#ff77a9',
    glowColor: 'rgba(255, 119, 169, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #ff77a9, #ff5500, #ff007f, #ff77a9)',
    visuals: {
      enableWaves: false,
      enableOutline: true,
      enableCircleBg: true,
      pumpScaleWide: 1.25,
      pumpScalePartial: 1.15,
      pumpScaleConsonant: 1.08,
      pumpScaleClosed: 1.0
    }
  },
};

// Each map uses the EXACT filenames (case-sensitive) as they appear in git.
// Checked via: git ls-files "public/Chatbot Characters"
// GitHub Pages is Linux (case-sensitive) so paths must match exactly.

const chynaVisemeMap = {
  CLOSED:    'CLOSED (BLINK).png',
  SILENCE:   'CLOSED (BLINK).png',
  SMILE:     'SMILE.png',
  CH_J_SH:   'CH, J, SH.png',
  EE:        'EE.png',
  OO:        'OO.png',
  TH:        'TH.png',
  AY:        'AY.png',
  AI:        'AI.png',
  OW:        'OW.png',
  OH:        'OH.png',
  B_P:       'B, P.png',
  M:         'M.png',
  D_T_N_K_G: 'D, T, N, K, G.png',
  F_V:       'F, V.png',
  L:         'L.png',
  R:         'R.png',
  S_Z:       'S, Z.png',
  W_Q:       'W, Q.png',
  Y:         'Y.png',
  A_I:       'A, I.png',
  E:         'E.png',
  O:         'O.png',
  U:         'U.png',
};

// Bee: identical to Chyna except SMILE → Smile.png, OO → oo.png
const beeVisemeMap = {
  ...chynaVisemeMap,
  SMILE:  'Smile.png',
  OO:     'oo.png',
  CLOSED: 'CLOSED (BLINK).png',
  SILENCE:'CLOSED (BLINK).png',
};

// Kiko: 'Closed (Blink).png', 'Smile.png', 'OO.png', 'o.png', 'u.png' (no AY, OO→OO.png exists, no U→u.png)
// Exact git files: A, I | AI | AY | B, P | CH, J, SH | Closed (Blink) | D, T, N, K, G |
//                  E | EE | F, V | L | M | OH | OO | OW | R | S, Z | Smile | TH | W, Q | Y | o | u
const kikoVisemeMap = {
  CLOSED:    'Closed (Blink).png',
  SILENCE:   'Closed (Blink).png',
  SMILE:     'Smile.png',
  CH_J_SH:   'CH, J, SH.png',
  EE:        'EE.png',
  OO:        'OO.png',
  TH:        'TH.png',
  AY:        'AY.png',
  AI:        'AI.png',
  OW:        'OW.png',
  OH:        'OH.png',
  B_P:       'B, P.png',
  M:         'M.png',
  D_T_N_K_G: 'D, T, N, K, G.png',
  F_V:       'F, V.png',
  L:         'L.png',
  R:         'R.png',
  S_Z:       'S, Z.png',
  W_Q:       'W, Q.png',
  Y:         'Y.png',
  A_I:       'A, I.png',
  E:         'E.png',
  O:         'o.png',
  U:         'u.png',
};

// Katsumi: CLOSED (BLINK).png | A, I | AI | Ay | B, P | CH, J, SH | D, T, N, K, G |
//          E | F, V | L | M | OH | OW | S, Z | W, Q | Y | ee | o | oo | r | smile | th | u
// Missing from git: AY (use Ay), EE (use ee), OO (use oo), R (use r), SMILE (use smile), TH (use th), U (use u), O (use o)
const katsumiVisemeMap = {
  CLOSED:    'CLOSED (BLINK).png',
  SILENCE:   'CLOSED (BLINK).png',
  SMILE:     'smile.png',
  CH_J_SH:   'CH, J, SH.png',
  EE:        'ee.png',
  OO:        'oo.png',
  TH:        'th.png',
  AY:        'Ay.png',
  AI:        'AI.png',
  OW:        'OW.png',
  OH:        'OH.png',
  B_P:       'B, P.png',
  M:         'M.png',
  D_T_N_K_G: 'D, T, N, K, G.png',
  F_V:       'F, V.png',
  L:         'L.png',
  R:         'r.png',
  S_Z:       'S, Z.png',
  W_Q:       'W, Q.png',
  Y:         'Y.png',
  A_I:       'A, I.png',
  E:         'E.png',
  O:         'o.png',
  U:         'u.png',
};

export const VISEME_MAP = {
  chyna:   chynaVisemeMap,
  bee:     beeVisemeMap,
  kiko:    kikoVisemeMap,
  katsumi: katsumiVisemeMap,
};

export const getLogicalViseme = (text, index) => {
  if (!text || index < 0 || index >= text.length) return 'CLOSED';
  const char = text[index].toLowerCase();
  const nextChar = index + 1 < text.length ? text[index + 1].toLowerCase() : '';
  const digraph = char + nextChar;

  // Digraphs
  if (['ch', 'sh'].includes(digraph)) return 'CH_J_SH';
  if (digraph === 'ee') return 'EE';
  if (digraph === 'oo') return 'OO';
  if (digraph === 'th') return 'TH';
  if (digraph === 'ay') return 'AY';
  if (digraph === 'ai') return 'AI';
  if (digraph === 'ow') return 'OW';
  if (digraph === 'oh') return 'OH';

  // Single characters
  if (['b', 'p'].includes(char)) return 'B_P';
  if (char === 'm') return 'M';
  if (['d', 't', 'n', 'k', 'g', 'c'].includes(char)) return 'D_T_N_K_G';
  if (['f', 'v'].includes(char)) return 'F_V';
  if (char === 'l') return 'L';
  if (char === 'r') return 'R';
  if (['s', 'z', 'x'].includes(char)) return 'S_Z';
  if (['w', 'q'].includes(char)) return 'W_Q';
  if (char === 'j') return 'CH_J_SH';
  if (char === 'y') return 'Y';
  if (['a', 'i'].includes(char)) return 'A_I';
  if (char === 'e') return 'E';
  if (char === 'o') return 'O';
  if (char === 'u') return 'U';

  // Punctuation / Spacing
  if ([' ', '.', ',', '!', '?'].includes(char)) return 'CLOSED';

  return 'CLOSED';
};

export const getVisemeFileForChar = (characterId, logicalKey) => {
  const map = VISEME_MAP[characterId] || VISEME_MAP.chyna;
  return map[logicalKey] || map.CLOSED;
};

export const getViseme = (text, index, characterId = 'chyna') => {
  const logicalKey = getLogicalViseme(text, index);
  return getVisemeFileForChar(characterId, logicalKey);
};

// Preload all viseme images for a character into browser memory cache
export const preloadCharacterVisemes = (characterId) => {
  const avatarConfig = CHAT_AVATARS[characterId];
  if (!avatarConfig) return;
  const baseUrl = import.meta.env.BASE_URL;

  // Preload idle image
  const idleImg = new Image();
  idleImg.src = encodeURI(`${baseUrl}${avatarConfig.idlePath}`);

  // Preload all viseme files
  const files = Object.values(VISEME_MAP[characterId] || {});
  const uniqueFiles = [...new Set(files)];
  uniqueFiles.forEach((file) => {
    const img = new Image();
    img.src = encodeURI(`${baseUrl}${avatarConfig.talkDir}/${file}`);
  });
};
