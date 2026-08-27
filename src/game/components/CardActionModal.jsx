import React, { useState } from 'react';
import { ACTION_CARDS } from '../data/cards';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { X, Zap, Shield, Sparkles, Flame, Brain, Skull, Heart, Swords, Target, Play } from 'lucide-react';

export default function CardActionModal({
  activePlayer,
  allPlayers,
  onClose,
  onInitiateCombat,
  onApplyInstantEffect,
  onOpenKontrol,
  onOpenBlitz,
  onOpenRetreat
}) {
  const [selectedActionId, setSelectedActionId] = useState('atk_basic');
  const [selectedMoveId, setSelectedMoveId] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState(
    allPlayers.find(p => p.id !== activePlayer.id)?.id || ''
  );
  const [amplifyChoice, setAmplifyChoice] = useState('hp'); // 'hp' | 'ap' | 'dp'

  const isZombie = activePlayer.isZombie;
  const char = isZombie ? ZOMBIE_PROFILE : (CHARACTERS[activePlayer.characterId] || CHARACTERS.chynaman);
  const availableMoves = isZombie ? ZOMBIE_PROFILE.moves : char.moves;

  const currentAction = ACTION_CARDS.find(c => c.id === selectedActionId);
  const currentMove = availableMoves.find(m => m.id === selectedMoveId) || availableMoves[0];

  const isAttackPlay = currentAction?.category === 'Attack' || isZombie;
  const totalETCost = (currentAction?.costET || 0) + (isAttackPlay ? (currentMove?.costET || 0) : 0);

  const selectableTargets = allPlayers.filter(p => {
    if (p.isDefeated) return false;
    if (currentAction?.id === 'poison_card') return true;
    return p.id !== activePlayer.id;
  });

  const handleActionClick = (card) => {
    soundFX.playCard();
    setSelectedActionId(card.id);

    if (card.id === 'kontrol_card' && (activePlayer.kontrolUsesLeft ?? 2) <= 0) {
      alert('No Kontrol uses left this match.');
      return;
    }
    if (card.id === 'blitz_card' && (activePlayer.blitzUsesLeft ?? 2) <= 0) {
      alert('No Blitz uses left this match.');
      return;
    }
    if (card.id === 'retreat_card' && activePlayer.retreatedThisTurn) {
      alert('Already retreated this turn.');
      return;
    }

    if (card.id === 'kontrol_card') {
      onOpenKontrol(activePlayer, targetPlayerId);
      return;
    }
    if (card.id === 'blitz_card') {
      onOpenBlitz(activePlayer);
      return;
    }
    if (card.id === 'retreat_card') {
      onOpenRetreat(activePlayer);
      return;
    }
  };

  const handleConfirmAction = () => {
    if (!currentAction) return;

    if (activePlayer.energyTokens < totalETCost) {
      alert(`Need ${totalETCost} ET — you have ${activePlayer.energyTokens} ET.`);
      return;
    }

    const targetPlayer = selectableTargets.find(p => p.id === targetPlayerId)
      || selectableTargets.find(p => p.id !== activePlayer.id)
      || selectableTargets[0];

    // Handle Attacks
    if (currentAction.category === 'Attack' || isZombie) {
      if (!targetPlayer) {
        alert('Please pick a target opponent.');
        return;
      }
      onInitiateCombat({
        attacker: activePlayer,
        defender: targetPlayer,
        actionCard: currentAction,
        characterMove: currentMove,
        amplifyBonus: amplifyChoice === 'ap' ? 20 : 0
      });
      return;
    }

    // Handle Poison
    if (currentAction.id === 'poison_card') {
      if (!targetPlayer) {
        alert('Please pick a target opponent.');
        return;
      }
      onApplyInstantEffect({
        type: 'poison',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        amount: 1
      });
      return;
    }

    // Handle Antidote
    if (currentAction.id === 'antidote_card') {
      onApplyInstantEffect({
        type: 'antidote',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        costET: currentAction.costET
      });
      return;
    }

    // Handle Heal
    if (currentAction.id === 'heal_card') {
      onApplyInstantEffect({
        type: 'heal',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        costET: currentAction.costET,
        amount: 30
      });
      return;
    }

    // Handle Shield
    if (currentAction.id === 'shield_card') {
      onApplyInstantEffect({
        type: 'shield',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        costET: currentAction.costET,
        amount: 30
      });
      return;
    }

    // Handle Amplify
    if (currentAction.id === 'amplify_card') {
      onApplyInstantEffect({
        type: 'amplify',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        amplifyChoice,
        costET: 0
      });
      return;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0d1b38 0%, #060e20 100%)',
          border: '1.5px solid rgba(0, 240, 255, 0.5)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(0, 240, 255, 0.25)',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--neon-cyan)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={getAssetUrl(char.image || 'characters/chynaman.png')}
                alt={char.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', letterSpacing: '1px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                TACTICAL COMBAT PLAY
              </span>
              <h2 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', fontFamily: 'Orbitron, sans-serif' }}>
                {activePlayer.name} · PLAY ACTION CARD
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '16px',
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Left Column: 10 Action Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>1. CHOOSE ACTION CARD</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '10px',
                maxHeight: '480px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}
            >
              {ACTION_CARDS.map(card => {
                const isSelected = selectedActionId === card.id;
                const disabledForZombie = isZombie && (card.id === 'kontrol_card' || card.id === 'blitz_card');

                return (
                  <div
                    key={card.id}
                    onClick={() => !disabledForZombie && handleActionClick(card)}
                    style={{
                      background: isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? `2px solid ${card.color || 'var(--neon-cyan)'}` : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: disabledForZombie ? 'not-allowed' : 'pointer',
                      opacity: disabledForZombie ? 0.4 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 15px rgba(0, 240, 255, 0.3)` : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.3rem' }}>{card.icon}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(255, 215, 0, 0.15)',
                          border: '1px solid #ffd700',
                          color: '#ffd700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Zap size={10} fill="#ffd700" /> {card.costET} ET
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.92rem', color: isSelected ? '#fff' : '#e0e0e0', marginTop: '4px' }}>
                      {card.name}
                    </strong>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.3' }}>
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Techniques & Target Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Amplify Choices */}
            {selectedActionId === 'amplify_card' && (
              <div style={{ background: 'rgba(255, 176, 46, 0.1)', border: '1px solid #ffb02e', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: '#ffb02e', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> CHOOSE AMPLIFY BONUS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'hp', label: '💖 +20 HP', sub: 'Heal' },
                    { id: 'ap', label: '⚔️ +20 AP', sub: 'Attack' },
                    { id: 'dp', label: '🛡️ +10 DP', sub: 'Armor' }
                  ].map(amp => (
                    <button
                      key={amp.id}
                      onClick={() => setAmplifyChoice(amp.id)}
                      style={{
                        background: amplifyChoice === amp.id ? '#ffb02e' : 'rgba(255,255,255,0.06)',
                        color: amplifyChoice === amp.id ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.82rem',
                        textAlign: 'center'
                      }}
                    >
                      <div>{amp.label}</div>
                      <small style={{ fontSize: '0.68rem', opacity: 0.8 }}>{amp.sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Character Move Selection (For Attacks) */}
            {(currentAction?.category === 'Attack' || isZombie) && (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--neon-pink)', fontWeight: 'bold', marginBottom: '8px' }}>
                  2. PAIR WARRIOR TECHNIQUE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableMoves.map(move => {
                    const isMoveSelected = (selectedMoveId || availableMoves[0].id) === move.id;
                    const isMult = move.type === 'dice_mult';

                    return (
                      <div
                        key={move.id}
                        onClick={() => {
                          soundFX.playCard();
                          setSelectedMoveId(move.id);
                        }}
                        style={{
                          background: isMoveSelected ? 'rgba(255, 51, 102, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: isMoveSelected ? '1.5px solid #ff3366' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{move.name}</strong>
                          <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                            {move.desc || `${move.baseAP || 25} AP technique`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.82rem', color: '#ff3366', fontWeight: 'bold' }}>
                            {isMult ? `🎲 × ${move.multiplier} AP` : `${move.baseAP} AP`}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#ffd700' }}>Cost: {move.costET || 0} ET</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Opponent Selection */}
            {(currentAction?.category === 'Attack' || currentAction?.id === 'poison_card' || isZombie) && (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--neon-gold)', fontWeight: 'bold', marginBottom: '8px' }}>
                  3. SELECT TARGET OPPONENT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {selectableTargets.map(target => {
                    const tChar = target.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[target.characterId] || CHARACTERS.chynaman);
                    const isTargetSelected = targetPlayerId === target.id;

                    return (
                      <div
                        key={target.id}
                        onClick={() => {
                          soundFX.playCard();
                          setTargetPlayerId(target.id);
                        }}
                        style={{
                          background: isTargetSelected ? 'rgba(255, 215, 0, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: isTargetSelected ? '1.5px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                          <img
                            src={getAssetUrl(tChar.image || 'characters/chynaman.png')}
                            alt={target.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block' }}>{target.name}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)' }}>{target.hp} HP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Cost & Execute CTA */}
            <div
              style={{
                marginTop: 'auto',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={20} fill="#ffd700" color="#ffd700" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>TOTAL ENERGY COST</div>
                  <strong style={{ fontSize: '1.1rem', color: '#ffd700' }}>
                    {totalETCost} ET <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'normal' }}>({activePlayer.energyTokens} Available)</span>
                  </strong>
                </div>
              </div>

              <button
                onClick={handleConfirmAction}
                style={{
                  background: 'linear-gradient(90deg, #00f0ff, #0077ff)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
                }}
              >
                <Play size={16} fill="#000" />
                <span>CONFIRM & GO</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
