import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import { economyService } from '../services/economyService';

export const StoreModal = ({ isOpen, onClose, userProfile, onPurchaseComplete }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemMsg, setRedeemMsg] = useState({ text: '', type: '' });
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    economyService.getStoreBundles().then(data => {
      if (isMounted) {
        setBundles(data);
        setLoading(false);
      }
    }).catch(err => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [isOpen]);

  const handlePurchase = async (bundle) => {
    if (!userProfile) return;
    setPurchasingId(bundle.id);
    
    // Simulate Stripe payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Directly add crystals to account (simulating successful webhook)
    const success = await authService.savePlayerMatchResult(userProfile.id, {
      won: false,
      crystalsDelta: bundle.crystal_amount,
      appSource: 'store'
    });

    setPurchasingId(null);
    if (success && onPurchaseComplete) {
      onPurchaseComplete(bundle.crystal_amount);
    }
  };

  const handleRedeem = async () => {
    if (!userProfile || !redeemCode.trim() || redeeming) return;
    setRedeeming(true);
    setRedeemMsg({ text: 'Verifying code...', type: 'info' });
    
    const res = await economyService.redeemCode(userProfile.id, redeemCode.trim());
    if (res.success) {
      setRedeemMsg({ text: res.message, type: 'success' });
      setRedeemCode('');
      if (onPurchaseComplete) {
         // Tell the parent we got crystals!
         // Wait for authService to reflect DB changes or just force parent update.
         // We can just call onPurchaseComplete(amount) but the service handles it.
         onPurchaseComplete(0); // This just triggers a refresh in App.jsx usually
      }
    } else {
      setRedeemMsg({ text: res.message, type: 'error' });
    }
    setRedeeming(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 18, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          background: 'rgba(10, 20, 40, 0.95)',
          border: '2px solid var(--neon-cyan, #00f0ff)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 0 40px rgba(0, 240, 255, 0.25)',
          fontFamily: 'Rajdhani, sans-serif',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <ShoppingCart size={48} color="var(--neon-cyan, #00f0ff)" style={{ margin: '0 auto 10px auto' }} />
          <h2 style={{ color: 'var(--neon-cyan, #00f0ff)', margin: '0 0 4px 0', fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            CRYSTAL STORE
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '1.1rem' }}>Purchase Diamonds to access premium game modes.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.5)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
            Loading Store Inventory...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {bundles.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No bundles available.</div>
            ) : (
              bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.5) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'var(--neon-gold, #ffe600)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(255, 215, 0, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => !purchasingId && handlePurchase(bundle)}
                >
                  {bundle.discount_percent > 0 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff4444', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      -{bundle.discount_percent}% OFF
                    </div>
                  )}
                  {bundle.image_url ? (
                    <img src={bundle.image_url} alt={bundle.title} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
                  ) : (
                    <div style={{ fontSize: '3rem', marginBottom: '10px', textShadow: '0 0 20px rgba(0, 240, 255, 0.8)' }}>💎</div>
                  )}
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{bundle.crystal_amount} Diamonds</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--neon-gold, #ffe600)', fontWeight: 'bold', marginBottom: '4px' }}>{bundle.title}</div>
                  {bundle.description && (
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: '1.3' }}>
                      {bundle.description}
                    </div>
                  )}
                  
                  <button
                    disabled={purchasingId !== null}
                    style={{
                      background: purchasingId === bundle.id ? 'rgba(255,255,255,0.2)' : 'rgba(57, 255, 20, 0.15)',
                      border: purchasingId === bundle.id ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(57, 255, 20, 0.4)',
                      color: purchasingId === bundle.id ? '#fff' : '#39ff14',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      cursor: purchasingId !== null ? 'not-allowed' : 'pointer',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {purchasingId === bundle.id ? (
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                    ) : (
                      <>${bundle.price_usd}</>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Redeem Code Section */}
        <div style={{ marginTop: '32px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.1rem' }}>Have a Promo Code?</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Enter code here..." 
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px', borderRadius: '8px', textTransform: 'uppercase' }}
            />
            <button 
              onClick={handleRedeem}
              disabled={redeeming || !redeemCode.trim()}
              className="btn-enter-game-cta"
              style={{ padding: '10px 20px', borderRadius: '8px', cursor: (redeeming || !redeemCode.trim()) ? 'not-allowed' : 'pointer', opacity: (redeeming || !redeemCode.trim()) ? 0.5 : 1 }}
            >
              {redeeming ? 'Verifying...' : 'Redeem'}
            </button>
          </div>
          {redeemMsg.text && (
            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: redeemMsg.type === 'error' ? '#ff4444' : '#39ff14' }}>
              {redeemMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
