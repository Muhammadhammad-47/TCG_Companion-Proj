import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, BookOpen, HelpCircle, Plus, Search, Filter,
  Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw,
  Copy, Check, ExternalLink, Save, X, ToggleLeft, ToggleRight,
  TrendingUp, Award, Layers, Users, Swords, UserX, UserCheck, Flame,
  Crown, Lock, Ban, Sparkles, Gem, Clock
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

  // Login Gate State (for unauthenticated admins)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: 'users' | 'matches' | 'rules' | 'questions'
  const [activeTab, setActiveTab] = useState('users');

  // =========================================================================
  // TAB 1: USERS & MODERATION STATE
  // =========================================================================
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BANNED'
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [modNotice, setModNotice] = useState('');

  // Crystal Adjust Modal
  const [crystalModalUser, setCrystalModalUser] = useState(null);
  const [newCrystalCount, setNewCrystalCount] = useState(0);

  // Ban Confirm Modal
  const [banModalUser, setBanModalUser] = useState(null);

  // =========================================================================
  // TAB 2: MATCH HISTORY STATE ("WHO WON")
  // =========================================================================
  const [matchHistory, setMatchHistory] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);

  // =========================================================================
  // TAB 3: RULES KNOWLEDGE STATE
  // =========================================================================
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

  // =========================================================================
  // TAB 4: USER QUESTIONS STATE
  // =========================================================================
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

  // Data Loading Helpers
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

  // Admin Login Handler
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

  // User Moderation Actions
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

  // Rule Actions
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

  // 1-Click Promote User Question to Knowledge Base
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
  // VIEW 2: ADMIN LOGIN GATE
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
              padding: '20px',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div className="menu-bg-elements" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
              <div className="neon-streak-red" style={{ opacity: 0.4 }}></div>
              <div className="neon-streak-blue" style={{ opacity: 0.4 }}></div>
              <div className="subtle-watermark-card left-wm" style={{ opacity: 0.3 }}></div>
              <div className="subtle-watermark-card right-wm" style={{ opacity: 0.3 }}></div>
            </div>

        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(14, 22, 42, 0.92)',
            border: '2px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="brand-pill-badge" style={{ margin: '0 auto 12px auto', fontSize: '0.9rem', padding: '3px 12px' }}>注意!</div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '2px solid var(--neon-cyan, #00f0ff)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan, #00f0ff)',
                marginBottom: '14px',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
              }}
            >
              <Shield size={34} />
            </div>
            <h1 style={{ fontSize: '2rem', color: '#fff', margin: '0 0 6px 0', letterSpacing: '2px', fontWeight: '900' }}>
              ADMINISTRATION GATE
            </h1>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem', margin: 0, fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
              Attention TCG Knowledge Engine & Player Command
            </p>
          </div>

          {loginError && (
            <div
              style={{
                background: 'rgba(255, 51, 102, 0.15)',
                border: '1.5px solid var(--neon-crimson, #ff3366)',
                color: '#ff88aa',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
              }}
            >
              <AlertTriangle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                ADMIN EMAIL
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter administrator email..."
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  background: 'rgba(5, 10, 24, 0.8)',
                  border: '1.5px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
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
                  background: 'rgba(5, 10, 24, 0.8)',
                  border: '1.5px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                marginTop: '10px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                color: '#050a18',
                fontWeight: '900',
                fontSize: '1.15rem',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                opacity: isLoggingIn ? 0.7 : 1,
                boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
                letterSpacing: '1.5px'
              }}
            >
              {isLoggingIn ? 'AUTHENTICATING...' : 'AUTHENTICATE AS ADMIN'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '0.85rem' }}
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
  // VIEW 3: AUTHENTICATED ADMIN CONTROL DECK
  // =========================================================================
  const filteredUsers = usersList.filter((u) => {
    if (userFilter === 'ACTIVE') return !u.is_banned;
    if (userFilter === 'BANNED') return u.is_banned;
    return true;
  });

  const filteredRules = rules.filter((r) => {
    const topic = r.topic || '';
    const details = r.details || '';
    const category = r.category || 'Gameplay';
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
            paddingBottom: '50px'
          }}
        >
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(3, 7, 18, 0.95); }
        ::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 240, 255, 0.6); }
      `}</style>

      {/* Ambient Neon Streaks */}
      <div className="menu-bg-elements" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="neon-streak-red" style={{ opacity: 0.35 }}></div>
        <div className="neon-streak-blue" style={{ opacity: 0.35 }}></div>
        <div className="subtle-watermark-card left-wm" style={{ opacity: 0.25 }}></div>
        <div className="subtle-watermark-card right-wm" style={{ opacity: 0.25 }}></div>
      </div>

      {/* Top Sticky Navigation Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 28px',
          background: 'rgba(13, 26, 56, 0.92)',
          borderBottom: '1.5px solid rgba(0, 240, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: 'var(--neon-cyan, #00f0ff)',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
              fontSize: '0.95rem'
            }}
          >
            <ArrowLeft size={16} /> HUB
          </button>
          <div className="brand-pill-badge" style={{ fontSize: '0.85rem', padding: '2px 10px' }}>注意!</div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '1px' }}>
              ATTENTION TCG <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>COMMAND DECK</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Central Administration & Player Universe Command
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/docs')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#e2e8f0',
              padding: '7px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ExternalLink size={14} /> Sister App APIs
          </button>

          <div style={{ textAlign: 'right', fontSize: '0.88rem' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--neon-gold, #ffe600)' }}>
              👑 {userProfile?.username || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
              {currentUser?.email}
            </div>
          </div>

          <button
            onClick={handleAdminLogout}
            style={{
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1px solid var(--neon-crimson, #ff3366)',
              color: '#ff88aa',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
              fontSize: '0.9rem'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px 28px', boxSizing: 'border-box' }}>
        
        {/* Floating Notification */}
        {(modNotice || promotedSuccess) && (
          <div
            style={{
              background: 'rgba(57, 255, 20, 0.15)',
              border: '1.5px solid #39ff14',
              color: '#39ff14',
              padding: '12px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 'bold'
            }}
          >
            <CheckCircle2 size={20} />
            <span>{modNotice || promotedSuccess}</span>
          </div>
        )}

        {/* 4-Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'users', label: `👥 WARRIORS DIRECTORY (${usersList.length})`, icon: Users },
            { id: 'matches', label: `🏆 MATCH HISTORY (${matchHistory.length})`, icon: Swords },
            { id: 'rules', label: `📚 KNOWLEDGE BASE (${rules.length})`, icon: BookOpen },
            { id: 'questions', label: `❓ QUESTIONS INBOX (${questions.length})`, icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isSel ? 'rgba(0, 240, 255, 0.15)' : 'rgba(14, 22, 42, 0.7)',
                  border: isSel ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isSel ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255, 255, 255, 0.7)',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isSel ? '0 0 20px rgba(0, 240, 255, 0.25)' : 'none'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TAB 1: WARRIOR DIRECTORY & MODERATION
        ========================================================================= */}
        {activeTab === 'users' && (
          <div>
            {/* Top Bar: Search & Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder="Search warrior callsign or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px 10px 38px',
                      background: 'rgba(5, 10, 24, 0.8)',
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
                  onClick={loadUsers}
                  style={{
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid var(--neon-cyan, #00f0ff)',
                    color: 'var(--neon-cyan, #00f0ff)',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} className={isUsersLoading ? 'spin' : ''} /> Search
                </button>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'ACTIVE', 'BANNED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setUserFilter(f)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: userFilter === f ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                      background: userFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0,0,0,0.3)',
                      color: userFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Warriors Table */}
            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 35px rgba(0,0,0,0.4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-sub, "Outfit", sans-serif)', fontSize: '0.92rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(8, 16, 36, 0.95)', borderBottom: '1.5px solid rgba(0, 240, 255, 0.3)', color: 'var(--neon-cyan, #00f0ff)' }}>
                      <th style={{ padding: '14px 18px' }}>WARRIOR CALLSIGN</th>
                      <th style={{ padding: '14px 18px' }}>EMAIL</th>
                      <th style={{ padding: '14px 18px' }}>WIN RATE</th>
                      <th style={{ padding: '14px 18px' }}>CRYSTALS 💎</th>
                      <th style={{ padding: '14px 18px' }}>APP SOURCE</th>
                      <th style={{ padding: '14px 18px' }}>STATUS</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                          No warriors found matching your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const winRate = u.matches_played > 0 ? Math.round((u.matches_won / u.matches_played) * 100) : 0;
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: u.is_banned ? 'rgba(255, 51, 102, 0.05)' : 'transparent' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                  {u.avatar_id === 'chynaman' ? '⚔️' : '🥋'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                                    {u.username}
                                  </div>
                                  {u.is_admin && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--neon-gold, #ffe600)', background: 'rgba(255, 230, 0, 0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{u.email}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold', color: winRate >= 50 ? '#39ff14' : '#ff88aa' }}>{winRate}%</span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>({u.matches_won}/{u.matches_played})</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)', fontSize: '1.05rem' }}>
                                {u.crystals_collected || 0}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                              {u.last_active_app || u.registered_app || 'web'}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              {u.is_banned ? (
                                <span style={{ background: 'rgba(255, 51, 102, 0.18)', color: 'var(--neon-crimson, #ff3366)', border: '1px solid var(--neon-crimson, #ff3366)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  SUSPENDED
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', border: '1px solid #39ff14', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  ACTIVE
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  onClick={() => { setCrystalModalUser(u); setNewCrystalCount(u.crystals_collected || 0); }}
                                  style={{
                                    background: 'rgba(255, 230, 0, 0.1)',
                                    border: '1px solid rgba(255, 230, 0, 0.3)',
                                    color: 'var(--neon-gold, #ffe600)',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Gem size={13} /> Crystals
                                </button>

                                <button
                                  onClick={() => setBanModalUser(u)}
                                  disabled={u.id === currentUser?.id}
                                  style={{
                                    background: u.is_banned ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                                    border: u.is_banned ? '1px solid #39ff14' : '1px solid var(--neon-crimson, #ff3366)',
                                    color: u.is_banned ? '#39ff14' : '#ff88aa',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {u.is_banned ? <UserCheck size={13} /> : <Ban size={13} />}
                                  <span>{u.is_banned ? 'Unban' : 'Ban'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MATCH HISTORY ("WHO WON")
        ========================================================================= */}
        {activeTab === 'matches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Live Match Outcome History</h2>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Real-time victories recorded across Kontrola and tabletop simulators</span>
              </div>
              <button
                onClick={loadMatches}
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid var(--neon-cyan, #00f0ff)',
                  color: 'var(--neon-cyan, #00f0ff)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 'bold'
                }}
              >
                <RefreshCw size={14} className={isMatchesLoading ? 'spin' : ''} /> Refresh History
              </button>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-sub, "Outfit", sans-serif)', fontSize: '0.92rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(8, 16, 36, 0.95)', borderBottom: '1.5px solid rgba(0, 240, 255, 0.3)', color: 'var(--neon-cyan, #00f0ff)' }}>
                      <th style={{ padding: '14px 18px' }}>DATE & TIME</th>
                      <th style={{ padding: '14px 18px' }}>ROOM CODE</th>
                      <th style={{ padding: '14px 18px' }}>GAME MODE</th>
                      <th style={{ padding: '14px 18px' }}>👑 WINNER</th>
                      <th style={{ padding: '14px 18px' }}>PARTICIPANTS</th>
                      <th style={{ padding: '14px 18px' }}>CRYSTALS WON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                          No recorded matches in history yet. Games played in Kontrola Arena will appear here automatically!
                        </td>
                      </tr>
                    ) : (
                      matchHistory.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.85rem' }}>
                            {new Date(m.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)' }}>
                            {m.room_code || 'ARENA'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan, #00f0ff)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                              {m.game_mode || 'kontrola'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Crown size={16} color="var(--neon-gold, #ffe600)" />
                              <strong style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '1rem', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                                {m.winner_name}
                              </strong>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                            {Array.isArray(m.player_names) && m.player_names.length > 0
                              ? m.player_names.join(', ')
                              : '2 Combatants'}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 'bold', color: '#39ff14' }}>
                            +{m.crystals_awarded || 1} 💎
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: KNOWLEDGE BASE MANAGER
        ========================================================================= */}
        {activeTab === 'rules' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder="Search rules, keywords, attack power..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px 10px 38px',
                      background: 'rgba(5, 10, 24, 0.8)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
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
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '10px',
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
                  padding: '10px 20px',
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

            {/* Rules Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    background: 'rgba(14, 22, 42, 0.88)',
                    border: rule.is_active ? '1.5px solid rgba(0, 240, 255, 0.25)' : '1.5px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
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
                        title={rule.is_active ? 'Active (Live)' : 'Inactive (Draft)'}
                      >
                        {rule.is_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
                      {rule.topic}
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: '1.5', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
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
                      <Edit2 size={14} /> Edit
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
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: QUESTIONS INBOX
        ========================================================================= */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Player Questions & Continuous Learning</h2>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Review queries asked by players and promote user corrections to official rules with 1 click</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'unhelpful', 'suggested_only'].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setQuestionFilter(f); loadQuestions(); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: questionFilter === f ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                      background: questionFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0,0,0,0.3)',
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
                <div style={{ background: 'rgba(14, 22, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  No player questions logged under this filter yet.
                </div>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      background: 'rgba(14, 22, 42, 0.88)',
                      border: q.user_rating === 'unhelpful' ? '1.5px solid rgba(255, 51, 102, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginRight: '10px' }}>
                          {new Date(q.created_at).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.78rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 8px', borderRadius: '4px' }}>
                          Warrior: {q.user_name || 'Anonymous'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {q.user_rating === 'helpful' && <span style={{ color: '#39ff14', fontSize: '0.85rem' }}>👍 Helpful</span>}
                        {q.user_rating === 'unhelpful' && <span style={{ color: '#ff88aa', fontSize: '0.85rem' }}>👎 Flagged Inaccurate</span>}
                      </div>
                    </div>

                    <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
                      ❓ "{q.question_text}"
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', borderLeft: '3px solid var(--neon-cyan, #00f0ff)', fontSize: '0.92rem', color: '#cbd5e1', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                      <strong>AI Answer:</strong> {q.ai_answer}
                    </div>

                    {q.user_suggested_answer && (
                      <div style={{ background: 'rgba(255, 230, 0, 0.08)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', borderLeft: '3px solid var(--neon-gold, #ffe600)', fontSize: '0.92rem', color: '#fff', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(14, 22, 42, 0.98)', border: '2px solid var(--neon-gold, #ffe600)', borderRadius: '20px', padding: '28px', boxShadow: '0 0 40px rgba(255, 230, 0, 0.25)' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 8px 0' }}>Adjust Stability Crystals</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 18px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
              Set new Stability Crystals balance for <strong>{crystalModalUser.username}</strong>:
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
                background: 'rgba(0,0,0,0.6)',
                border: '1.5px solid var(--neon-gold, #ffe600)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px'
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
                Save Crystals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: BAN / SUSPEND CONFIRMATION
      ========================================================================= */}
      {banModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(24, 10, 18, 0.98)', border: '2px solid var(--neon-crimson, #ff3366)', borderRadius: '20px', padding: '28px', boxShadow: '0 0 40px rgba(255, 51, 102, 0.3)' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 8px 0' }}>
              {banModalUser.is_banned ? 'Reinstate Warrior?' : 'Suspend Warrior Account?'}
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 20px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
              {banModalUser.is_banned
                ? `Warrior "${banModalUser.username}" will immediately regain full access to the Attention TCG Companion Hub, Chatbot, and Kontrola Arena.`
                : `Warrior "${banModalUser.username}" will immediately be signed out and locked out from all modules until reinstated.`}
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
          <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(14, 22, 42, 0.98)', border: '2px solid var(--neon-cyan, #00f0ff)', borderRadius: '24px', padding: '28px', boxShadow: '0 0 50px rgba(0, 240, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>
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
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>CATEGORY</label>
                  <select
                    value={ruleFormData.category}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
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
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>KEYWORDS (Comma-Separated)</label>
                <input
                  type="text"
                  value={ruleFormData.keywords}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, keywords: e.target.value })}
                  placeholder="dice, clash, roll, defense, dp"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>SHORT SUMMARY (Chatbot Speech Response)</label>
                <textarea
                  rows={3}
                  required
                  value={ruleFormData.short_answer}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, short_answer: e.target.value })}
                  placeholder="Concise 1-2 sentence breakdown that avatars speak aloud..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>FULL DETAILS & STEP-BY-STEP BREAKDOWN</label>
                <textarea
                  rows={6}
                  required
                  value={ruleFormData.details}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, details: e.target.value })}
                  placeholder="Complete rulebook mechanics, dice phases, energy costs, and edge cases..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingRule(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer' }}
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
