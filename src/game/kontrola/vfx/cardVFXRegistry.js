// ============================================================================
// KONTROLLA CARD VFX REGISTRY
// Complete registry covering ALL 60+ Action Cards, Character Moves & Scenarios
// (Replicating Unity Asset 355942 Palettes: _G, _B, _Y, _P, _R)
// ============================================================================

export const CARD_VFX_CONFIG = {
  // --------------------------------------------------------------------------
  // 1. ATTACKS, STRIKES & PHYSICAL COMBAT (Theme: Crimson _R / Purple _P)
  // --------------------------------------------------------------------------
  'ATTACK':                   { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ATTACK X1':                { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ATTACK X2':                { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: false },
  'ATTACK X2 (2ND HIT)':      { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: false },
  'BACK STAB':                { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DRAIN':                    { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'VAMPIRE LIFE STEAL':       { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'MISDIRECT':                { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ABANDON':                  { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },

  // --------------------------------------------------------------------------
  // 2. DEFENSES, SHIELDS, EVASIONS & COUNTERS (Theme: Blue _B / Gold _Y / Purple _P)
  // --------------------------------------------------------------------------
  'DEFENCE - BASIC':          { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DEFENCE BASIC':            { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DEFENCE - COUNTER':        { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DEFENCE COUNTER':          { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DEFENCE FULL GUARD':       { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },
  '+DEFENCE D5':              { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  '+DEFENCE D10':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  '+DEFENCE D15':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  '+DEFENCE D20':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE - BASIC':            { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE BASIC':              { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE - COUNTER':          { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DODGE COUNTER':            { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'BOOMERANG':                { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'BOOMERANG FULL':           { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'SHIELD BASIC':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SHIELD BASIC +25 HP':      { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SHIELD BASIC +25HP':       { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SHIELD FIRE + 50HP':       { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'SHIELD FIRE +50HP':        { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'SHIELD ADVANCE +100HP':    { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },
  'SHIELD SACRED PROTECTION': { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'RETREAT':                  { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },

  // --------------------------------------------------------------------------
  // 3. HEALING, CLEANSING & VITALITY (Theme: Green _G)
  // --------------------------------------------------------------------------
  'VITALITY GAIN V10':        { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY V10':             { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY GAIN V20':        { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY V20':             { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VITALITY GAIN V30':        { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VITALITY V30':             { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VITALITY GAIN V40':        { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VITALITY V40':             { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'HEAL H10':                 { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'HEAL H20':                 { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'HEAL H30':                 { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'HEAL H40':                 { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'HEAL CLEANSE+RESTORE':     { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'HEAL CLEANSE + RESTORE':   { theme: 'green',   rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'ANTIDOTE X1':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ANTIDOTE X2':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ANTIDOTE FULL':            { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },

  // --------------------------------------------------------------------------
  // 4. ELEMENTAL MAGIC (Fire, Freeze, Lightning, Poison, Sleep)
  // --------------------------------------------------------------------------
  'FIRE FLAME X1':            { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'FIRE FLAME X2':            { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: false },
  'FIRE INFERNO LOCK':        { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: true  },
  'FIRE FLAME INFERNO LOCK':  { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: true  },
  'FREEZE X1':                { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: false },
  'FREEZE X2':                { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'LIGHTNING X1':             { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: false },
  'LIGHTNING X2':             { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'POISON X1':                { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'POISON X2':                { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SLEEPY X1':                { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SLEEPY X2':                { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'ZOMBIE MODE':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'ZOMBIE':                   { theme: 'green',   rim: true, shock: false, sunlight: false, embers: true,  stars: false },

  // --------------------------------------------------------------------------
  // 5. TACTICAL, TIME & CELESTIAL SPECIALS (Theme: Gold _Y / Blue _B)
  // --------------------------------------------------------------------------
  'STABILITY CRYSTAL':        { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VISION X1':                { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VISION FULL':              { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'X-CHANGE X1':              { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'X-CHANGE FULL':            { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'TIME MACHINE':             { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'SOUL ALLIANCE':            { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'REVIVE':                   { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'KONTROL':                  { theme: 'purple',  rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },
  'SAIGO NO BLITZ':           { theme: 'crimson', rim: true, shock: true,  sunlight: true,  embers: true,  stars: true  },
  'BLITZ':                    { theme: 'crimson', rim: true, shock: true,  sunlight: true,  embers: true,  stars: true  },

  // --------------------------------------------------------------------------
  // 6. CHARACTER SIGNATURE MOVES (Theme matches character elemental affinity)
  // --------------------------------------------------------------------------
  // Chynaman (Fire / Lightning)
  'FIRE OF FURY PER PUNCH':   { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'FIRE TIGER SOUL PUNCH':    { theme: 'crimson', rim: true, shock: true,  sunlight: false, embers: true,  stars: true  },
  'GOLDEN MIC LIGHTING':      { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Bee (Lightning / Sonic Gold)
  'STING SLAP PER STING':     { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: false },
  'PAPARAZZI STUN':           { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'BEE DRONE BOMB':           { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Kiko (Sonic / Energy Gold)
  'TAIL WHIP PER WHIP':       { theme: 'gold',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'MULTIPLICITY':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'SOUL BLAST 3000':          { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Katsumi (Shadow / Dark Purple)
  'SAVAGE PAWS PER STRIKE':   { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SHADOW PURR':              { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'CLAW OF FATE':             { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },

  // Poochi (Magic Pink/Gold)
  'GLITTER SPARKS PER SPARK': { theme: 'gold',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'LASSO OF TRUTH':           { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'GLITTER BURST':            { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Queeny (Psychic / Empress Purple)
  'HAIR WHIP PER WHIP':       { theme: 'purple',  rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'SIREN BLAST':              { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'RAINBOW FAN BLAST':        { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Shroomy (Nature / Spore Green)
  'SPORE BURST':              { theme: 'green',   rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'MUSHROOM SHIELD':          { theme: 'green',   rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'ALCHEMICAL TOXIN':         { theme: 'green',   rim: true, shock: true,  sunlight: false, embers: true,  stars: true  },

  // --------------------------------------------------------------------------
  // 7. CHARACTER WILD CARDS / HERO PROFILES
  // --------------------------------------------------------------------------
  'CHYNAMAN':                 { theme: 'crimson', rim: true, shock: false, sunlight: false, embers: true,  stars: false },
  'BEE':                      { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'KIKO':                     { theme: 'gold',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'KATSUMI':                  { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: false },
  'POOCHI':                   { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'QUEENY':                   { theme: 'purple',  rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'SHROOMY':                  { theme: 'green',   rim: true, shock: false, sunlight: false, embers: true,  stars: false }
};

// Fallback resolver with intelligent fuzzy matching for any variant
export function getCardVFXConfig(cardName = '') {
  if (!cardName) return { theme: 'blue', rim: true, shock: false, sunlight: false, embers: false, stars: false };
  const upper = String(cardName).trim().toUpperCase();

  // 1. Direct map check
  if (CARD_VFX_CONFIG[upper]) return CARD_VFX_CONFIG[upper];

  // 2. Elemental Keyword Matching
  if (upper.includes('FIRE') || upper.includes('BLITZ') || upper.includes('CRIMSON') || upper.includes('ATTACK')) {
    return {
      theme: 'crimson',
      rim: true,
      shock: upper.includes('X2') || upper.includes('LOCK') || upper.includes('BLITZ'),
      sunlight: upper.includes('BLITZ'),
      embers: true,
      stars: upper.includes('LOCK') || upper.includes('BLITZ')
    };
  }

  if (upper.includes('VITALITY') || upper.includes('HEAL') || upper.includes('ANTIDOTE') || upper.includes('POISON') || upper.includes('SPORE') || upper.includes('TOXIN')) {
    return {
      theme: 'green',
      rim: true,
      shock: upper.includes('TOXIN'),
      sunlight: upper.includes('30') || upper.includes('40') || upper.includes('CLEANSE'),
      embers: upper.includes('POISON') || upper.includes('SPORE'),
      stars: upper.includes('30') || upper.includes('40') || upper.includes('CLEANSE')
    };
  }

  if (upper.includes('CRYSTAL') || upper.includes('GOLD') || upper.includes('SACRED') || upper.includes('REVIVE') || upper.includes('TIME MACHINE') || upper.includes('ALLIANCE') || upper.includes('GUARD')) {
    return {
      theme: 'gold',
      rim: true,
      shock: upper.includes('GUARD') || upper.includes('TIME'),
      sunlight: true,
      embers: false,
      stars: true
    };
  }

  if (upper.includes('BOOMERANG') || upper.includes('VAMPIRE') || upper.includes('DRAIN') || upper.includes('VOID') || upper.includes('SHADOW') || upper.includes('KONTROL') || upper.includes('PURR') || upper.includes('SLEEP')) {
    return {
      theme: 'purple',
      rim: true,
      shock: true,
      sunlight: upper.includes('KONTROL'),
      embers: false,
      stars: upper.includes('BOOMERANG') || upper.includes('KONTROL') || upper.includes('DRAIN')
    };
  }

  if (upper.includes('LIGHTNING') || upper.includes('FREEZE') || upper.includes('SHIELD') || upper.includes('DEFENCE') || upper.includes('DODGE') || upper.includes('COUNTER') || upper.includes('VISION')) {
    return {
      theme: 'blue',
      rim: true,
      shock: upper.includes('LIGHTNING') || upper.includes('FREEZE') || upper.includes('COUNTER'),
      sunlight: false,
      embers: false,
      stars: upper.includes('COUNTER') || upper.includes('VISION') || upper.includes('X2')
    };
  }

  // Fallback to cyber blue
  return { theme: 'blue', rim: true, shock: false, sunlight: false, embers: false, stars: false };
}
