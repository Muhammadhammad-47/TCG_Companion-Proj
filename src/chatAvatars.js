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
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Sole',
    shortName: 'Bee',
    subtitle: 'Queen of the Hive',
    element: 'Lightning',
    icon: '🐝',
    quote: 'The hive always protects its own.',
    idlePath: 'Charcter Bee/Idle/Idle.png',
    talkDir: 'Charcter Bee/Talk',
    scale: 0.82,
    offsetY: '4px',
    themeColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #00f0ff, #ffd700, #ffaa00, #00f0ff)',
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko the Monkey',
    shortName: 'Kiko',
    subtitle: 'The Electric Prankster',
    element: 'Sonic / Lightning',
    icon: '⚡',
    quote: 'Too fast for you to catch!',
    idlePath: 'Charcter Kiko/Talk/Slince.png',
    talkDir: 'Charcter Kiko/Talk',
    scale: 0.72,
    offsetY: '0px',
    themeColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #00e5ff, #3d8bfd, #00ffaa, #00e5ff)',
  },
  katsumi: {
    id: 'katsumi',
    name: 'Katsumi',
    shortName: 'Katsumi',
    subtitle: 'Feline Blade Mistress',
    element: 'Shadow / Steel',
    icon: '🌸',
    quote: 'One strike, one truth.',
    idlePath: 'Chracter katsumi/Talk/silence.png',
    talkDir: 'Chracter katsumi/Talk',
    scale: 0.85,
    offsetY: '2px',
    themeColor: '#ff77a9',
    glowColor: 'rgba(255, 119, 169, 0.6)',
    ringGradient: 'conic-gradient(from 0deg, #ff77a9, #ff5500, #ff007f, #ff77a9)',
  },
};

export const VISEME_MAP = {
  chyna: {
    CLOSED: 'CLOSED (BLINK).png',
    SMILE: 'SMILE.png',
    SILENCE: 'CLOSED (BLINK).png',
    CH_J_SH: 'CH, J, SH.png',
    EE: 'EE.png',
    OO: 'OO.png',
    TH: 'TH.png',
    AY: 'AY.png',
    AI: 'AI.png',
    OW: 'OW.png',
    OH: 'OH.png',
    B_P: 'B, P.png',
    M: 'M.png',
    D_T_N_K_G: 'D, T, N, K, G.png',
    F_V: 'F, V.png',
    L: 'L.png',
    R: 'R.png',
    S_Z: 'S, Z.png',
    W_Q: 'W, Q.png',
    Y: 'Y.png',
    A_I: 'A, I.png',
    E: 'E.png',
    O: 'O.png',
    U: 'U.png',
  },
  bee: {
    CLOSED: 'Closed.png',
    SMILE: 'Smile.png',
    SILENCE: 'Silence.png',
    CH_J_SH: 'CH,J,SH.png',
    EE: 'EE.png',
    OO: 'oo.png',
    TH: 'T H.png',
    AY: 'AY.png',
    AI: 'AI.png',
    OW: 'OW.png',
    OH: 'OH.png',
    B_P: 'B,P.png',
    M: 'M,P.png',
    D_T_N_K_G: 'D,T,N,K,G.png',
    F_V: 'F,v.png',
    L: 'L.png',
    R: 'R.png',
    S_Z: 'S,Z.png',
    W_Q: 'W,Q.png',
    Y: 'Y.png',
    A_I: 'A,I.png',
    E: 'E.png',
    O: 'O.png',
    U: 'oo.png',
  },
  kiko: {
    CLOSED: 'Closed (Blink).png',
    SMILE: 'Smile.png',
    SILENCE: 'Slince.png',
    CH_J_SH: 'CH,J,Sh.png',
    EE: 'EE.png',
    OO: 'OO.png',
    TH: 'TH.png',
    AY: 'AY.png',
    AI: 'AI.png',
    OW: 'OW.png',
    OH: 'OH.png',
    B_P: 'B,P.png',
    M: 'M.png',
    D_T_N_K_G: 'DT,N,K,G.png',
    F_V: 'F,V.png',
    L: 'L.png',
    R: 'R.png',
    S_Z: 'S,Z.png',
    W_Q: 'W,Q.png',
    Y: 'Y.png',
    A_I: 'AI.png',
    E: 'E.png',
    O: 'o.png',
    U: 'u.png',
  },
  katsumi: {
    CLOSED: 'closed blink.png',
    SMILE: 'smile.png',
    SILENCE: 'silence.png',
    CH_J_SH: 'ch , j, sh.png',
    EE: 'ee.png',
    OO: 'oo.png',
    TH: 'th.png',
    AY: 'Ay.png',
    AI: 'A,I.png',
    OW: 'OW.png',
    OH: 'OH.png',
    B_P: 'b,p.png',
    M: 'M.png',
    D_T_N_K_G: 'D t n k g.png',
    F_V: 'f,v.png',
    L: 'L.png',
    R: 'r.png',
    S_Z: 's,z.png',
    W_Q: 'W q.png',
    Y: 'Y.png',
    A_I: 'A,I.png',
    E: 'E.png',
    O: 'o.png',
    U: 'u.png',
  },
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
  idleImg.src = `${baseUrl}${avatarConfig.idlePath}`;

  // Preload all viseme files
  const files = Object.values(VISEME_MAP[characterId] || {});
  files.forEach((file) => {
    const img = new Image();
    img.src = `${baseUrl}${avatarConfig.talkDir}/${file}`;
  });
};
