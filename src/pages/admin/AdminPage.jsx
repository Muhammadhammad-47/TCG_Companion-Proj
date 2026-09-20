import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, BookOpen, HelpCircle, Plus, Search, Filter,
  Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw,
  Copy, Check, ExternalLink, Save, X, ToggleLeft, ToggleRight,
  TrendingUp, Award, Layers, Users, Swords, UserX, UserCheck, Flame,
  Crown, Lock, Ban, Sparkles, Gem, Clock, Zap, LogOut, ChevronRight,
  Server, Globe, LayoutGrid, List, FileCode, Cpu
} from 'lucide-react';
import { authService } from '../../services/authService';
import { knowledgeService } from '../../services/knowledgeService';

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

  // Active Navigation: 'users' | 'matches' | 'rules' | 'questions' | 'sister_apps'
  const [activeTab, setActiveTab] = useState('users');

  // DATA STATES
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [modNotice, setModNotice] = useState('');

  // Modals
  const [crystalModalUser, setCrystalModalUser] = useState(null);
  const [newCrystalCount, setNewCrystalCount] = useState(0);
  const [banModalUser, setBanModalUser] = useState(null);

  // Match History
  const [matchHistory, setMatchHistory] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);

  // Knowledge Base
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [rulesViewMode, setRulesViewMode] = useState('table'); // 'table' | 'cards'
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

  // Questions
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionFilter, setQuestionFilter] = useState('all');
  const [promotedSuccess, setPromotedSuccess] = useState('');

  // Quick Copy
  const [copiedKey, setCopiedKey] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyraulajgkonsukrtcvq.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  // Orientation Lock
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
      console.warn('Failed loading matches:', e);
    } finally {
      setIsMatchesLoading(false);
    }
  };

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const data = await knowledgeService.fetchKnowledgeBase();
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
      const data = await knowledgeService.fetchUserQuestions(questionFilter);
      setQuestions(data);
    } catch (e) {
      console.warn('Failed loading questions:', e);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { user } = await authService.signIn(adminEmail, adminPassword);
      if (!user) throw new Error('Authentication failed. Check credentials.');
      const profile = await authService.getProfile(user.id);
      if (!profile || !profile.is_admin) {
        await authService.signOut();
        throw new Error('Access Denied: You do not possess Administrator permissions.');
      }
      setCurrentUser(user);
      setUserProfile(profile);
      setIsAdmin(true);
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    navigate('/');
  };

  const handleToggleBan = async (targetUser) => {
    const nextBanStatus = !targetUser.is_banned;
    try {
      await authService.toggleUserBan(targetUser.id, nextBanStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_banned: nextBanStatus } : u))
      );
      setModNotice(`Warrior "${targetUser.username}" ${nextBanStatus ? 'suspended' : 'reinstated'} successfully.`);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to update ban status: ' + err.message);
    } finally {
      setBanModalUser(null);
    }
  };

  const handleSaveCrystals = async () => {
    if (!crystalModalUser) return;
    const parsed = parseInt(newCrystalCount, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('Please enter a valid non-negative crystal count.');
      return;
    }
    try {
      await authService.adjustUserCrystals(crystalModalUser.id, parsed);
      setUsersList((prev) =>
        prev.map((u) => (u.id === crystalModalUser.id ? { ...u, crystals_collected: parsed } : u))
      );
      setModNotice(`Updated crystals for ${crystalModalUser.username} to ${parsed} 💎`);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to update crystals: ' + err.message);
    } finally {
      setCrystalModalUser(null);
    }
  };

  const handleToggleRuleActive = async (rule) => {
    try {
      const updated = await knowledgeService.updateRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      alert('Failed to toggle rule active status: ' + err.message);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Permanently delete this game rule from knowledge base?')) return;
    try {
      await knowledgeService.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      setModNotice('Rule deleted successfully.');
      setTimeout(() => setModNotice(''), 3000);
    } catch (err) {
      alert('Failed to delete rule: ' + err.message);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...ruleFormData,
        keywords: typeof ruleFormData.keywords === 'string'
          ? ruleFormData.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : ruleFormData.keywords,
        order_index: parseInt(ruleFormData.order_index, 10) || 0
      };

      if (editingRule) {
        const updated = await knowledgeService.updateRule(editingRule.id, payload);
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? updated : r)));
        setModNotice('Rule updated successfully!');
      } else {
        const created = await knowledgeService.createRule(payload);
        setRules((prev) => [created, ...prev]);
        setModNotice('New rule created and published!');
      }
      setIsCreatingRule(false);
      setEditingRule(null);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to save rule: ' + err.message);
    }
  };

  const handlePromoteQuestion = async (q) => {
    const finalAnswer = q.user_suggested_answer || q.ai_answer || '';
    const newRule = {
      topic: q.question_text.length > 50 ? q.question_text.substring(0, 47) + '...' : q.question_text,
      category: 'Combat',
      keywords: q.question_text.toLowerCase().split(' ').filter((w) => w.length > 3),
      short_answer: finalAnswer.length > 150 ? finalAnswer.substring(0, 147) + '...' : finalAnswer,
      details: `Official Answer to query: "${q.question_text}"\n\nAnswer: ${finalAnswer}`,
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

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  // Filter Users
  const filteredUsers = usersList.filter((u) => {
    if (userFilter === 'ACTIVE') return !u.is_banned;
    if (userFilter === 'BANNED') return u.is_banned;
    return true;
  });

  // Filter Rules
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

  // Navigation Items
  const navItems = [
    { id: 'users', label: 'Warriors Directory', icon: Users, badge: usersList.length },
    { id: 'matches', label: 'Match History', icon: Swords, badge: matchHistory.length },
    { id: 'rules', label: 'Knowledge Base', icon: BookOpen, badge: rules.length },
    { id: 'questions', label: 'Questions Inbox', icon: HelpCircle, badge: questions.length },
    { id: 'sister_apps', label: 'System & Sister APIs', icon: Server, badge: 'Live' }
  ];

  // 1. LOADING VIEW
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

  // 2. ADMIN LOGIN GATE
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
            <div className="menu-bg-elements" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
              <div className="neon-streak-red" style={{ opacity: 0.4 }}></div>
              <div className="neon-streak-blue" style={{ opacity: 0.4 }}></div>
              <div className="subtle-watermark-card left-wm" style={{ opacity: 0.3 }}></div>
              <div className="subtle-watermark-card right-wm" style={{ opacity: 0.3 }}></div>
            </div>

            <div
              style={{
                width: '100%',
                maxWidth: '430px',
                background: 'rgba(14, 22, 42, 0.9)',
                border: '1.5px solid var(--neon-cyan, #00f0ff)',
                borderRadius: '20px',
                padding: '32px',
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
                    padding: '12px',
                    background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#050a18',
                    fontSize: '1.05rem',
                    fontWeight: '900',
                    letterSpacing: '1px',
                    cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
                  }}
                >
                  {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER COMMAND DECK'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
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

  // 3. AUTHENTICATED ADMIN DASHBOARD
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
            fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
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
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: rgba(3, 7, 18, 0.95); }
            ::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.3); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(0, 240, 255, 0.6); }
            .nav-item-btn {
              transition: all 0.2s ease;
            }
            .nav-item-btn:hover {
              background: rgba(0, 240, 255, 0.1) !important;
              color: var(--neon-cyan, #00f0ff) !important;
            }
            .data-row {
              transition: background-color 0.2s ease, border-color 0.2s ease;
            }
            .data-row:hover {
              background: rgba(18, 30, 60, 0.75) !important;
              border-color: rgba(0, 240, 255, 0.35) !important;
            }
            .kpi-card {
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .kpi-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 20px rgba(0, 240, 255, 0.12);
            }
          `}</style>

          {/* Top Bar matching Score Calculator */}
          <header
            style={{
              height: '56px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 24px',
              background: 'rgba(10, 20, 45, 0.94)',
              borderBottom: '1.5px solid rgba(0, 240, 255, 0.25)',
              backdropFilter: 'blur(14px)',
              zIndex: 100,
              flexShrink: 0
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
                  padding: '5px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <ArrowLeft size={15} /> HUB
              </button>
              <div className="brand-pill-badge" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>注意!</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '1.5px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', color: '#fff' }}>
                COMMAND DECK <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontSize: '0.85rem', fontWeight: 'normal', letterSpacing: '1px' }}>// SYSTEM ADMIN</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/docs')}
                style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: 'var(--neon-cyan, #00f0ff)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={13} /> SISTER APIS
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(5, 10, 24, 0.8)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 230, 0, 0.3)' }}>
                <Crown size={14} color="var(--neon-gold, #ffe600)" />
                <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{userProfile?.username || 'Admin'}</span>
              </div>

              <button
                onClick={handleAdminLogout}
                style={{
                  background: 'rgba(255, 51, 102, 0.15)',
                  border: '1px solid var(--neon-crimson, #ff3366)',
                  color: '#ff88aa',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                }}
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Body: Dedicated Left Sidebar + Main Workspace */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
            
            {/* LEFT SIDEBAR NAVIGATION */}
            <aside
              style={{
                width: '240px',
                background: 'rgba(8, 14, 30, 0.95)',
                borderRight: '1px solid rgba(0, 240, 255, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0,
                padding: '16px 12px',
                boxSizing: 'border-box'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', padding: '0 8px 10px 8px', textTransform: 'uppercase' }}>
                  ADMIN MODULES
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isSel = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        className="nav-item-btn"
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: isSel ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid transparent',
                          background: isSel ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                          color: isSel ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255, 255, 255, 0.75)',
                          cursor: 'pointer',
                          fontWeight: isSel ? 'bold' : 'normal',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                          letterSpacing: '0.5px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: isSel ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255, 255, 255, 0.1)',
                            color: isSel ? '#050a18' : 'rgba(255, 255, 255, 0.6)',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Bottom: Quick System Status */}
              <div style={{ background: 'rgba(5, 10, 24, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 8px #39ff14' }}></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#39ff14' }}>ECOSYSTEM ONLINE</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                  Supabase RLS Active · Dual-Tier Fallback
                </div>
              </div>
            </aside>

            {/* MAIN WORKSPACE VIEWPORT */}
            <main
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px 60px 28px',
                boxSizing: 'border-box'
              }}
            >
              {/* Notification Toast */}
              {(modNotice || promotedSuccess) && (
                <div
                  style={{
                    background: 'rgba(57, 255, 20, 0.12)',
                    border: '1px solid #39ff14',
                    color: '#39ff14',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{modNotice || promotedSuccess}</span>
                </div>
              )}

              {/* =========================================================================
                  PAGE 1: WARRIORS DIRECTORY (CLEAN MINIMAL ROWS + KPI STATS)
              ========================================================================= */}
              {activeTab === 'users' && (
                <div>
                  {/* Top Minimal KPI Stat Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL WARRIORS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{usersList.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE COMBATANTS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{usersList.filter(u => !u.is_banned).length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>SUSPENDED</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ff88aa', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{usersList.filter(u => u.is_banned).length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL CRYSTALS CIRCULATING</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        💎 {usersList.reduce((acc, u) => acc + (u.crystals_collected || 0), 0)}
                      </div>
                    </div>
                  </div>

                  {/* Header & Filter Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        WARRIORS DIRECTORY
                      </h2>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Manage player accounts, grant stability crystals, or suspend rule violators
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', width: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                          type="text"
                          placeholder="Search callsign or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '7px 10px 7px 30px',
                            background: 'rgba(5, 10, 24, 0.85)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {['ALL', 'ACTIVE', 'BANNED'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setUserFilter(f)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: userFilter === f ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                            background: userFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'rgba(14, 22, 42, 0.6)',
                            color: userFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.65)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                          }}
                        >
                          {f}
                        </button>
                      ))}

                      <button
                        onClick={loadUsers}
                        style={{
                          background: 'rgba(0, 240, 255, 0.08)',
                          border: '1px solid var(--neon-cyan, #00f0ff)',
                          color: 'var(--neon-cyan, #00f0ff)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={13} className={isUsersLoading ? 'spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Minimal Rows Container */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1fr 1.4fr', padding: '10px 16px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '0.76rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      <span>WARRIOR</span>
                      <span>EMAIL</span>
                      <span>CRYSTALS</span>
                      <span>WIN RATE</span>
                      <span>STATUS</span>
                      <span style={{ textAlign: 'right' }}>ACTIONS</span>
                    </div>

                    {/* Data Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {filteredUsers.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                          No warriors found matching your search filter.
                        </div>
                      ) : (
                        filteredUsers.map((u) => {
                          const winRate = u.matches_played > 0 ? Math.round((u.matches_won / u.matches_played) * 100) : 0;
                          return (
                            <div
                              key={u.id}
                              className="data-row"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1fr 1.4fr',
                                alignItems: 'center',
                                padding: '10px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                background: u.is_banned ? 'rgba(255, 51, 102, 0.05)' : 'transparent',
                                fontSize: '0.86rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                  ⚔️
                                </div>
                                <strong style={{ color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontSize: '0.95rem' }}>
                                  {u.username}
                                </strong>
                              </div>

                              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{u.email}</div>

                              <div>
                                <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold' }}>💎 {u.crystals_collected || 0}</span>
                              </div>

                              <div>
                                <span style={{ color: winRate >= 50 ? '#39ff14' : '#ff88aa', fontWeight: 'bold' }}>
                                  {winRate}%
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginLeft: '4px' }}>
                                  ({u.matches_won}/{u.matches_played})
                                </span>
                              </div>

                              <div>
                                <span
                                  style={{
                                    background: u.is_banned ? 'rgba(255, 51, 102, 0.18)' : 'rgba(57, 255, 20, 0.15)',
                                    color: u.is_banned ? '#ff88aa' : '#39ff14',
                                    border: u.is_banned ? '1px solid var(--neon-crimson, #ff3366)' : '1px solid #39ff14',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  {u.is_banned ? 'SUSPENDED' : 'ACTIVE'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  onClick={() => { setCrystalModalUser(u); setNewCrystalCount(u.crystals_collected || 0); }}
                                  style={{
                                    background: 'rgba(255, 230, 0, 0.1)',
                                    border: '1px solid rgba(255, 230, 0, 0.3)',
                                    color: 'var(--neon-gold, #ffe600)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.74rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  💎 Crystals
                                </button>

                                <button
                                  onClick={() => setBanModalUser(u)}
                                  disabled={u.id === currentUser?.id}
                                  style={{
                                    background: u.is_banned ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                                    border: u.is_banned ? '1px solid #39ff14' : '1px solid var(--neon-crimson, #ff3366)',
                                    color: u.is_banned ? '#39ff14' : '#ff88aa',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                                    fontSize: '0.74rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {u.is_banned ? 'Reinstate' : 'Suspend'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 2: MATCH HISTORY (CLEAN MINIMAL ROWS + KPI STATS)
              ========================================================================= */}
              {activeTab === 'matches' && (
                <div>
                  {/* Top Minimal KPI Stat Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL DUELS LOGGED</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{matchHistory.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CRYSTALS AWARDED</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        💎 {matchHistory.reduce((acc, m) => acc + (m.crystals_awarded || 1), 0)}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE ARENA ROOMS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {new Set(matchHistory.map(m => m.room_code || 'ARENA')).size}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>LATEST CHAMPION</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        👑 {matchHistory[0]?.winner_name || 'No duels yet'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        RECORDED DUEL OUTCOMES
                      </h2>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Logged match victories recorded from Kontrola Arena and Tabletop Simulator
                      </span>
                    </div>

                    <button
                      onClick={loadMatches}
                      style={{
                        background: 'rgba(0, 240, 255, 0.08)',
                        border: '1px solid var(--neon-cyan, #00f0ff)',
                        color: 'var(--neon-cyan, #00f0ff)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={13} className={isMatchesLoading ? 'spin' : ''} /> REFRESH
                    </button>
                  </div>

                  <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr 2fr 1fr', padding: '10px 16px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '0.76rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      <span>DATE & TIME</span>
                      <span>ROOM</span>
                      <span>MODE</span>
                      <span>👑 WINNER</span>
                      <span>COMBATANTS</span>
                      <span style={{ textAlign: 'right' }}>AWARDED</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {matchHistory.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                          No matches recorded yet. Completed duels in Kontrola Arena will automatically populate here!
                        </div>
                      ) : (
                        matchHistory.map((m) => (
                          <div
                            key={m.id}
                            className="data-row"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.5fr 1fr 1fr 2fr 2fr 1fr',
                              alignItems: 'center',
                              padding: '10px 16px',
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                              fontSize: '0.84rem'
                            }}
                          >
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                              {new Date(m.created_at).toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {m.room_code || 'ARENA'}
                            </span>
                            <span>
                              <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                {m.game_mode || 'kontrola'}
                              </span>
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Crown size={14} color="var(--neon-gold, #ffe600)" />
                              <strong style={{ color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontSize: '0.95rem' }}>
                                {m.winner_name}
                              </strong>
                            </div>
                            <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                              {Array.isArray(m.player_names) && m.player_names.length > 0 ? m.player_names.join(' vs ') : '2 Combatants'}
                            </span>
                            <span style={{ textAlign: 'right', fontWeight: 'bold', color: '#39ff14' }}>
                              +{m.crystals_awarded || 1} 💎
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 3: KNOWLEDGE BASE (CLEAN MINIMAL TABLE / CARDS + KPI STATS)
              ========================================================================= */}
              {activeTab === 'rules' && (
                <div>
                  {/* Top Minimal KPI Stat Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL RULES</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{rules.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE IN PRODUCTION</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{rules.filter(r => r.is_active).length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CATEGORIES COUNT</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {new Set(rules.map(r => r.category || 'Combat')).size}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>DRAFT RULES</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {rules.filter(r => !r.is_active).length}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        GAME RULES & KNOWLEDGE BASE
                      </h2>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Live rules database queried by the Chatbot and all sister applications
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', width: '200px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                          type="text"
                          placeholder="Search rules..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '7px 10px 7px 30px',
                            background: 'rgba(5, 10, 24, 0.85)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                          background: 'rgba(5, 10, 24, 0.85)',
                          border: '1px solid rgba(0, 240, 255, 0.25)',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Combat">Combat</option>
                        <option value="Setup">Setup</option>
                        <option value="Energy">Energy</option>
                        <option value="Characters">Characters</option>
                        <option value="Lore">Lore</option>
                      </select>

                      {/* View Mode Toggle: Table vs Cards */}
                      <div style={{ display: 'flex', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '8px', padding: '2px' }}>
                        <button
                          onClick={() => setRulesViewMode('table')}
                          title="Table View"
                          style={{
                            background: rulesViewMode === 'table' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                            border: 'none',
                            color: rulesViewMode === 'table' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.5)',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <List size={14} />
                        </button>
                        <button
                          onClick={() => setRulesViewMode('cards')}
                          title="Cards View"
                          style={{
                            background: rulesViewMode === 'cards' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                            border: 'none',
                            color: rulesViewMode === 'cards' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.5)',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <LayoutGrid size={14} />
                        </button>
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
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Plus size={14} /> NEW RULE
                      </button>
                    </div>
                  </div>

                  {/* Clean Minimal Table View */}
                  {rulesViewMode === 'table' ? (
                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 3fr 1fr 1.2fr', padding: '10px 16px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '0.76rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        <span>TOPIC</span>
                        <span>CATEGORY</span>
                        <span>ORDER</span>
                        <span>SUMMARY</span>
                        <span>STATUS</span>
                        <span style={{ textAlign: 'right' }}>ACTIONS</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredRules.length === 0 ? (
                          <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                            No rules found matching search.
                          </div>
                        ) : (
                          filteredRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="data-row"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 0.8fr 3fr 1fr 1.2fr',
                                alignItems: 'center',
                                padding: '10px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                fontSize: '0.84rem'
                              }}
                            >
                              <strong style={{ color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontSize: '0.95rem' }}>
                                {rule.topic}
                              </strong>
                              <span>
                                <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                                  {rule.category || 'Combat'}
                                </span>
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>#{rule.order_index}</span>
                              <span style={{ color: '#cbd5e1', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {rule.short_answer}
                              </span>
                              <div>
                                <button
                                  onClick={() => handleToggleRuleActive(rule)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.is_active ? '#39ff14' : 'rgba(255,255,255,0.3)', padding: 0 }}
                                  title={rule.is_active ? 'Active in production' : 'Draft mode'}
                                >
                                  {rule.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
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
                                  style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)', color: 'var(--neon-cyan, #00f0ff)', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 'bold' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', color: '#ff88aa', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 'bold' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Clean Rule Cards Grid */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                      {filteredRules.map((rule) => (
                        <div
                          key={rule.id}
                          style={{
                            background: 'rgba(14, 22, 42, 0.75)',
                            border: rule.is_active ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            opacity: rule.is_active ? 1 : 0.65
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {rule.category || 'Combat'} · #{rule.order_index}
                              </span>
                              <button
                                onClick={() => handleToggleRuleActive(rule)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.is_active ? '#39ff14' : 'rgba(255,255,255,0.3)', padding: 0 }}
                                title={rule.is_active ? 'Active' : 'Draft'}
                              >
                                {rule.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                              </button>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 6px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontWeight: 'bold' }}>
                              {rule.topic}
                            </h3>

                            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                              {rule.short_answer}
                            </p>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
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
                              style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)', color: 'var(--neon-cyan, #00f0ff)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 'bold' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', color: '#ff88aa', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 'bold' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  PAGE 4: QUESTIONS INBOX (CLEAN MINIMAL CARDS + KPI STATS)
              ========================================================================= */}
              {activeTab === 'questions' && (
                <div>
                  {/* Top Minimal KPI Stat Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>INBOUND QUERIES</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{questions.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>HELPFUL RATING %</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {questions.length > 0 ? Math.round((questions.filter(q => q.user_rating === 'helpful').length / questions.length) * 100) : 100}%
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>PLAYER CORRECTIONS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {questions.filter(q => q.user_suggested_answer).length}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>UNHELPFUL / FLAGGED</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ff88aa', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {questions.filter(q => q.user_rating === 'unhelpful').length}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        PLAYER QUESTIONS & CONTINUOUS LEARNING
                      </h2>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Review feedback asked by combatants and promote corrections to official rules
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['all', 'unhelpful', 'suggested_only'].map((f) => (
                        <button
                          key={f}
                          onClick={() => { setQuestionFilter(f); loadQuestions(); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: questionFilter === f ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                            background: questionFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'rgba(14, 22, 42, 0.6)',
                            color: questionFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.65)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.78rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {questions.length === 0 ? (
                      <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        No player questions logged under this filter.
                      </div>
                    ) : (
                      questions.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            background: 'rgba(14, 22, 42, 0.75)',
                            border: q.user_rating === 'unhelpful' ? '1px solid var(--neon-crimson, #ff3366)' : '1px solid rgba(0, 240, 255, 0.2)',
                            borderRadius: '12px',
                            padding: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              WARRIOR: {q.user_name || 'Anonymous'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: q.user_rating === 'helpful' ? '#39ff14' : '#ff88aa' }}>
                              {q.user_rating === 'helpful' ? '👍 Helpful' : q.user_rating === 'unhelpful' ? '👎 Inaccurate' : 'Unrated'}
                            </span>
                          </div>

                          <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
                            ❓ "{q.question_text}"
                          </div>

                          <div style={{ background: 'rgba(5, 10, 24, 0.7)', borderRadius: '6px', padding: '10px 12px', marginBottom: '8px', borderLeft: '3px solid var(--neon-cyan, #00f0ff)', fontSize: '0.84rem', color: '#cbd5e1' }}>
                            <strong>AI Answer:</strong> {q.ai_answer}
                          </div>

                          {q.user_suggested_answer && (
                            <div style={{ background: 'rgba(255, 230, 0, 0.08)', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px', borderLeft: '3px solid var(--neon-gold, #ffe600)', fontSize: '0.84rem', color: '#fff' }}>
                              <strong>Player Correction:</strong> "{q.user_suggested_answer}"
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handlePromoteQuestion(q)}
                              style={{
                                background: 'linear-gradient(90deg, #39ff14 0%, #00cc44 100%)',
                                border: 'none',
                                color: '#050a18',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '900',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <Sparkles size={13} /> PROMOTE TO KNOWLEDGE BASE
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 5: SYSTEM & SISTER APIS (NEW DEDICATED CLEAN VIEW)
              ========================================================================= */}
              {activeTab === 'sister_apps' && (
                <div>
                  {/* Top Minimal KPI Stat Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>GATEWAY STATUS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>ONLINE (200 OK)</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>REST DB LATENCY</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>~28ms</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>POSTGRES RLS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>ACTIVE & LOCKED</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CONNECTED SISTER APPS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>4 CLIENT TYPES</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      SYSTEM HOST & SISTER CLIENT ENDPOINTS
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                      Verified connectivity credentials and integration status for all sister applications
                    </span>
                  </div>

                  {/* Config Keys Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>PRODUCTION REST URL</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ color: '#fff', fontSize: '0.86rem' }}>{supabaseUrl}</code>
                        <button onClick={() => handleCopy(supabaseUrl, 'admin_url')} style={{ background: 'none', border: 'none', color: copiedKey === 'admin_url' ? '#39ff14' : 'var(--neon-cyan, #00f0ff)', cursor: 'pointer' }}>
                          {copiedKey === 'admin_url' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>ANON PUBLIC KEY</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.82rem' }}>{anonKey.substring(0, 36)}...</code>
                        <button onClick={() => handleCopy(anonKey, 'admin_key')} style={{ background: 'none', border: 'none', color: copiedKey === 'admin_key' ? '#39ff14' : 'var(--neon-gold, #ffe600)', cursor: 'pointer' }}>
                          {copiedKey === 'admin_key' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connected Sister Applications Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          ⚔️ Kontrola Arena (Web)
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                        Real-time multiplayer duel client. Authenticates warriors via JWT and logs match outcomes directly to <code>matches</code> table.
                      </p>
                      <code style={{ fontSize: '0.74rem', color: 'var(--neon-cyan, #00f0ff)' }}>POST /rest/v1/matches</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          🎲 Tabletop Simulator / Unity
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                        Unity C# client querying active rules and updating stability crystals for victorious warriors.
                      </p>
                      <code style={{ fontSize: '0.74rem', color: 'var(--neon-cyan, #00f0ff)' }}>GET /rest/v1/rules_knowledge</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          📱 Mobile Tournament (Flutter)
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                        Companion app for physical tournaments. Syncs warrior callsigns, crystal inventories, and deck stats.
                      </p>
                      <code style={{ fontSize: '0.74rem', color: 'var(--neon-cyan, #00f0ff)' }}>GET /rest/v1/profiles</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          🤖 AI Rulekeeper Chatbot
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                        Grounded AI rules referee. Logs queries to Questions Inbox and incorporates promoted GM clarifications.
                      </p>
                      <code style={{ fontSize: '0.74rem', color: 'var(--neon-cyan, #00f0ff)' }}>POST /rest/v1/user_questions</code>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>

          {/* =========================================================================
              MODAL 1: ADJUST CRYSTALS
          ========================================================================= */}
          {crystalModalUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ width: '100%', maxWidth: '380px', background: 'rgba(14, 22, 42, 0.95)', border: '1.5px solid var(--neon-gold, #ffe600)', borderRadius: '16px', padding: '24px', boxShadow: '0 0 35px rgba(255, 230, 0, 0.25)' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: '0 0 6px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>Adjust Stability Crystals</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.86rem', margin: '0 0 14px 0' }}>
                  Set balance for <strong>{crystalModalUser.username}</strong>:
                </p>
                <input
                  type="number"
                  min="0"
                  value={newCrystalCount}
                  onChange={(e) => setNewCrystalCount(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px',
                    background: 'rgba(5, 10, 24, 0.85)',
                    border: '1.5px solid var(--neon-gold, #ffe600)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setCrystalModalUser(null)}
                    style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCrystals}
                    style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #ffe600 0%, #ffaa00 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Save
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
              <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(24, 10, 18, 0.95)', border: '1.5px solid var(--neon-crimson, #ff3366)', borderRadius: '16px', padding: '24px', boxShadow: '0 0 35px rgba(255, 51, 102, 0.3)' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: '0 0 6px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                  {banModalUser.is_banned ? 'Reinstate Warrior?' : 'Suspend Warrior?'}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  {banModalUser.is_banned
                    ? `Warrior "${banModalUser.username}" will immediately regain access to the companion and arena.`
                    : `Warrior "${banModalUser.username}" will immediately be signed out and locked out until reinstated.`}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setBanModalUser(null)}
                    style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleToggleBan(banModalUser)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: banModalUser.is_banned ? 'linear-gradient(90deg, #39ff14, #00cc44)' : 'linear-gradient(90deg, #ff2a55, #cc0033)',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
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
              <div style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(14, 22, 42, 0.96)', border: '1.5px solid var(--neon-cyan, #00f0ff)', borderRadius: '20px', padding: '24px', boxShadow: '0 0 45px rgba(0, 240, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                    {editingRule ? 'Edit Official Rule' : 'Create New Game Rule'}
                  </h2>
                  <button onClick={() => setIsCreatingRule(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>TOPIC / RULE TITLE</label>
                    <input
                      type="text"
                      required
                      value={ruleFormData.topic}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, topic: e.target.value })}
                      placeholder="e.g. 2-Stage Clash Roll & DP Armor"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>CATEGORY</label>
                      <select
                        value={ruleFormData.category}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
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
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>ORDER INDEX</label>
                      <input
                        type="number"
                        value={ruleFormData.order_index}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, order_index: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>KEYWORDS</label>
                    <input
                      type="text"
                      value={ruleFormData.keywords}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, keywords: e.target.value })}
                      placeholder="dice, clash, roll, defense, dp"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>SPOKEN SHORT SUMMARY</label>
                    <textarea
                      rows={3}
                      required
                      value={ruleFormData.short_answer}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, short_answer: e.target.value })}
                      placeholder="Concise spoken summary..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>FULL DETAILS</label>
                    <textarea
                      rows={4}
                      required
                      value={ruleFormData.details}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, details: e.target.value })}
                      placeholder="Complete mechanics..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsCreatingRule(false)}
                      style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
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
