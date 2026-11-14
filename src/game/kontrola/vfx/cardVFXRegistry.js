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
  'BACK STAB':                { theme: 'void',    rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },
  'DRAIN':                    { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'VAMPIRE LIFE STEAL':       { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'MISDIRECT':                { theme: 'void',    rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },
  'ABANDON':                  { theme: 'void',    rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },

  // --------------------------------------------------------------------------
  // 2. DEFENSES, SHIELDS, EVASIONS & COUNTERS (Theme: Shield Hex / Ice / Void)
  // --------------------------------------------------------------------------
  'DEFENCE - BASIC':          { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  'DEFENCE BASIC':            { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  'DEFENCE - COUNTER':        { theme: 'shield',  rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isShield: true, hexBarrier: true },
  'DEFENCE COUNTER':          { theme: 'shield',  rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isShield: true, hexBarrier: true },
  'DEFENCE FULL GUARD':       { theme: 'shield',  rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isShield: true, hexBarrier: true },
  '+DEFENCE D5':              { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  '+DEFENCE D10':             { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  '+DEFENCE D15':             { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  '+DEFENCE D20':             { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  'DODGE - BASIC':            { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE BASIC':              { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'DODGE - COUNTER':          { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'DODGE COUNTER':            { theme: 'blue',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'BOOMERANG':                { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'BOOMERANG FULL':           { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'SHIELD BASIC':             { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  'SHIELD BASIC +25 HP':      { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  'SHIELD BASIC +25HP':       { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: false, isShield: true, hexBarrier: true },
  'SHIELD FIRE + 50HP':       { theme: 'fire',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isFire: true,   flames: true },
  'SHIELD FIRE +50HP':        { theme: 'fire',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isFire: true,   flames: true },
  'SHIELD ADVANCE +100HP':    { theme: 'shield',  rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isShield: true, hexBarrier: true },
  'SHIELD SACRED PROTECTION': { theme: 'shield',  rim: true, shock: false, sunlight: true,  embers: false, stars: true,  isShield: true, hexBarrier: true },
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
  'FIRE FLAME X1':            { theme: 'fire',      rim: true, shock: false, sunlight: false, embers: true,  stars: false, isFire: true,      flames: true },
  'FIRE FLAME X2':            { theme: 'fire',      rim: true, shock: true,  sunlight: false, embers: true,  stars: false, isFire: true,      flames: true },
  'FIRE INFERNO LOCK':        { theme: 'fire',      rim: true, shock: true,  sunlight: false, embers: true,  stars: true,  isFire: true,      flames: true },
  'FIRE FLAME INFERNO LOCK':  { theme: 'fire',      rim: true, shock: true,  sunlight: false, embers: true,  stars: true,  isFire: true,      flames: true },
  'FREEZE X1':                { theme: 'ice',       rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isIce: true,        frost: true, crystals: true },
  'FREEZE X2':                { theme: 'ice',       rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isIce: true,        frost: true, crystals: true },
  'LIGHTNING X1':             { theme: 'lightning', rim: true, shock: true,  sunlight: false, embers: false, stars: false, isLightning: true, lightningArcs: true },
  'LIGHTNING X2':             { theme: 'lightning', rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isLightning: true, lightningArcs: true },
  'POISON X1':                { theme: 'poison',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isPoison: true,    smoke: true },
  'POISON X2':                { theme: 'poison',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isPoison: true,    smoke: true },
  'SLEEPY X1':                { theme: 'void',      rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true,      shadowTendrils: true },
  'SLEEPY X2':                { theme: 'void',      rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true,      shadowTendrils: true },
  'ZOMBIE MODE':              { theme: 'poison',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isPoison: true,    smoke: true },
  'ZOMBIE':                   { theme: 'poison',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isPoison: true,    smoke: true },

  // --------------------------------------------------------------------------
  // 5. TACTICAL, TIME & CELESTIAL SPECIALS (Theme: Gold _Y / Blue _B)
  // --------------------------------------------------------------------------
  'STABILITY CRYSTAL':        { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'VISION X1':                { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'VISION FULL':              { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'X-CHANGE X1':              { theme: 'void',    rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },
  'X-CHANGE FULL':            { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'TIME MACHINE':             { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'SOUL ALLIANCE':            { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'REVIVE':                   { theme: 'gold',    rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'KONTROL':                  { theme: 'void',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'SAIGO NO BLITZ':           { theme: 'crimson', rim: true, shock: true,  sunlight: true,  embers: true,  stars: true  },
  'BLITZ':                    { theme: 'crimson', rim: true, shock: true,  sunlight: true,  embers: true,  stars: true  },

  // --------------------------------------------------------------------------
  // 6. CHARACTER SIGNATURE MOVES (Theme matches character elemental affinity)
  // --------------------------------------------------------------------------
  // Chynaman (Fire)
  'FIRE OF FURY PER PUNCH':   { theme: 'fire',      rim: true, shock: false, sunlight: false, embers: true,  stars: false, isFire: true,      flames: true },
  'FIRE TIGER SOUL PUNCH':    { theme: 'fire',      rim: true, shock: true,  sunlight: false, embers: true,  stars: true,  isFire: true,      flames: true },
  'GOLDEN MIC LIGHTING':      { theme: 'lightning', rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isLightning: true, lightningArcs: true },
  'GOLDEN MIC LIGHTNING':     { theme: 'lightning', rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isLightning: true, lightningArcs: true },

  // Bee (Lightning / Sonic Gold)
  'STING SLAP PER STING':     { theme: 'lightning', rim: true, shock: true,  sunlight: false, embers: false, stars: false, isLightning: true, lightningArcs: true },
  'PAPARAZZI STUN':           { theme: 'lightning', rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isLightning: true, lightningArcs: true },
  'BEE DRONE BOMB':           { theme: 'lightning', rim: true, shock: true,  sunlight: true,  embers: false, stars: true,  isLightning: true, lightningArcs: true },

  // Kiko (Sonic / Energy Gold)
  'TAIL WHIP PER WHIP':       { theme: 'gold',    rim: true, shock: false, sunlight: false, embers: false, stars: false },
  'MULTIPLICITY':             { theme: 'blue',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'SOUL BLAST 3000':          { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Katsumi (Shadow / Void / Toxic)
  'SAVAGE PAWS PER STRIKE':   { theme: 'void',    rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },
  'SHADOW PURR':              { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'CLAW OF FATE':             { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },

  // Poochi (Magic Pink/Gold)
  'GLITTER SPARKS PER SPARK': { theme: 'gold',    rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'LASSO OF TRUTH':           { theme: 'gold',    rim: true, shock: true,  sunlight: false, embers: false, stars: true  },
  'GLITTER BURST':            { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Queeny (Psychic / Empress Void)
  'HAIR WHIP PER WHIP':       { theme: 'void',    rim: true, shock: false, sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },
  'SIREN BLAST':              { theme: 'void',    rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'RAINBOW FAN BLAST':        { theme: 'gold',    rim: true, shock: true,  sunlight: true,  embers: false, stars: true  },

  // Shroomy (Nature / Spore Green / Toxic / Shield)
  'SPORE BURST':              { theme: 'poison',  rim: true, shock: false, sunlight: false, embers: true,  stars: false, isPoison: true, smoke: true },
  'MUSHROOM SHIELD':          { theme: 'shield',  rim: true, shock: false, sunlight: false, embers: false, stars: true,  isShield: true, hexBarrier: true },
  'ALCHEMICAL TOXIN':         { theme: 'poison',  rim: true, shock: true,  sunlight: false, embers: true,  stars: true,  isPoison: true, smoke: true },
  'VENOM STRIKE':             { theme: 'poison',  rim: true, shock: true,  sunlight: false, embers: true,  stars: false, isPoison: true, smoke: true },

  // --------------------------------------------------------------------------
  // 7. CHARACTER WILD CARDS / HERO PROFILES
  // --------------------------------------------------------------------------
  'CHYNAMAN':                 { theme: 'fire',      rim: true, shock: false, sunlight: false, embers: true,  stars: false, isFire: true,      flames: true },
  'BEE':                      { theme: 'lightning', rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isLightning: true, lightningArcs: true },
  'KIKO':                     { theme: 'gold',      rim: true, shock: false, sunlight: false, embers: false, stars: true  },
  'KATSUMI':                  { theme: 'void',      rim: true, shock: true,  sunlight: false, embers: false, stars: false, isVoid: true, shadowTendrils: true },
  'POOCHI':                   { theme: 'gold',      rim: true, shock: false, sunlight: true,  embers: false, stars: true  },
  'QUEENY':                   { theme: 'void',      rim: true, shock: true,  sunlight: false, embers: false, stars: true,  isVoid: true, shadowTendrils: true },
  'SHROOMY':                  { theme: 'poison',    rim: true, shock: false, sunlight: false, embers: true,  stars: false, isPoison: true,    smoke: true }
};

// Fallback resolver with intelligent fuzzy matching for any variant
export function getCardVFXConfig(cardName = '') {
  if (!cardName) return { theme: 'blue', rim: true, shock: false, sunlight: false, embers: false, stars: false };
  const upper = String(cardName).trim().toUpperCase();

  // 1. Direct map check
  if (CARD_VFX_CONFIG[upper]) return CARD_VFX_CONFIG[upper];

  // 2. Dedicated Elemental Matchers

  // Fire / Burning FX
  if (upper.includes('FIRE') || upper.includes('FLAME') || upper.includes('INFERNO') || upper.includes('BURN') || upper.includes('BLITZ')) {
    return {
      theme: 'fire',
      rim: true,
      shock: upper.includes('X2') || upper.includes('LOCK') || upper.includes('BLITZ'),
      sunlight: upper.includes('BLITZ'),
      embers: true,
      stars: upper.includes('LOCK') || upper.includes('BLITZ'),
      isFire: true,
      flames: true
    };
  }

  // Lightning / Electric Shock FX
  if (upper.includes('LIGHTNING') || upper.includes('STING SLAP') || upper.includes('STUN') || upper.includes('THUNDER') || upper.includes('ELECTRIC') || upper.includes('MIC LIGHT') || upper.includes('DRONE BOMB')) {
    return {
      theme: 'lightning',
      rim: true,
      shock: true,
      sunlight: upper.includes('X2') || upper.includes('BOMB') || upper.includes('MIC'),
      embers: false,
      stars: true,
      isLightning: true,
      lightningArcs: true
    };
  }

  // Poison / Toxic Smoke / Zombie FX
  if (upper.includes('POISON') || upper.includes('VENOM') || upper.includes('TOXIN') || upper.includes('SPORE') || upper.includes('ZOMBIE') || upper.includes('ACID')) {
    return {
      theme: 'poison',
      rim: true,
      shock: upper.includes('TOXIN') || upper.includes('VENOM') || upper.includes('X2'),
      sunlight: false,
      embers: true,
      stars: upper.includes('TOXIN'),
      isPoison: true,
      smoke: true
    };
  }

  // Healing / Vitality Green (Clean nature/emerald, NOT toxic smoke)
  if (upper.includes('VITALITY') || upper.includes('HEAL') || upper.includes('ANTIDOTE') || upper.includes('CLEANSE')) {
    return {
      theme: 'green',
      rim: true,
      shock: false,
      sunlight: upper.includes('30') || upper.includes('40') || upper.includes('CLEANSE') || upper.includes('FULL'),
      embers: false,
      stars: upper.includes('30') || upper.includes('40') || upper.includes('CLEANSE') || upper.includes('FULL')
    };
  }

  // Attack / Crimson Strike
  if (upper.includes('ATTACK') || upper.includes('CRIMSON') || upper.includes('STRIKE')) {
    return {
      theme: 'crimson',
      rim: true,
      shock: upper.includes('X2') || upper.includes('2ND'),
      sunlight: false,
      embers: upper.includes('X2'),
      stars: false
    };
  }

  // Ice / Freeze / Frost FX
  if (upper.includes('FREEZE') || upper.includes('ICE') || upper.includes('FROST') || upper.includes('CHILL') || upper.includes('BLIZZARD')) {
    return {
      theme: 'ice',
      rim: true,
      shock: upper.includes('X2'),
      sunlight: false,
      embers: false,
      stars: true,
      isIce: true,
      frost: true,
      crystals: true
    };
  }

  // Shield & Defensive Barrier FX
  if (upper.includes('SHIELD') || upper.includes('DEFENCE') || upper.includes('DEFENSE') || upper.includes('GUARD') || upper.includes('BARRIER') || upper.includes('+DEFENCE')) {
    return {
      theme: 'shield',
      rim: true,
      shock: upper.includes('COUNTER') || upper.includes('ADVANCE') || upper.includes('GUARD'),
      sunlight: upper.includes('ADVANCE') || upper.includes('SACRED') || upper.includes('FULL'),
      embers: false,
      stars: upper.includes('COUNTER') || upper.includes('ADVANCE') || upper.includes('SACRED') || upper.includes('FULL'),
      isShield: true,
      hexBarrier: true
    };
  }

  // Void / Shadow / Vampire / Kontrol FX
  if (upper.includes('BOOMERANG') || upper.includes('VAMPIRE') || upper.includes('DRAIN') || upper.includes('VOID') || upper.includes('SHADOW') || upper.includes('KONTROL') || upper.includes('PURR') || upper.includes('SLEEP') || upper.includes('BACK STAB') || upper.includes('MISDIRECT') || upper.includes('ABANDON')) {
    return {
      theme: 'void',
      rim: true,
      shock: true,
      sunlight: upper.includes('KONTROL'),
      embers: false,
      stars: upper.includes('BOOMERANG') || upper.includes('KONTROL') || upper.includes('DRAIN'),
      isVoid: true,
      shadowTendrils: true
    };
  }

  // Gold / Celestial Specials
  if (upper.includes('CRYSTAL') || upper.includes('GOLD') || upper.includes('SACRED') || upper.includes('REVIVE') || upper.includes('TIME MACHINE') || upper.includes('ALLIANCE')) {
    return {
      theme: 'gold',
      rim: true,
      shock: upper.includes('TIME'),
      sunlight: true,
      embers: false,
      stars: true,
      isCelestial: true
    };
  }

  // Blue / Mobility / Vision / Dodge / Retreat
  if (upper.includes('DODGE') || upper.includes('RETREAT') || upper.includes('VISION')) {
    return {
      theme: 'blue',
      rim: true,
      shock: upper.includes('COUNTER'),
      sunlight: false,
      embers: false,
      stars: upper.includes('COUNTER') || upper.includes('VISION')
    };
  }

  // Fallback to cyber blue
  return { theme: 'blue', rim: true, shock: false, sunlight: false, embers: false, stars: false };
}
