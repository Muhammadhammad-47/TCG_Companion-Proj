import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, BookOpen, HelpCircle, Plus, Search, Filter,
  Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw,
  Copy, Check, ExternalLink, Save, X, ToggleLeft, ToggleRight,
  TrendingUp, Award, Layers, Users, Swords, UserX, UserCheck, Flame,
  Crown, Lock, Ban, Sparkles, Gem, Clock, Zap
} from 'lucide-react';
import { authService } from '../../services/authService';
import { knowledgeService } from '../../services/knowledgeService';
import { soundFX } from '../../game/utils/audio';

export default function AdminPage() {
  const navigate = useNavigate();

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Login Gate State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: 'users' | 'matches' | 'rules' | 'questions'
  const [activeTab, setActiveTab] = useState('users');

  // TAB 1: USERS & MODERATION
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [modNotice, setModNotice] = useState('');

  // Crystal Adjust Modal
  const [crystalModalUser, setCrystalModalUser] = useState(null);
  const [newCrystalCount, setNewCrystalCount] = useState(0);

  // Ban Confirm Modal
  const [banModalUser, setBanModalUser] = useState(null);

  // TAB 2: MATCH HISTORY
  const [matchHistory, setMatchHistory] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);

  // TAB 3: RULES KNOWLEDGE
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingRule, setEditingRule] = useState(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleFormData, setRuleFormData] = useState({
    topic: '',
    category: 'Combat',
    keywords: '',
    short_answer: '',
    details: '',
    order_index: 0,
    is_active: true
  });

  // TAB 4: USER QUESTIONS
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionFilter, setQuestionFilter] = useState('all');
  const [promotedSuccess, setPromotedSuccess] = useState('');

  // Lock landscape orientation on mobile
  useEffect(() => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  }, []);

  const LandscapeOverlay = () => (
    <div className="rotate-device-overlay">
      <div className="rotate-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-icon">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.6 5.6"/>
        </svg>
        <h2>Please Rotate Your Device</h2>
        <p>The Attention TCG Command Deck is optimized for landscape mode.</p>
      </div>
    </div>
  );

  // Load Admin Session on Mount
  useEffect(() => {
    let isMounted = true;
    async function verifyAdmin() {
      try {
        const user = await authService.getCurrentUser();
        if (!isMounted) return;
        if (user) {
          setCurrentUser(user);
          const profile = await authService.getProfile(user.id);
          if (profile && isMounted) {
            setUserProfile(profile);
            setIsAdmin(Boolean(profile.is_admin));
          }
        }
      } catch (err) {
        console.warn('Admin check error:', err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }
    verifyAdmin();
    return () => { isMounted = false; };
  }, []);

  // Fetch Tab Data when Admin is Verified
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadMatches();
      loadRules();
      loadQuestions();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await authService.fetchAllUsers(userSearch);
      setUsersList(data);
    } catch (e) {
      console.warn('Failed loading users:', e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadMatches = async () => {
    setIsMatchesLoading(true);
    try {
      const data = await authService.fetchMatchHistory(50);
      setMatchHistory(data);
    } catch (e) {
      console.warn('Failed loading match history:', e);
    } finally {
      setIsMatchesLoading(false);
    }
  };

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const data = await knowledgeService.fetchAllRulesForAdmin();
      setRules(data);
    } catch (e) {
      console.warn('Failed loading rules:', e);
    } finally {
      setRulesLoading(false);
    }
  };

  const loadQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const data = await knowledgeService.fetchUserQuestions({ filter: questionFilter });
      setQuestions(data);
    } catch (e) {
      console.warn('Failed loading questions:', e);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await authService.signIn(adminEmail, adminPassword, 'admin_portal');
      const user = res?.user;
      if (user) {
        setCurrentUser(user);
        const profile = await authService.getProfile(user.id);
        setUserProfile(profile);
        if (profile?.is_admin) {
          setIsAdmin(true);
        } else {
          setLoginError('Access Denied. This account does not possess administrator privileges.');
          await authService.signOut();
        }
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please verify administrator credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await authService.signOut();
    setIsAdmin(false);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const handleToggleBan = async (user) => {
    try {
      const updated = await authService.toggleUserBan(user.id, !user.is_banned);
      setUsersList((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setModNotice(`Warrior "${user.username}" has been ${updated.is_banned ? 'SUSPENDED' : 'REINSTATED'}.`);
      setBanModalUser(null);
      setTimeout(() => setModNotice(''), 3500);
    } catch (e) {
      alert('Failed to update ban status: ' + e.message);
    }
  };

  const handleSaveCrystals = async () => {
    if (!crystalModalUser) return;
    try {
      const updated = await authService.adjustUserCrystals(crystalModalUser.id, newCrystalCount);
      setUsersList((prev) => prev.map((u) => (u.id === crystalModalUser.id ? updated : u)));
      setModNotice(`Stability Crystals for "${crystalModalUser.username}" set to ${newCrystalCount}.`);
      setCrystalModalUser(null);
      setTimeout(() => setModNotice(''), 3500);
    } catch (e) {
      alert('Failed to adjust crystals: ' + e.message);
    }
  };

  const handleToggleRuleActive = async (rule) => {
    try {
      const updated = await knowledgeService.updateRule(rule.id, { is_active: !rule.is_active });
      setRules(rules.map((r) => (r.id === rule.id ? updated : r)));
    } catch (e) {
      alert('Failed to toggle rule: ' + e.message);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to permanently delete this rule from the Knowledge Base?')) return;
    try {
      await knowledgeService.deleteRule(ruleId);
      setRules(rules.filter((r) => r.id !== ruleId));
    } catch (e) {
      alert('Failed to delete rule: ' + e.message);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const keywordsArr = typeof ruleFormData.keywords === 'string'
      ? ruleFormData.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
      : ruleFormData.keywords;

    const payload = {
      topic: ruleFormData.topic,
      category: ruleFormData.category,
      keywords: keywordsArr,
      short_answer: ruleFormData.short_answer,
      details: ruleFormData.details,
      order_index: parseInt(ruleFormData.order_index, 10) || 0,
      is_active: ruleFormData.is_active
    };

    try {
      if (editingRule) {
        const updated = await knowledgeService.updateRule(editingRule.id, payload);
        setRules(rules.map((r) => (r.id === editingRule.id ? updated : r)));
      } else {
        const created = await knowledgeService.createRule(payload);
        setRules([created, ...rules]);
      }
      setIsCreatingRule(false);
      setEditingRule(null);
    } catch (e) {
      alert('Error saving rule: ' + e.message);
    }
  };

  const handlePromoteQuestion = async (q) => {
    const finalAnswer = q.user_suggested_answer || q.ai_answer || '';
    const newRule = {
      topic: q.question_text.length > 50 ? q.question_text.substring(0, 47) + '...' : q.question_text,
      category: 'Combat',
      keywords: q.question_text.toLowerCase().split(' ').filter((w) => w.length > 3),
      short_answer: finalAnswer.length > 150 ? finalAnswer.substring(0, 147) + '...' : finalAnswer,
      details: `Official Answer to player query: "${q.question_text}"\n\nAnswer: ${finalAnswer}`,
      order_index: rules.length + 1,
      is_active: true
    };

    try {
      const created = await knowledgeService.promoteQuestionToKnowledge(q.id, newRule);
      setRules([created, ...rules]);
      setPromotedSuccess(`Successfully promoted question to Knowledge Base!`);
      loadQuestions();
      setTimeout(() => setPromotedSuccess(''), 4000);
    } catch (e) {
      alert('Failed to promote rule: ' + e.message);
    }
  };

  // =========================================================================
  // VIEW 1: LOADING STATE
  // =========================================================================
  if (authLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at 50% 20%, #111a36 0%, #080d1e 60%, #040710 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neon-cyan, #00f0ff)',
          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="brand-pill-badge" style={{ margin: '0 auto 12px auto', fontSize: '0.9rem', padding: '3px 12px' }}>注意!</div>
          <div style={{ fontSize: '1.4rem', letterSpacing: '2px', fontWeight: 'bold' }}>ACCESSING COMMAND DECK...</div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ADMIN LOGIN GATE (Score Calculator Aesthetic)
  // =========================================================================
  if (!isAdmin) {
    return (
      <>
        <LandscapeOverlay />
        <div className="webgl-canvas-frame landscape-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 20%, #111a36 0%, #080d1e 60%, #040710 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Ambient Background Streaks matching MainMenu */}
            <div className="menu-bg-elements" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
              <div className="neon-streak-red" style={{ opacity: 0.4 }}></div>
              <div className="neon-streak-blue" style={{ opacity: 0.4 }}></div>
              <div className="subtle-watermark-card left-wm" style={{ opacity: 0.3 }}></div>
              <div className="subtle-watermark-card right-wm" style={{ opacity: 0.3 }}></div>
            </div>

            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(14, 22, 42, 0.88)',
                border: '1.5px solid var(--neon-cyan, #00f0ff)',
                borderRadius: '22px',
                padding: '32px 30px',
                boxShadow: '0 15px 45px rgba(0,0,0,0.8), 0 0 35px rgba(0, 240, 255, 0.25)',
                position: 'relative',
                zIndex: 10,
                backdropFilter: 'blur(12px)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div className="brand-pill-badge" style={{ margin: '0 auto 10px auto', fontSize: '0.85rem', padding: '2px 10px' }}>注意!</div>
                <h1 className="game-main-title" style={{ margin: '0 0 4px 0' }}>
                  <span className="title-dance" style={{ fontSize: '2rem', letterSpacing: '2px' }}>COMMAND DECK</span>
                </h1>
                <div className="brand-sub-row" style={{ justifyContent: 'center' }}>
                  <span className="brand-tcg-text" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>ADMINISTRATOR ACCESS</span>
                </div>
              </div>

              {loginError && (
                <div
                  style={{
                    background: 'rgba(255, 51, 102, 0.15)',
                    border: '1.5px solid var(--neon-crimson, #ff3366)',
                    color: '#ff88aa',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--neon-cyan, #00f0ff)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    ADMINISTRATOR EMAIL
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@tcgcompanion.com"
                    autoComplete="email"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      background: 'rgba(5, 10, 24, 0.85)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--neon-cyan, #00f0ff)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoComplete="current-password"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      background: 'rgba(5, 10, 24, 0.85)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  style={{
                    marginTop: '8px',
                    padding: '13px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                    color: '#050a18',
                    fontWeight: '900',
                    fontSize: '1.1rem',
                    cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                    opacity: isLoggingIn ? 0.7 : 1,
                    boxShadow: '0 0 25px rgba(0, 240, 255, 0.35)',
                    letterSpacing: '1.5px',
                    fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                  }}
                >
                  {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER COMMAND DECK'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}
                >
                  ← Return to Companion Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // =========================================================================
  // VIEW 3: AUTHENTICATED COMMAND DECK (Score Calculator Aesthetic)
  // =========================================================================
  const filteredUsers = usersList.filter((u) => {
    if (userFilter === 'ACTIVE') return !u.is_banned;
    if (userFilter === 'BANNED') return u.is_banned;
    return true;
  });

  const filteredRules = rules.filter((r) => {
    const topic = r.topic || '';
    const details = r.details || '';
    const category = r.category || 'Combat';
    const matchesSearch =
      topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <>
      <LandscapeOverlay />
      <div className="webgl-canvas-frame landscape-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 50% 20%, #111a36 0%, #080d1e 60%, #040710 100%)',
            color: 'var(--text-main, #f8fafc)',
            fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
            position: 'relative',
            overflowX: 'hidden',
            overflowY: 'auto',
            boxSizing: 'border-box',
            paddingBottom: '40px'
          }}
        >
          {/* Ambient Background Streaks matching Score Calculator */}
          <div className="menu-bg-elements" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <div className="neon-streak-red" style={{ opacity: 0.35 }}></div>
            <div className="neon-streak-blue" style={{ opacity: 0.35 }}></div>
            <div className="subtle-watermark-card left-wm" style={{ opacity: 0.25 }}></div>
            <div className="subtle-watermark-card right-wm" style={{ opacity: 0.25 }}></div>
          </div>

          <style>{`
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: rgba(3, 7, 18, 0.95); }
            ::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.3); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(0, 240, 255, 0.6); }
            .score-card {
              background: rgba(14, 22, 42, 0.85);
              border: 1.5px solid rgba(0, 240, 255, 0.25);
              border-radius: 18px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
              backdrop-filter: blur(10px);
              transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
            }
            .score-card:hover {
              border-color: rgba(0, 240, 255, 0.45);
              box-shadow: 0 12px 35px rgba(0, 240, 255, 0.15);
            }
          `}</style>

          {/* Top Sticky Header matching Score Calculator */}
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 28px',
              background: 'rgba(10, 20, 45, 0.92)',
              borderBottom: '1.5px solid rgba(0, 240, 255, 0.28)',
              backdropFilter: 'blur(14px)',
              position: 'sticky',
              top: 0,
              zIndex: 100
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(10, 25, 50, 0.85)',
                  border: '1.5px solid rgba(0, 240, 255, 0.4)',
                  borderRadius: '8px',
                  color: 'var(--neon-cyan, #00f0ff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.88rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)'
                }}
              >
                <ArrowLeft size={16} /> BACK TO HUB
              </button>
              <div className="brand-pill-badge" style={{ fontSize: '0.85rem', padding: '3px 10px' }}>注意!</div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '1.5px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', color: '#fff' }}>
                  ATTENTION TCG <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>COMMAND DECK</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/docs')}
                style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: 'var(--neon-cyan, #00f0ff)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={14} /> DEVELOPER APIS
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(8, 16, 36, 0.85)', padding: '5px 12px', borderRadius: '10px', border: '1px solid rgba(255, 230, 0, 0.3)' }}>
                <Crown size={15} color="var(--neon-gold, #ffe600)" />
                <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{userProfile?.username || 'Admin'}</span>
              </div>

              <button
                onClick={handleAdminLogout}
                style={{
                  background: 'rgba(255, 51, 102, 0.15)',
                  border: '1.5px solid var(--neon-crimson, #ff3366)',
                  color: '#ff88aa',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.88rem'
                }}
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Main Stage */}
          <div style={{ maxWidth: '1380px', width: '100%', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box' }}>
            
            {/* Quick Metrics Strip matching Score Calculator Arena HUD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
              <div className="score-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.12)', border: '1.5px solid var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan, #00f0ff)' }}>
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>REGISTERED WARRIORS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>{usersList.length}</div>
                </div>
              </div>

              <div className="score-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(57, 255, 20, 0.12)', border: '1.5px solid #39ff14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff14' }}>
                  <Shield size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>ACTIVE STATUS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#39ff14' }}>
                    {usersList.filter(u => !u.is_banned).length}
                  </div>
                </div>
              </div>

              <div className="score-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 230, 0, 0.12)', border: '1.5px solid var(--neon-gold, #ffe600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-gold, #ffe600)' }}>
                  <Swords size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>RECORDED DUELS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)' }}>{matchHistory.length}</div>
                </div>
              </div>

              <div className="score-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(224, 176, 255, 0.12)', border: '1.5px solid #e0b0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0b0ff' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>KNOWLEDGE RULES</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#e0b0ff' }}>{rules.length}</div>
                </div>
              </div>
            </div>

            {/* Notification Toast */}
            {(modNotice || promotedSuccess) && (
              <div
                style={{
                  background: 'rgba(57, 255, 20, 0.15)',
                  border: '1.5px solid #39ff14',
                  color: '#39ff14',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 'bold'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{modNotice || promotedSuccess}</span>
              </div>
            )}

            {/* Tab Navigation matching Score Calculator Presets */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
              {[
                { id: 'users', label: `👥 WARRIORS ROSTER (${usersList.length})` },
                { id: 'matches', label: `🏆 MATCH HISTORY (${matchHistory.length})` },
                { id: 'rules', label: `📚 KNOWLEDGE BASE (${rules.length})` },
                { id: 'questions', label: `❓ USER QUESTIONS (${questions.length})` }
              ].map((tab) => {
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '900',
                      letterSpacing: '1px',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                      border: isSel ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: isSel
                        ? 'linear-gradient(90deg, rgba(0, 240, 255, 0.25) 0%, rgba(0, 136, 255, 0.25) 100%)'
                        : 'rgba(14, 22, 42, 0.7)',
                      color: isSel ? '#fff' : 'rgba(255, 255, 255, 0.65)',
                      boxShadow: isSel ? '0 0 20px rgba(0, 240, 255, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* =========================================================================
                TAB 1: WARRIORS ROSTER (DECLUTTERED)
            ========================================================================= */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                      type="text"
                      placeholder="Search warrior callsign or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '11px 16px 11px 42px',
                        background: 'rgba(5, 10, 24, 0.85)',
                        border: '1.5px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['ALL', 'ACTIVE', 'BANNED'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setUserFilter(f)}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '10px',
                          border: userFilter === f ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                          background: userFilter === f ? 'rgba(0, 240, 255, 0.18)' : 'rgba(14, 22, 42, 0.6)',
                          color: userFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                    <button
                      onClick={loadUsers}
                      style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid var(--neon-cyan, #00f0ff)',
                        color: 'var(--neon-cyan, #00f0ff)',
                        padding: '9px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      <RefreshCw size={15} className={isUsersLoading ? 'spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Warriors Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {filteredUsers.length === 0 ? (
                    <div className="score-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      No warriors found matching your search filter.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const winRate = u.matches_played > 0 ? Math.round((u.matches_won / u.matches_played) * 100) : 0;
                      return (
                        <div
                          key={u.id}
                          className="score-card"
                          style={{
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: u.is_banned ? '1.5px solid var(--neon-crimson, #ff3366)' : '1.5px solid rgba(0, 240, 255, 0.25)',
                            background: u.is_banned ? 'rgba(30, 8, 14, 0.88)' : 'rgba(14, 22, 42, 0.85)'
                          }}
                        >
                          <div>
                            {/* Card Top: Avatar, Callsign, Status */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.12)', border: '1.5px solid var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                  {u.avatar_id === 'chynaman' ? '⚔️' : '🥋'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
                                    {u.username}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                                    {u.email}
                                  </div>
                                </div>
                              </div>

                              <span
                                style={{
                                  background: u.is_banned ? 'rgba(255, 51, 102, 0.2)' : 'rgba(57, 255, 20, 0.18)',
                                  border: u.is_banned ? '1px solid var(--neon-crimson, #ff3366)' : '1px solid #39ff14',
                                  color: u.is_banned ? '#ff88aa' : '#39ff14',
                                  padding: '3px 9px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 'bold',
                                  letterSpacing: '1px'
                                }}
                              >
                                {u.is_banned ? 'SUSPENDED' : 'ACTIVE'}
                              </span>
                            </div>

                            {/* Stats Strip */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(5, 10, 24, 0.7)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>STABILITY CRYSTALS</span>
                                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--neon-cyan, #00f0ff)' }}>
                                  💎 {u.crystals_collected || 0}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>WIN RATE</span>
                                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: winRate >= 50 ? '#39ff14' : '#ff88aa' }}>
                                  {winRate}% ({u.matches_won}/{u.matches_played})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                            <button
                              onClick={() => { setCrystalModalUser(u); setNewCrystalCount(u.crystals_collected || 0); }}
                              style={{
                                flex: 1,
                                background: 'rgba(255, 230, 0, 0.1)',
                                border: '1px solid rgba(255, 230, 0, 0.35)',
                                color: 'var(--neon-gold, #ffe600)',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              <Gem size={14} /> Crystals
                            </button>

                            <button
                              onClick={() => setBanModalUser(u)}
                              disabled={u.id === currentUser?.id}
                              style={{
                                flex: 1,
                                background: u.is_banned ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                                border: u.is_banned ? '1px solid #39ff14' : '1px solid var(--neon-crimson, #ff3366)',
                                color: u.is_banned ? '#39ff14' : '#ff88aa',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              {u.is_banned ? <UserCheck size={14} /> : <Ban size={14} />}
                              <span>{u.is_banned ? 'Reinstate' : 'Suspend'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: MATCH HISTORY (DECLUTTERED)
            ========================================================================= */}
            {activeTab === 'matches' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Live Victory Outcomes</h2>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                      Real-time duel outcomes recorded from Kontrola Arena and Simulator
                    </span>
                  </div>
                  <button
                    onClick={loadMatches}
                    style={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      border: '1px solid var(--neon-cyan, #00f0ff)',
                      color: 'var(--neon-cyan, #00f0ff)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={14} className={isMatchesLoading ? 'spin' : ''} /> Refresh Log
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                  {matchHistory.length === 0 ? (
                    <div className="score-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      No matches recorded yet. Completed duels in Kontrola Arena will automatically populate here!
                    </div>
                  ) : (
                    matchHistory.map((m) => (
                      <div key={m.id} className="score-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan, #00f0ff)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            ROOM {m.room_code || 'ARENA'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 230, 0, 0.15)', border: '1.5px solid var(--neon-gold, #ffe600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Crown size={20} color="var(--neon-gold, #ffe600)" />
                          </div>
                          <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)' }}>
                              {m.winner_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#39ff14', fontWeight: 'bold' }}>
                              VICTOR · +{m.crystals_awarded || 1} Stability Crystal
                            </div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(5, 10, 24, 0.7)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                          <strong>Combatants:</strong> {Array.isArray(m.player_names) && m.player_names.length > 0 ? m.player_names.join(' vs ') : 'Multiplayer Combat'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: KNOWLEDGE BASE (DECLUTTERED)
            ========================================================================= */}
            {activeTab === 'rules' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                      <input
                        type="text"
                        placeholder="Search rules, keywords, combat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '11px 16px 11px 42px',
                          background: 'rgba(5, 10, 24, 0.85)',
                          border: '1.5px solid rgba(0, 240, 255, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        background: 'rgba(5, 10, 24, 0.85)',
                        border: '1.5px solid rgba(0, 240, 255, 0.3)',
                        color: '#fff',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                        outline: 'none'
                      }}
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Combat">Combat</option>
                      <option value="Setup">Setup</option>
                      <option value="Energy">Energy</option>
                      <option value="Characters">Characters</option>
                      <option value="Lore">Lore</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setEditingRule(null);
                      setRuleFormData({
                        topic: '',
                        category: 'Combat',
                        keywords: '',
                        short_answer: '',
                        details: '',
                        order_index: rules.length + 1,
                        is_active: true
                      });
                      setIsCreatingRule(true);
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                      border: 'none',
                      color: '#050a18',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '900',
                      letterSpacing: '1px',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)'
                    }}
                  >
                    <Plus size={18} /> NEW RULE
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                  {filteredRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="score-card"
                      style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        opacity: rule.is_active ? 1 : 0.65
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan, #00f0ff)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                            {rule.category || 'Combat'} · #{rule.order_index}
                          </span>
                          <button
                            onClick={() => handleToggleRuleActive(rule)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.is_active ? '#39ff14' : 'rgba(255,255,255,0.4)', padding: 0 }}
                            title={rule.is_active ? 'Active' : 'Inactive'}
                          >
                            {rule.is_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                          </button>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
                          {rule.topic}
                        </h3>

                        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '0 0 14px 0', lineHeight: '1.55', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                          {rule.short_answer}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleFormData({
                              topic: rule.topic,
                              category: rule.category,
                              keywords: Array.isArray(rule.keywords) ? rule.keywords.join(', ') : rule.keywords,
                              short_answer: rule.short_answer,
                              details: rule.details,
                              order_index: rule.order_index,
                              is_active: rule.is_active
                            });
                            setIsCreatingRule(true);
                          }}
                          style={{
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid rgba(0, 240, 255, 0.3)',
                            color: 'var(--neon-cyan, #00f0ff)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          style={{
                            background: 'rgba(255, 51, 102, 0.12)',
                            border: '1px solid rgba(255, 51, 102, 0.3)',
                            color: '#ff88aa',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: QUESTIONS INBOX (DECLUTTERED)
            ========================================================================= */}
            {activeTab === 'questions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Player Feedback & AI Training Loop</h2>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                      Queries asked by combatants across sister apps with 1-click promotion to official rules
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'unhelpful', 'suggested_only'].map((f) => (
                      <button
                        key={f}
                        onClick={() => { setQuestionFilter(f); loadQuestions(); }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: questionFilter === f ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                          background: questionFilter === f ? 'rgba(0, 240, 255, 0.18)' : 'rgba(14, 22, 42, 0.6)',
                          color: questionFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {questions.length === 0 ? (
                    <div className="score-card" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      No player questions logged under this filter yet.
                    </div>
                  ) : (
                    questions.map((q) => (
                      <div
                        key={q.id}
                        className="score-card"
                        style={{
                          padding: '20px',
                          border: q.user_rating === 'unhelpful' ? '1.5px solid var(--neon-crimson, #ff3366)' : '1.5px solid rgba(0, 240, 255, 0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              WARRIOR: {q.user_name || 'Anonymous'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                              {new Date(q.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            {q.user_rating === 'helpful' && <span style={{ color: '#39ff14', fontSize: '0.85rem' }}>👍 Helpful</span>}
                            {q.user_rating === 'unhelpful' && <span style={{ color: '#ff88aa', fontSize: '0.85rem' }}>👎 Flagged Inaccurate</span>}
                          </div>
                        </div>

                        <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 'bold', marginBottom: '10px' }}>
                          ❓ "{q.question_text}"
                        </div>

                        <div style={{ background: 'rgba(5, 10, 24, 0.7)', borderRadius: '8px', padding: '12px', marginBottom: '10px', borderLeft: '3px solid var(--neon-cyan, #00f0ff)', fontSize: '0.9rem', color: '#cbd5e1', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                          <strong>AI Answer:</strong> {q.ai_answer}
                        </div>

                        {q.user_suggested_answer && (
                          <div style={{ background: 'rgba(255, 230, 0, 0.08)', borderRadius: '8px', padding: '12px', marginBottom: '12px', borderLeft: '3px solid var(--neon-gold, #ffe600)', fontSize: '0.9rem', color: '#fff', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                            <strong>Player-Suggested Correction:</strong> "{q.user_suggested_answer}"
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handlePromoteQuestion(q)}
                            style={{
                              background: 'linear-gradient(90deg, #39ff14 0%, #00cc44 100%)',
                              border: 'none',
                              color: '#050a18',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '900',
                              fontSize: '0.88rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)'
                            }}
                          >
                            <Sparkles size={14} /> PROMOTE TO OFFICIAL KNOWLEDGE BASE
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* =========================================================================
              MODAL 1: ADJUST CRYSTALS
          ========================================================================= */}
          {crystalModalUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="score-card" style={{ width: '100%', maxWidth: '400px', border: '2px solid var(--neon-gold, #ffe600)', padding: '28px', boxShadow: '0 0 40px rgba(255, 230, 0, 0.25)' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 8px 0' }}>Adjust Stability Crystals</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                  Set new balance for <strong>{crystalModalUser.username}</strong>:
                </p>
                <input
                  type="number"
                  min="0"
                  value={newCrystalCount}
                  onChange={(e) => setNewCrystalCount(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px',
                    background: 'rgba(5, 10, 24, 0.85)',
                    border: '1.5px solid var(--neon-gold, #ffe600)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '18px'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setCrystalModalUser(null)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCrystals}
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #ffe600 0%, #ffaa00 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Save Balance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 2: BAN CONFIRMATION
          ========================================================================= */}
          {banModalUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="score-card" style={{ width: '100%', maxWidth: '420px', border: '2px solid var(--neon-crimson, #ff3366)', padding: '28px', boxShadow: '0 0 40px rgba(255, 51, 102, 0.3)' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 8px 0' }}>
                  {banModalUser.is_banned ? 'Reinstate Warrior?' : 'Suspend Warrior Account?'}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 20px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                  {banModalUser.is_banned
                    ? `Warrior "${banModalUser.username}" will immediately regain access to the Attention TCG universe.`
                    : `Warrior "${banModalUser.username}" will immediately be signed out and locked out from all modules.`}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setBanModalUser(null)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleToggleBan(banModalUser)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: banModalUser.is_banned ? 'linear-gradient(90deg, #39ff14, #00cc44)' : 'linear-gradient(90deg, #ff2a55, #cc0033)',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {banModalUser.is_banned ? 'Confirm Reinstatement' : 'Confirm Suspension'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 3: CREATE / EDIT RULE
          ========================================================================= */}
          {isCreatingRule && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="score-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--neon-cyan, #00f0ff)', padding: '28px', boxShadow: '0 0 50px rgba(0, 240, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>
                    {editingRule ? 'Edit Official Rule' : 'Create New Game Rule'}
                  </h2>
                  <button onClick={() => setIsCreatingRule(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>TOPIC / RULE TITLE</label>
                    <input
                      type="text"
                      required
                      value={ruleFormData.topic}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, topic: e.target.value })}
                      placeholder="e.g. 2-Stage Clash Roll & DP Armor"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>CATEGORY</label>
                      <select
                        value={ruleFormData.category}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                      >
                        <option value="Combat">Combat</option>
                        <option value="Setup">Setup</option>
                        <option value="Energy">Energy</option>
                        <option value="Characters">Characters</option>
                        <option value="Lore">Lore</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>ORDER INDEX</label>
                      <input
                        type="number"
                        value={ruleFormData.order_index}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, order_index: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>KEYWORDS</label>
                    <input
                      type="text"
                      value={ruleFormData.keywords}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, keywords: e.target.value })}
                      placeholder="dice, clash, roll, defense, dp"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>SPOKEN SHORT SUMMARY</label>
                    <textarea
                      rows={3}
                      required
                      value={ruleFormData.short_answer}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, short_answer: e.target.value })}
                      placeholder="Concise 1-2 sentence spoken breakdown..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>FULL RULEBOOK BREAKDOWN</label>
                    <textarea
                      rows={5}
                      required
                      value={ruleFormData.details}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, details: e.target.value })}
                      placeholder="Detailed rulebook mechanics..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsCreatingRule(false)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
