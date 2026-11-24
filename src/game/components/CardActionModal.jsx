import React, { useState } from 'react';
import { ACTION_CARDS } from '../data/cards';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { ArrowLeft, Zap, Shield, Sparkles, Flame, Brain, Skull, Heart, Swords, Target, Play, X, Trash2, QrCode, ShoppingBag } from 'lucide-react';
import CardVFXWrapper from '../kontrola/vfx/CardVFXWrapper';

export default function CardActionModal({
  activePlayer,
  allPlayers,
  onClose,
  onInitiateCombat,
  onApplyInstantEffect,
  onOpenKontrol,
  onOpenBlitz,
  onRequestScanQR,
  onRequestOpenStore,
  onOpenRetreat,
  onShowLevelRequirement,
  onDiscardCard,
  onOpenSecretAllianceInvite
}) {
  const [selectedInstanceId, setSelectedInstanceId] = useState(
    activePlayer.actionCardsHand?.[0]?.instanceId || null
  );
  const [selectedMoveId, setSelectedMoveId] = useState(null);
  const [selectedWildOption, setSelectedWildOption] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState(
    allPlayers.find(p => p.id !== activePlayer.id)?.id || ''
  );
  const [amplifyChoice, setAmplifyChoice] = useState('hp'); // 'hp' | 'ap' | 'dp'
  const [awaitingPhysicalPlacement, setAwaitingPhysicalPlacement] = useState(false);
  const [placementData, setPlacementData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isZombie = activePlayer.isZombie;
  const char = isZombie ? ZOMBIE_PROFILE : (CHARACTERS[activePlayer.characterId] || CHARACTERS.chynaman);
  const allCharMoves = isZombie ? ZOMBIE_PROFILE.moves : char.moves;
  const availableMoves = allCharMoves.filter(m => !m.id.includes('blitz') && !m.id.includes('kontrol'));

  const currentAction = (activePlayer.actionCardsHand || []).find(c => c.instanceId === selectedInstanceId);
  const currentMove = availableMoves.find(m => m.id === selectedMoveId) || availableMoves[0];

  const isAttackAction = Boolean(
    currentAction?.category === 'Attack' ||
    currentAction?.type === 'ATTACK' ||
    currentAction?.id === 'atk_x1' ||
    currentAction?.id === 'atk_x2' ||
    (currentAction?.name || '').toUpperCase().includes('ATTACK') ||
    currentAction?.id === 'backstab' ||
    (currentAction?.name || '').toUpperCase().includes('BACK STAB')
  );
  const isAttackPlay = isAttackAction || isZombie;
  const totalETCost = isAttackPlay ? ((currentAction?.costET || 0) + (currentMove?.costET || 0)) : (currentAction?.costET || 0);

  const selectableTargets = allPlayers.filter(p => {
    if (p.isDefeated) return false;
    if (currentAction?.id === 'poison_card' || currentAction?.id === 'poison_x1' || currentAction?.id === 'poison_x2' || currentAction?.name?.includes('POISON')) return true;
    return p.id !== activePlayer.id;
  });

  const handleActionClick = (card) => {
    soundFX.playCard();
    setSelectedInstanceId(card.instanceId);

    if (card.id === 'retreat_card' && activePlayer.retreatedThisTurn) {
      setErrorMsg('Already retreated this turn.');
      return;
    }
    if (card.id === 'retreat_card') {
      // RETREAT timing gate: Only available AFTER dice rolled (inCombat phase or later)
      // For now, we allow retreat anytime. Phase gating will happen in RetreatModal
      onOpenRetreat(activePlayer, card.instanceId);
      return;
    }
  };

  const handleConfirmAction = () => {
    if (!currentAction) return;

    if (activePlayer.energyTokens < totalETCost) {
      setErrorMsg(`Need ${totalETCost} ET you have ${activePlayer.energyTokens} ET.`);
      return;
    }

    // BACK STAB gate: Only works in 3+ player matches
    if (currentAction.id === 'backstab' && allPlayers.length <= 2) {
      setErrorMsg('BACK STAB only available in 3+ player matches.');
      return;
    }

    // SOUL ALLIANCE gate: Only works in 3+ player matches
    if (currentAction.id === 'soul_alliance' && allPlayers.length <= 2) {
      setErrorMsg('SOUL ALLIANCE only available in 3+ player matches.');
      return;
    }

    // REVIVE Card gate (Nov 8 Notes): This card is ONLY used when the card holder is defeated or dies
    if (currentAction.name && currentAction.name.toUpperCase().includes('REVIVE')) {
      if ((activePlayer.hp || 0) > 0 && !activePlayer.isDefeated) {
        setErrorMsg('🔒 REVIVE card is ONLY used when your character is defeated or dies!');
        return;
      }
    }

    const targetPlayer = selectableTargets.find(p => p.id === targetPlayerId)
      || selectableTargets.find(p => p.id !== activePlayer.id)
      || selectableTargets[0];

    // Handle Attacks
    if (currentAction.category === 'Attack' || currentAction.type === 'ATTACK' || isZombie || currentAction.id === 'backstab' || (currentAction.name || '').toUpperCase().includes('BACK STAB')) {
      // CHECK VITALITY LEVEL REQUIREMENTS (before initiating attack)
      if (currentAction.name && currentAction.name.includes('VITALITY')) {
        const currentLevel = activePlayer.level || 1;
        let requiredLevel = 1;
        let nextSteps = [];

        if (currentAction.name.includes('V20')) {
          requiredLevel = 2;
          nextSteps = ['Use VITALITY GAIN V10 to reach Level 2'];
        } else if (currentAction.name.includes('V30')) {
          requiredLevel = 3;
          nextSteps = ['Use VITALITY GAIN V10 to reach Level 2', 'Use VITALITY GAIN V20 to reach Level 3'];
        } else if (currentAction.name.includes('V40')) {
          requiredLevel = 4;
          nextSteps = ['Use VITALITY GAIN V10 to reach Level 2', 'Use VITALITY GAIN V20 to reach Level 3', 'Use VITALITY GAIN V30 to reach Level 4'];
        }

        if (currentLevel < requiredLevel) {
          if (onShowLevelRequirement) {
            onShowLevelRequirement(currentAction.name, currentLevel, requiredLevel, nextSteps);
          }
          return;
        }
      }

      if (!targetPlayer) {
        setErrorMsg('Please pick a target opponent.');
        return;
      }

      const resolvedMove = currentMove?.isWild
        ? (allCharMoves.find(m => m.name === (selectedWildOption || currentMove.wildOptions?.[0])) || currentMove)
        : currentMove;

      setPlacementData({
        attacker: activePlayer,
        defender: targetPlayer,
        actionCard: currentAction,
        characterMove: resolvedMove,
        amplifyBonus: amplifyChoice === 'ap' ? 20 : 0,
        playerCount: allPlayers.length,
        isBackStab: currentAction.id === 'backstab' || (currentAction.name || '').toUpperCase().includes('BACK STAB')
      });
      setAwaitingPhysicalPlacement(true);
      return;
    }

    // Handle Poison
    const isPoisonAction = currentAction.id === 'poison_card' || currentAction.id === 'poison_x1' || currentAction.id === 'poison_x2' || currentAction.name?.includes('POISON');
    if (isPoisonAction) {
      if (!targetPlayer) {
        setErrorMsg('Please pick a target opponent.');
        return;
      }
      const isX2 = currentAction.id === 'poison_x2' || currentAction.name?.includes('X2');
      onApplyInstantEffect({
        type: 'poison',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        amount: isX2 ? 2 : 1,
        cardName: currentAction.name,
        actionCardId: currentAction.id,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Freeze Cards (FREEZE X1 & FREEZE X2)
    const isFreezeCardAction = currentAction.id === 'freeze_x1' || currentAction.id === 'freeze_x2' || (currentAction.name || '').toUpperCase().includes('FREEZE');
    if (isFreezeCardAction) {
      if (!targetPlayer) {
        setErrorMsg('Please pick a target opponent to freeze.');
        return;
      }
      const isX2 = currentAction.id === 'freeze_x2' || (currentAction.name || '').toUpperCase().includes('X2');
      onApplyInstantEffect({
        type: 'freeze',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET || 0,
        amount: isX2 ? 2 : 1,
        cardName: currentAction.name,
        actionCardId: currentAction.id,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Sleepy Cards (SLEEPY X1 & SLEEPY X2)
    const isSleepyCardAction = currentAction.id === 'sleepy_x1' || currentAction.id === 'sleepy_x2' || (currentAction.name || '').toUpperCase().includes('SLEEPY') || (currentAction.name || '').toUpperCase().includes('SLEEP');
    if (isSleepyCardAction) {
      if (!targetPlayer) {
        setErrorMsg('Please pick a target opponent.');
        return;
      }
      const isX2 = currentAction.id === 'sleepy_x2' || (currentAction.name || '').toUpperCase().includes('X2');
      onApplyInstantEffect({
        type: 'sleep',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET || 0,
        amount: isX2 ? 2 : 1,
        cardName: currentAction.name,
        actionCardId: currentAction.id,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Antidote
    if (currentAction.id === 'antidote_card' || currentAction.id?.includes('antidote') || currentAction.name?.includes('ANTIDOTE')) {
      onApplyInstantEffect({
        type: 'antidote',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        cardName: currentAction.name,
        actionCardId: currentAction.id,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Heal
    if (currentAction.id === 'heal_card') {
      onApplyInstantEffect({
        type: 'heal',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        amount: 30,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Shield
    if (currentAction.id === 'shield_card') {
      onApplyInstantEffect({
        type: 'shield',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        amount: 30,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Amplify
    if (currentAction.id === 'amplify_card') {
      onApplyInstantEffect({
        type: 'amplify',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        amplifyChoice: amplifyChoice,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle Vitality Cards (V10, V20, V30, V40)
    if (currentAction.type === 'VITALITY') {
      onApplyInstantEffect({
        type: 'vitality',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id, // Apply to self
        costET: currentAction.costET,
        cardId: currentAction.id,
        cardName: currentAction.name, // Pass card name so BattleArena knows V10/V20/V30/V40
        playedInstanceId: currentAction.instanceId
      });
      return;
    }

    // Handle KONTROL Card (Only available through digital purchase or QR Code system)
    if (currentAction.id === 'kontrol_card' || (currentAction.name || '').toUpperCase().includes('KONTROL')) {
      const isPurchasedOrScanned = Boolean(activePlayer.isUnlocked || activePlayer.purchased || (activePlayer.characterCardMoves?.length > 10));
      if (!isPurchasedOrScanned) {
        setErrorMsg('🔒 No Saigo Blitz and Kontrol is only available through digital purchase or through QR Code system!');
        return;
      }
      if (activePlayer.energyTokens < totalETCost) {
        setErrorMsg(`Need ${totalETCost} ET you have ${activePlayer.energyTokens} ET.`);
        return;
      }
      if (!targetPlayer) {
        setErrorMsg('Please pick a target opponent.');
        return;
      }
      // Call the KONTROL modal handler with target
      if (onOpenKontrol) {
        onOpenKontrol(activePlayer, targetPlayer, currentAction.instanceId);
        onClose();
      }
      return;
    }

    // Handle SOUL ALLIANCE Card
    if (currentAction.id === 'soul_alliance') {
      if (!targetPlayer) {
        setErrorMsg('Please pick a target to ally with.');
        return;
      }
      // FIX #4: Pass target player ID so modal knows who to send invite to
      if (onOpenSecretAllianceInvite) {
        onOpenSecretAllianceInvite(currentAction.instanceId, targetPlayer.id);
        onClose();
      }
      return;
    }

    // Handle ABANDON Card
    if (currentAction.id === 'abandon' || currentAction.name?.includes('ABANDON')) {
      onApplyInstantEffect({
        type: 'abandon',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.alliedWith || activePlayer.id,
        costET: currentAction.costET,
        cardName: currentAction.name,
        cardId: currentAction.id,
        playedInstanceId: currentAction.instanceId
      });
      return;
    }
  };

  const handlePhysicalPlacementConfirmed = () => {
    soundFX.playMenuSelect();
    if (placementData) {
      onInitiateCombat(placementData);
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
      {/* Floating BACK button fixed to top-left of the screen overlay */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
          border: '3px solid #ED1E24',
          borderRadius: '12px',
          padding: '16px 36px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 8px 28px rgba(0,0,0,0.9), 0 0 28px rgba(237, 30, 36, 0.6)',
          fontWeight: 'bold',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '1.2rem',
          letterSpacing: '3px',
          transition: 'all 0.2s ease'
        }}
      >
        <ArrowLeft size={28} />
        <span>BACK</span>
      </button>
      {/* Modal wrapper */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '920px', display: 'flex', flexDirection: 'column' }}>

        {/* Main modal panel */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
            border: '1.5px solid rgba(251, 200, 13, 0.5)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(251, 200, 13, 0.25)',
            width: '100%',
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
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--neon-gold)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={getAssetUrl(char.image || 'characters/chynaman.png')}
                  alt={char.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '1px', color: 'var(--neon-gold)', fontWeight: 'bold' }}>
                  TACTICAL COMBAT PLAY
                </span>
                <h2 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', fontFamily: 'Orbitron, sans-serif' }}>
                  {activePlayer.name} – PLAY ACTION CARD
                </h2>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          {/* Body: Physical Placement OR Selection UI */}
          {awaitingPhysicalPlacement ? (
            <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}>
                ⚔️
              </div>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '0 0 16px', fontFamily: 'Orbitron, sans-serif' }}>
                PHYSICAL PLACEMENT REQUIRED
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', maxWidth: '400px', margin: '0 auto 40px', lineHeight: '1.5' }}>
                Place your Character Card on the table to physically validate this move.
              </p>
              <button
                onClick={handlePhysicalPlacementConfirmed}
                style={{
                  background: 'linear-gradient(90deg, #ED1E24, #ff9900)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 32px',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 0 20px rgba(237, 30, 36, 0.5)',
                  animation: 'pulse 2s infinite'
                }}
              >
                <Zap size={24} fill="#fff" /> CONFIRM PHYSICAL PLACEMENT
              </button>
              <button
                onClick={() => { setAwaitingPhysicalPlacement(false); setPlacementData(null); }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
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
              {/* Left Column: Action Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--neon-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  {(activePlayer.actionCardsHand || []).map(card => {
                    const isSelected = selectedInstanceId === card.instanceId;
                    const disabledForZombie = false; // Kontrol/Blitz are character abilities, not action cards

                    return (
                      <CardVFXWrapper
                        key={card.instanceId}
                        cardName={card.name}
                        isSelected={isSelected}
                        enable3DTilt={true}
                        onClick={() => !disabledForZombie && handleActionClick(card)}
                        style={{
                          background: isSelected ? 'rgba(251, 200, 13, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '10px',
                          padding: '12px',
                          cursor: disabledForZombie ? 'not-allowed' : 'pointer',
                          opacity: disabledForZombie ? 0.4 : 1,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.3rem' }}>{card.icon}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {(card.category === 'Attack' || card.type === 'ATTACK') && (
                              <span style={{
                                fontSize: '0.65rem',
                                background: 'rgba(237, 30, 36, 0.2)',
                                border: '1px solid #ED1E24',
                                color: '#ff6b8f',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                ⚔️ ATTACK
                              </span>
                            )}
                            {(card.category === 'Defense' || card.type === 'DEFENSE') && (
                              <span style={{
                                fontSize: '0.65rem',
                                background: 'rgba(0, 240, 255, 0.15)',
                                border: '1px solid #00f0ff',
                                color: '#00f0ff',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                🛡️ DEFENSE
                              </span>
                            )}
                            {(card.category === 'Vitality' || card.type === 'VITALITY' || card.type === 'HEAL') && (
                              <span style={{
                                fontSize: '0.65rem',
                                background: 'rgba(57, 255, 20, 0.15)',
                                border: '1px solid #39ff14',
                                color: '#39ff14',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                💚 HEAL
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.72rem',
                                background: 'rgba(251, 200, 13, 0.15)',
                                border: '1px solid #FBC80D',
                                color: '#FBC80D',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <Zap size={10} fill="#FBC80D" /> {card.costET} ET
                            </span>
                          </div>
                        </div>
                        <strong style={{ fontSize: '0.92rem', color: isSelected ? '#fff' : '#e0e0e0', marginTop: '4px' }}>
                          {card.name}
                        </strong>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.3' }}>
                          {card.desc}
                        </p>
                        {/* BUG 8 FIX: DISCARD button inside the card tile */}
                        {onDiscardCard && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFX.playCard();
                              onDiscardCard(card);
                              onClose();
                            }}
                            style={{
                              marginTop: '6px',
                              background: 'rgba(237, 30, 36, 0.18)',
                              border: '1px solid rgba(237, 30, 36, 0.5)',
                              color: '#ED1E24',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              width: '100%',
                              justifyContent: 'center'
                            }}
                            title="Discard this card and draw a new one (ends your turn)"
                          >
                            <Trash2 size={11} /> DISCARD
                          </button>
                        )}
                      </CardVFXWrapper>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Techniques & Target Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Amplify Choices */}
                {currentAction?.id === 'amplify_card' && (
                  <div style={{ background: 'rgba(255, 176, 46, 0.1)', border: '1px solid #ffb02e', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#ffb02e', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} /> CHOOSE AMPLIFY BONUS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'hp', label: '❤️ +20 HP', sub: 'Heal' },
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
                {(isAttackPlay || currentAction?.category === 'Attack' || currentAction?.type === 'ATTACK' || isZombie) && currentAction?.type !== 'VITALITY' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--neon-pink)', fontWeight: 'bold' }}>
                        2. PAIR PLAYER TECHNIQUE
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#FBC80D', fontWeight: 'bold' }}>
                        🎴 {(activePlayer.characterCardMoves || []).length} Moves Remaining
                      </div>
                    </div>

                    {((currentAction?.name || '').toUpperCase().includes('ATTACK X1') || (currentAction?.name || '').toUpperCase().includes('ATTACK X2') || currentAction?.id === 'atk_x1' || currentAction?.id === 'atk_x2') && (activePlayer.characterCardMoves || []).length === 0 ? (
                      <div style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.15)', border: '1px solid #FF4444', borderRadius: '8px', color: '#ff6b81', fontSize: '0.8rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>
                          ⚠️ All 10 Character Move Cards used!
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.4' }}>
                          Attack X1 and Attack X2 require Character Move Cards. Players must purchase more through the website or the TCG Card game.
                          You have the option to purchase only digital or physical cards (Physical cards allow the player to receive a physical card and the digital card through our QR Code system).
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {onRequestScanQR && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onRequestScanQR();
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #FBC80D, #ff9900)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 0 10px rgba(251, 200, 13, 0.4)'
                              }}
                            >
                              <QrCode size={14} /> SCAN PHYSICAL CARD (QR CODE)
                            </button>
                          )}
                          {onRequestOpenStore && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onRequestOpenStore();
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #00f0ff, #0077ff)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
                              }}
                            >
                              <ShoppingBag size={14} /> PURCHASE DIGITAL / PHYSICAL CARDS
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {availableMoves.map(move => {
                          const isMoveSelected = (selectedMoveId || availableMoves[0]?.id) === move.id;
                          const isMult = move.type === 'dice_mult';

                          return (
                            <div
                              key={move.id}
                              onClick={() => {
                                soundFX.playCard();
                                setSelectedMoveId(move.id);
                                if (move.isWild && !selectedWildOption && move.wildOptions?.length) {
                                  setSelectedWildOption(move.wildOptions[0]);
                                }
                              }}
                              style={{
                                background: isMoveSelected ? 'rgba(237, 30, 36, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                                border: isMoveSelected ? '1.5px solid #ED1E24' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{move.name}</strong>
                                    {move.rarity && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        background: move.rarity === 'Super Rare' ? 'rgba(251, 200, 13, 0.2)' : move.rarity === 'Rare' ? 'rgba(168, 85, 247, 0.2)' : move.rarity === 'Semi Common' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        color: move.rarity === 'Super Rare' ? '#FBC80D' : move.rarity === 'Rare' ? '#c084fc' : move.rarity === 'Semi Common' ? '#38bdf8' : '#cbd5e1',
                                        border: `1px solid ${move.rarity === 'Super Rare' ? 'rgba(251, 200, 13, 0.4)' : 'rgba(255,255,255,0.15)'}`
                                      }}>
                                        {move.rarity}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                                    {move.desc || `${move.baseAP || 25} AP technique`}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <span style={{ fontSize: '0.82rem', color: '#ED1E24', fontWeight: 'bold' }}>
                                    {isMult ? `🎲 × ${move.multiplier} AP` : move.isWild ? 'WILD' : `${move.baseAP} AP`}
                                  </span>
                                  <div style={{ fontSize: '0.7rem', color: '#FBC80D' }}>Cost: {move.costET || 0} ET</div>
                                </div>
                              </div>

                              {/* Wild Card: Allows players to choose only one Character Move from the list */}
                              {move.isWild && isMoveSelected && (
                                <div style={{ marginTop: '4px', padding: '8px', background: 'rgba(251, 200, 13, 0.08)', borderRadius: '6px', border: '1px solid rgba(251, 200, 13, 0.3)' }} onClick={e => e.stopPropagation()}>
                                  <div style={{ fontSize: '0.7rem', color: '#FBC80D', fontWeight: 'bold', marginBottom: '6px' }}>
                                    🃏 WILD CARD — CHOOSE 1 TECHNIQUE:
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {(move.wildOptions || []).map(optName => {
                                      const isOptSelected = (selectedWildOption || move.wildOptions[0]) === optName;
                                      return (
                                        <button
                                          key={optName}
                                          type="button"
                                          onClick={() => {
                                            soundFX.playCard();
                                            setSelectedWildOption(optName);
                                          }}
                                          style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.72rem',
                                            fontWeight: 'bold',
                                            border: isOptSelected ? '1.5px solid #FBC80D' : '1px solid rgba(255,255,255,0.2)',
                                            background: isOptSelected ? 'rgba(251, 200, 13, 0.25)' : 'rgba(0,0,0,0.5)',
                                            color: isOptSelected ? '#FBC80D' : '#fff',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {isOptSelected ? '✓ ' : ''}{optName}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Target Opponent Selection */}
                {(isAttackPlay || currentAction?.category === 'Attack' || currentAction?.type === 'ATTACK' || currentAction?.id === 'poison_card' || currentAction?.id === 'poison_x1' || currentAction?.id === 'poison_x2' || currentAction?.name?.includes('POISON') || isZombie) && currentAction?.type !== 'VITALITY' && (
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
                              background: isTargetSelected ? 'rgba(251, 200, 13, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                              border: isTargetSelected ? '1.5px solid #FBC80D' : '1px solid rgba(255, 255, 255, 0.08)',
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
                              <span style={{ fontSize: '0.72rem', color: 'var(--neon-gold)' }}>{target.hp} HP</span>
                              {isPoisonAction && ['chynaman', 'chyna', 'kiko', 'poochi', 'kat', 'katsumi', 'bee'].some(k => (target.characterId || target.name || '').toLowerCase().includes(k)) && (
                                <span style={{ display: 'block', fontSize: '0.68rem', color: '#ff4444', fontWeight: 'bold' }}>☠️ -10 HP Weakness</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {errorMsg && (
                  <div style={{ color: '#ED1E24', background: 'rgba(237, 30, 36, 0.1)', border: '1px solid #ED1E24', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* Action Cost & Execute CTA */}
                <div
                  style={{
                    marginTop: 'auto',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(251, 200, 13, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={20} fill="#FBC80D" color="#FBC80D" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>TOTAL ENERGY COST</div>
                      <strong style={{ fontSize: '1.1rem', color: '#FBC80D' }}>
                        {totalETCost} ET <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'normal' }}>({activePlayer.energyTokens} Available)</span>
                      </strong>
                    </div>
                  </div>

                  {(() => {
                    const isReviveBlocked = (currentAction?.name || '').toUpperCase().includes('REVIVE') && (activePlayer?.hp || 0) > 0 && !activePlayer?.isDefeated;
                    const isAttackAction = (currentAction?.name || '').toUpperCase().includes('ATTACK X1') || (currentAction?.name || '').toUpperCase().includes('ATTACK X2') || currentAction?.id === 'atk_x1' || currentAction?.id === 'atk_x2';
                    const hasCharMoves = (activePlayer.characterCardMoves || []).length > 0;
                    const isAttackActionBlocked = isAttackAction && !hasCharMoves;
                    const isActionBlocked = isReviveBlocked || isAttackActionBlocked;

                    return (
                      <button
                        onClick={handleConfirmAction}
                        disabled={isActionBlocked}
                        style={{
                          background: isActionBlocked
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'linear-gradient(90deg, #FBC80D 0%, #FFD700 100%)',
                          color: isActionBlocked ? '#ff7777' : '#000',
                          border: isActionBlocked ? '2px solid rgba(255, 119, 119, 0.5)' : '2px solid #FBC80D',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          cursor: isActionBlocked ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: isActionBlocked ? 'none' : '0 0 20px rgba(251, 200, 13, 0.6)'
                        }}
                      >
                        {isReviveBlocked ? (
                          <span>🔒 REVIVE ONLY AT 0 HP</span>
                        ) : isAttackActionBlocked ? (
                          <span>🔒 NO CHARACTER MOVES</span>
                        ) : (
                          <>
                            <Play size={16} fill="#000" />
                            <span>CONFIRM &amp; GO</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
