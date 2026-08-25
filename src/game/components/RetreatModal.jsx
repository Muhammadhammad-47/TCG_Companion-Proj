import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Wind, X, Dices, Check, AlertCircle } from 'lucide-react';

export default function RetreatModal({ player, onClose, onCompleteRetreat }) {
  const char = CHARACTERS[player.characterId] || CHARACTERS.chynaman;
  const targetRoll = player.isZombie ? 5 : (char.retreatTarget || 3);

  const [isRolling, setIsRolling] = useState(false);
  const [dieRoll, setDieRoll] = useState(1);
  const [hasRolled, setHasRolled] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRoll = () => {
    setIsRolling(true);
    soundFX.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      setDieRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDieRoll(finalRoll);
        setIsRolling(false);
        setHasRolled(true);

        const isSuccess = finalRoll >= targetRoll;
        setSuccess(isSuccess);

        if (isSuccess) {
          soundFX.playEnergy();
        } else {
          soundFX.playHit();
        }
      }
    }, 80);
  };

  const handleConfirm = () => {
    onCompleteRetreat({
      playerId: player.id,
      success
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="special-card-modal retreat-modal">
        <div className="modal-header">
          <div className="header-title-box">
            <span className="step-pill retreat-step"><Wind size={14} /> 0 ET</span>
            <h2>RETREAT</h2>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="special-modal-body">
          <p className="special-desc">
            {player.name} needs <strong>{targetRoll}+</strong>
          </p>

          <div className="retreat-roll-arena">
            <div className="single-die-box">
              <div className={`die blue-die ${isRolling ? 'die-rolling' : ''}`}>{dieRoll}</div>
              <span>{targetRoll}+</span>
            </div>

            {!hasRolled ? (
              <button className="btn-roll-combat" onClick={handleRoll} disabled={isRolling}>
                <Dices size={20} /> {isRolling ? '…' : 'ROLL'}
              </button>
            ) : (
              <div className="kontrol-outcome-box">
                <h4 className={success ? 'text-success' : 'text-danger'}>
                  {success ? '💨 ESCAPED' : '🛑 FAILED'}
                </h4>
                <button className="btn-apply-damage" onClick={handleConfirm}>
                  <Check size={18} /> OK
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
