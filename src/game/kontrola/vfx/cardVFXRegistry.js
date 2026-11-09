// ============================================================================
// KONTROLLA CARD VFX REGISTRY
// Maps all 50+ Action & Creature Cards to their VFX Theme & Layers
// (Matching Unity Asset 355942 Palettes: _G, _B, _Y, _P, _R)
// ============================================================================

export const CARD_VFX_CONFIG = {
  // ATTACKS & STRIKES (Theme: Crimson _R)
  'ATTACK':                { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ATTACK X1':             { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ATTACK X2':             { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: false },
  'ATTACK X2 (2ND HIT)':   { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: false },
  'BACK STAB':             { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },

  // DEFENSES, COUNTERS & SHIELDS (Theme: Blue _B or Purple _P)
  'DEFENCE - BASIC':       { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DEFENCE BASIC':         { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DEFENCE - COUNTER':     { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DEFENCE COUNTER':       { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DEFENCE FULL GUARD':    { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },
  '+DEFENCE D5':           { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  '+DEFENCE D10':          { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  '+DEFENCE D15':          { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  '+DEFENCE D20':          { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE - BASIC':         { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE BASIC':           { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE - COUNTER':       { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DODGE COUNTER':         { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'BOOMERANG':             { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'BOOMERANG FULL':        { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'SHIELD BASIC':          { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SHIELD BASIC +25HP':    { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SHIELD FIRE +50HP':     { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'SHIELD ADVANCE +100HP': { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },
  'SHIELD SACRED PROTECTION': { theme: 'gold', rim: true, shock: false, sunlight: true,  embers: false, stars: true  },

  // HEALING & VITALITY GAINS (Theme: Green _G)
  'VITALITY GAIN V10':     { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY V10':          { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY GAIN V20':     { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY V20':          { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY GAIN V30':     { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VITALITY V30':          { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VITALITY V40':          { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'HEAL H10':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'HEAL H20':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'HEAL H30':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'HEAL H40':              { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'HEAL CLEANSE + RESTORE': { theme: 'green',  rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'ANTIDOTE X1':           { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ANTIDOTE X2':           { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ANTIDOTE FULL':         { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },

  // ELEMENTAL MAGIC (Fire, Freeze, Lightning, Poison, Sleep)
  'FIRE FLAME X1':         { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'FIRE FLAME X2':         { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: false },
  'FIRE FLAME INFERNO LOCK': { theme: 'crimson', rim: true, shock: true, sunlight: false, embers: true, stars: true },
  'FREEZE X1':             { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: false },
  'FREEZE X2':             { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'LIGHTNING X1':          { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: false },
  'LIGHTNING X2':          { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'POISON X1':             { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'POISON X2':             { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SLEEPY X1':             { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SLEEPY X2':             { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },

  // LEECH & DARK (Theme: Purple _P)
  'DRAIN':                 { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VAMPIRE LIFE STEAL':    { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'ZOMBIE MODE':           { theme: 'green',   rim: true, shock: false, sunlight: false, embers: true,  stars: false },

  // TACTICAL & SPECIAL (Theme: Gold _Y or Blue _B)
  'STABILITY CRYSTAL':     { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VISION X1':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VISION FULL':           { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'TIME MACHINE':          { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'SOUL ALLIANCE':         { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'REVIVE':                { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'RETREAT':               { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'MISDIRECT':             { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ABANDON':               { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false }
};

// Fallback resolver for any card name
export function getCardVFXConfig(cardName = '') {
  if (!cardName) return { theme: 'blue', rim: true, shock: false, sunlight: false, embers: false, stars: false };
  const upper = String(cardName).trim().toUpperCase();

  // Direct map check
  if (CARD_VFX_CONFIG[upper]) return CARD_VFX_CONFIG[upper];

  // Prefix & keyword fuzzy matches
  if (upper.includes('FIRE') || upper.includes('ATTACK')) {
    return { theme: 'crimson', rim: true, shock: upper.includes('X2'), sunlight: false, embers: true, stars: false };
  }
  if (upper.includes('VITALITY') || upper.includes('HEAL') || upper.includes('ANTIDOTE')) {
    return { theme: 'green', rim: true, shock: false, sunlight: upper.includes('30') || upper.includes('40'), embers: false, stars: false };
  }
  if (upper.includes('CRYSTAL') || upper.includes('GOLD') || upper.includes('SACRED') || upper.includes('REVIVE')) {
    return { theme: 'gold', rim: true, shock: false, sunlight: true, embers: false, stars: true };
  }
  if (upper.includes('BOOMERANG') || upper.includes('VAMPIRE') || upper.includes('DRAIN') || upper.includes('VOID') || upper.includes('SHADOW') || upper.includes('KONTROL')) {
    return { theme: 'purple', rim: true, shock: true, sunlight: false, embers: false, stars: false };
  }
  if (upper.includes('LIGHTNING') || upper.includes('SHOCK')) {
    return { theme: 'blue', rim: true, shock: true, sunlight: false, embers: false, stars: true };
  }

  // Default to cyber blue
  return { theme: 'blue', rim: true, shock: false, sunlight: false, embers: false, stars: false };
}
