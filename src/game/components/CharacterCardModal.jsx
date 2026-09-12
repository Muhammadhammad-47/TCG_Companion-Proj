import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Swords, Shield, Heart } from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';

export default function CharacterCardModal({ characterId, onClose }) {
  const charData = CHARACTERS[characterId] || CHARACTERS.chynaman;
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  const cardTypes = [
    { title: 'Main Profile', type: 'profile' },
    ...charData.moves.map(m => ({ title: m.name, type: 'move', data: m }))
  ];

  const handleNext = () => {
    soundFX.playMenuHover();
    setCurrentViewIndex((prev) => (prev + 1) % cardTypes.length);
  };

  const handlePrev = () => {
    soundFX.playMenuHover();
    setCurrentViewIndex((prev) => (prev - 1 + cardTypes.length) % cardTypes.length);
  };

  const currentCard = cardTypes[currentViewIndex];

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999999, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '380px', height: '560px',
          background: charData.bgGradient,
          border: `2px solid ${charData.themeColor}`,
          borderRadius: '20px',
          boxShadow: `0 20px 60px rgba(0,0,0,0.9), 0 0 40px ${charData.themeColor}40`,
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={20} />
        </button>

        {/* Card Header (Image) */}
        <div style={{ height: '220px', width: '100%', position: 'relative', borderBottom: `2px solid ${charData.themeColor}` }}>
          <img src={getAssetUrl(charData.image)} alt={charData.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '20px 16px 10px 16px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontFamily: 'Orbitron, sans-serif', textShadow: '2px 2px 4px #000' }}>{charData.name}</h2>
            <div style={{ color: charData.themeColor, fontSize: '0.85rem', fontWeight: 'bold' }}>{charData.title}</div>
          </div>
        </div>

        {/* Card Content Area */}
        <div style={{ flex: 1, padding: '20px 16px', color: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={handlePrev} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', color: '#a1a1aa' }}>
              {currentCard.title.toUpperCase()}
            </span>
            <button onClick={handleNext} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><ChevronRight size={20} /></button>
          </div>

          {currentCard.type === 'profile' ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}><Heart size={16} color="#ff3366" style={{marginBottom:'4px'}}/><div style={{fontSize:'0.75rem', color:'#a1a1aa'}}>HP</div><div style={{fontWeight:'bold'}}>{charData.maxHP}</div></div>
                <div style={{ textAlign: 'center' }}><Shield size={16} color="#00f0ff" style={{marginBottom:'4px'}}/><div style={{fontSize:'0.75rem', color:'#a1a1aa'}}>DEF DP</div><div style={{fontWeight:'bold'}}>{charData.defaultDP}</div></div>
                <div style={{ textAlign: 'center' }}><Swords size={16} color="#ffd700" style={{marginBottom:'4px'}}/><div style={{fontSize:'0.75rem', color:'#a1a1aa'}}>MIND</div><div style={{fontWeight:'bold'}}>{charData.mindStrength}</div></div>
              </div>
              
              <div style={{ marginBottom: '12px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: charData.themeColor, fontWeight: 'bold', marginBottom: '4px' }}>WEAKNESS</div>
                <div style={{ fontSize: '0.9rem' }}>{charData.weakness.icon} {charData.weakness.type} (+{charData.weakness.bonusAP} AP)</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: charData.themeColor, fontWeight: 'bold', marginBottom: '4px' }}>TRAITS</div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                  {charData.traits.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: `1px solid ${currentCard.data.isSuper ? '#ffd700' : 'rgba(255,255,255,0.1)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: currentCard.data.isSuper ? '#ffd700' : '#fff' }}>{currentCard.data.name}</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>⚡ {currentCard.data.costET} ET</span>
                </div>
                {currentCard.data.isSuper && <div style={{ fontSize: '0.7rem', color: '#ffd700', marginBottom: '8px', fontWeight: 'bold' }}>SUPER ATTACK</div>}
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.85rem' }}>
                  {currentCard.data.baseAP && <div><strong>AP:</strong> {currentCard.data.baseAP}</div>}
                  {currentCard.data.multiplier && <div><strong>Hits:</strong> Roll 1 Die × {currentCard.data.multiplier}</div>}
                  {currentCard.data.element && <div><strong>Type:</strong> {currentCard.data.element}</div>}
                </div>
                
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                  {currentCard.data.desc}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Pagination Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '16px' }}>
          {cardTypes.map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentViewIndex ? charData.themeColor : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
