import React from 'react';
import { getCardVFXConfig } from './cardVFXRegistry';

/**
 * CardVFXWrapper
 * Wraps any card image or container with authentic Unity Asset 355942 CSS/SVG effects.
 *
 * @param {string} cardName - Used to resolve elemental theme & effect layers
 * @param {string} themeOverride - 'green' | 'blue' | 'gold' | 'purple' | 'crimson'
 * @param {boolean} isSelected - Triggers active laser rim & holographic foil sheen
 * @param {boolean} isOvercharged - Accelerates rim spin for dice rolls and clash buildup
 * @param {boolean} isDissolving - Plays burning disintegration animation
 * @param {boolean} showSunlight - Forces radiant celestial god rays
 * @param {boolean} showShock - Forces crackling electric lightning border
 * @param {boolean} showEmbers - Forces rising flame embers
 * @param {boolean} showStars - Forces corner star flares
 */
export default function CardVFXWrapper({
  cardName = '',
  themeOverride = null,
  isSelected = false,
  isOvercharged = false,
  isDissolving = false,
  showSunlight = false,
  showShock = false,
  showEmbers = false,
  showStars = false,
  className = '',
  style = {},
  onClick,
  children
}) {
  const config = getCardVFXConfig(cardName);
  const theme = themeOverride || config.theme || 'blue';

  const hasRim = config.rim !== false;
  const hasSunlight = showSunlight || config.sunlight;
  const hasShock = showShock || config.shock;
  const hasEmbers = showEmbers || config.embers;
  const hasStars = showStars || config.stars;

  const containerClasses = [
    'card-fx-container',
    `fx-theme-${theme}`,
    hasRim ? 'fx-rim-line' : '',
    hasSunlight ? 'fx-sunlight' : '',
    hasShock ? 'fx-shock' : '',
    isOvercharged ? 'fx-overcharge' : '',
    isSelected ? 'selected active' : '',
    isDissolving ? 'fx-dissolve-active' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      style={style}
      onClick={onClick}
    >
      {/* Layer 1: Corner Star Flares */}
      {hasStars && (
        <>
          <span className="fx-star-flare fx-star-top-left" />
          <span className="fx-star-top-right" />
        </>
      )}

      {/* Layer 2: Floating Ember Particles */}
      {hasEmbers && (
        <div className="fx-embers-container">
          <span className="fx-ember" />
          <span className="fx-ember" />
          <span className="fx-ember" />
          <span className="fx-ember" />
        </div>
      )}

      {/* Layer 3: Card Content & Art */}
      {children}

      {/* Layer 4: Holographic Foil Sheen Sweep */}
      <div className="fx-foil-sweep" />
    </div>
  );
}
