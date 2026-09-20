import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { knowledgeService } from '../../services/knowledgeService';
import {
  Shield, BookOpen, MessageSquare, Search, Plus, Edit2, Trash2,
  CheckCircle, XCircle, ArrowLeft, RefreshCw, ThumbsDown, ThumbsUp, Sparkles,
  Lock, AlertTriangle, Key, ExternalLink
} from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();

  // Auth & Admin verification state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Admin login credentials (empty by default, authenticated securely against Supabase DB)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Portal Tabs: only 'knowledge' | 'questions' (Sister apps API moved to /docs)
  const [activeTab, setActiveTab] = useState('knowledge');

  // --- TAB 1: KNOWLEDGE BASE STATE ---
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingRule, setEditingRule] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Rule edit modal form fields
  const [ruleForm, setRuleForm] = useState({
    topic: '',
    category: 'Gameplay',
    keywords: '',
    shortAnswer: '',
    details: '',
    orderIndex: 0,
    isActive: true
  });

  // --- TAB 2: USER QUESTIONS STATE ---
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all', 'unhelpful', 'corrections', 'pending'

  // 1. Initial Session Check
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && isMounted) {
          setCurrentUser(user);
          const profile = await authService.getProfile(user.id);
          setUserProfile(profile);
        }
      } catch (e) {
        console.warn('Admin checkSession failed:', e);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };
    checkSession();
    return () => { isMounted = false; };
  }, []);

  // 2. Load Data when authenticated as admin strictly from DB profile
  const isAdmin = Boolean(userProfile?.is_admin);

  useEffect(() => {
    if (isAdmin) {
      loadRules();
      loadQuestions();
    }
  }, [isAdmin]);

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const data = await knowledgeService.fetchAllRulesForAdmin();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules for admin:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  const loadQuestions = async (filter = questionFilter) => {
    setQuestionsLoading(true);
    try {
      const data = await knowledgeService.fetchUserQuestions({ filter });
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Handle Admin Login strictly against database
  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const authData = await authService.signIn(adminEmail, adminPassword, 'admin_portal');
      if (!authData?.user) {
        throw new Error('Authentication failed. Please verify credentials.');
      }
      const profile = await authService.getProfile(authData.user.id);
      if (!profile || !profile.is_admin) {
        await authService.signOut();
        throw new Error('Access Denied: You do not possess Administrator privileges in the database.');
      }
      setCurrentUser(authData.user);
      setUserProfile(profile);
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
  };

  // Rule CRUD handlers
  const handleOpenCreateRule = () => {
    setIsCreatingNew(true);
    setRuleForm({
      topic: '',
      category: 'Gameplay',
      keywords: '',
      shortAnswer: '',
      details: '',
      orderIndex: rules.length + 1,
      isActive: true
    });
    setEditingRule({});
  };

  const handleOpenEditRule = (rule) => {
    setIsCreatingNew(false);
    setRuleForm({
      topic: rule.topic || '',
      category: rule.category || 'Gameplay',
      keywords: Array.isArray(rule.keywords) ? rule.keywords.join(', ') : (rule.keywords || ''),
      shortAnswer: rule.short_answer || '',
      details: rule.details || '',
      orderIndex: rule.order_index ?? 0,
      isActive: rule.is_active ?? true
    });
    setEditingRule(rule);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const keywordsArray = ruleForm.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    try {
      if (isCreatingNew) {
        await knowledgeService.createRule({
          topic: ruleForm.topic,
          category: ruleForm.category,
          keywords: keywordsArray,
          short_answer: ruleForm.shortAnswer,
          details: ruleForm.details,
          order_index: parseInt(ruleForm.orderIndex, 10) || 0,
          is_active: ruleForm.isActive
        });
      } else {
        await knowledgeService.updateRule(editingRule.id, {
          topic: ruleForm.topic,
          category: ruleForm.category,
          keywords: keywordsArray,
          short_answer: ruleForm.shortAnswer,
          details: ruleForm.details,
          order_index: parseInt(ruleForm.orderIndex, 10) || 0,
          is_active: ruleForm.isActive
        });
      }
      setEditingRule(null);
      await loadRules();
    } catch (err) {
      alert('Error saving rule: ' + err.message);
    }
  };

  const handleToggleRuleActive = async (rule) => {
    try {
      await knowledgeService.updateRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to permanently delete this rule from the knowledge base?')) return;
    try {
      await knowledgeService.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      alert('Failed to delete rule: ' + err.message);
    }
  };

  // Promote User Question to Knowledge Base
  const handlePromoteToKnowledge = (q) => {
    setIsCreatingNew(true);
    setRuleForm({
      topic: q.question_text || '',
      category: 'Gameplay',
      keywords: (q.question_text || '')
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter((w) => w.length > 2)
        .join(', '),
      shortAnswer: q.user_suggested_answer || q.ai_answer || '',
      details: q.user_suggested_answer || q.ai_answer || '',
      orderIndex: rules.length + 1,
      isActive: true
    });
    setEditingRule({});
    setActiveTab('knowledge');
  };

  // =========================================================================
  // VIEW 1: LOADING STATE
  // =========================================================================
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 50% 20%, #0d1a38 0%, #050a18 70%, #02040c 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neon-cyan, #00f0ff)',
          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
        }}
      >
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--neon-cyan, #00f0ff)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', letterSpacing: '3px', fontSize: '1.2rem', fontWeight: 'bold' }}>
          INITIALIZING ADMIN CONTROL DECK...
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ADMIN LOGIN GATE (Matching App UI/UX)
  // =========================================================================
  if (!isAdmin) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          minHeight: '100vh',
          background: 'radial-gradient(circle at 50% 20%, #0d1a38 0%, #050a18 70%, #02040c 100%)',
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
        {/* Ambient Neon Streaks matching the whole app */}
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
            background: 'rgba(14, 22, 42, 0.9)',
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
              Attention TCG Knowledge Engine & Questions Command
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
                letterSpacing: '1.5px',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)'
              }}
            >
              {isLoggingIn ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE AS ADMIN'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
              }}
            >
              <ArrowLeft size={16} /> Return to Companion Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: AUTHENTICATED ADMIN DASHBOARD (Matching App UI/UX)
  // =========================================================================
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
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, #0d1a38 0%, #050a18 70%, #02040c 100%)',
        color: 'var(--text-main, #f8fafc)',
        fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box',
        paddingBottom: '50px'
      }}
    >
      {/* Ambient Neon Streaks matching the whole app */}
      <div className="menu-bg-elements" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="neon-streak-red" style={{ opacity: 0.35 }}></div>
        <div className="neon-streak-blue" style={{ opacity: 0.35 }}></div>
        <div className="subtle-watermark-card left-wm" style={{ opacity: 0.25 }}></div>
        <div className="subtle-watermark-card right-wm" style={{ opacity: 0.25 }}></div>
      </div>

      {/* Top Navigation Bar */}
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
              ATTENTION TCG <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>CONTROL DECK</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Central Knowledge Base & Player Continuous Learning
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', position: 'relative', zIndex: 1 }}>

        {/* 2 Primary Tabs: Knowledge Base & User Questions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('knowledge')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '12px',
                border: activeTab === 'knowledge' ? '2px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                background: activeTab === 'knowledge' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'knowledge' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.65)',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                boxShadow: activeTab === 'knowledge' ? '0 0 15px rgba(0, 240, 255, 0.25)' : 'none'
              }}
            >
              <BookOpen size={18} />
              <span>KNOWLEDGE BASE ({rules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '12px',
                border: activeTab === 'questions' ? '2px solid var(--neon-gold, #ffe600)' : '1px solid rgba(255,255,255,0.12)',
                background: activeTab === 'questions' ? 'rgba(255, 230, 0, 0.15)' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'questions' ? 'var(--neon-gold, #ffe600)' : 'rgba(255,255,255,0.65)',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                boxShadow: activeTab === 'questions' ? '0 0 15px rgba(255, 230, 0, 0.25)' : 'none'
              }}
            >
              <MessageSquare size={18} />
              <span>USER QUESTIONS INBOX ({questions.length})</span>
            </button>
          </div>

          {/* Quick link to /docs page */}
          <button
            onClick={() => navigate('/docs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(57, 255, 20, 0.35)',
              background: 'rgba(57, 255, 20, 0.08)',
              color: '#39ff14',
              fontSize: '0.88rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
            }}
            title="Sister Apps & API Documentation (/docs)"
          >
            <ExternalLink size={14} /> SISTER APPS API DOCS (/docs)
          </button>
        </div>

        {/* =========================================================================
            TAB 1: KNOWLEDGE BASE MANAGER
        ========================================================================= */}
        {activeTab === 'knowledge' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '320px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rules, keywords, or answers..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px 10px 38px',
                      background: 'rgba(5, 10, 24, 0.8)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
                      color: '#fff',
                      outline: 'none',
                      fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
                    }}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                    fontWeight: 'bold'
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Gameplay">Gameplay</option>
                  <option value="Combat">Combat</option>
                  <option value="Setup">Setup</option>
                  <option value="Characters">Characters</option>
                  <option value="Cards">Cards</option>
                  <option value="Lore">Lore</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={loadRules}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                    fontWeight: 'bold'
                  }}
                >
                  <RefreshCw size={16} className={rulesLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleOpenCreateRule}
                  style={{
                    background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                    border: 'none',
                    color: '#050a18',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '900',
                    fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                    letterSpacing: '1px',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                  }}
                >
                  <Plus size={18} />
                  <span>ADD NEW RULE</span>
                </button>
              </div>
            </div>

            {/* Rules Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRules.length === 0 ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(14, 22, 42, 0.7)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.5)'
                  }}
                >
                  No rules found matching your filters. Click "ADD NEW RULE" to add the first database rule!
                </div>
              ) : (
                filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      background: 'rgba(14, 22, 42, 0.85)',
                      border: `1.5px solid ${rule.is_active ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 51, 102, 0.25)'}`,
                      borderRadius: '16px',
                      padding: '18px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      opacity: rule.is_active ? 1 : 0.65
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: 'rgba(0, 240, 255, 0.15)',
                            color: 'var(--neon-cyan, #00f0ff)',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                          }}
                        >
                          {rule.category || 'Gameplay'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                          Index: #{rule.order_index ?? 0}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            color: rule.is_active ? '#39ff14' : '#ff3366'
                          }}
                        >
                          {rule.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {rule.is_active ? 'LIVE IN CHATBOT' : 'DISABLED'}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#fff', letterSpacing: '0.5px' }}>
                        {rule.topic}
                      </h3>

                      <p style={{ margin: '0 0 10px 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', fontFamily: 'var(--font-sub, "Outfit", sans-serif)', lineHeight: '1.5' }}>
                        {rule.short_answer}
                      </p>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(Array.isArray(rule.keywords) ? rule.keywords : []).map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: 'rgba(255,255,255,0.6)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace'
                            }}
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleRuleActive(rule)}
                        title={rule.is_active ? 'Disable from live chatbot' : 'Enable in live chatbot'}
                        style={{
                          background: rule.is_active ? 'rgba(57, 255, 20, 0.12)' : 'rgba(255, 51, 102, 0.12)',
                          border: `1px solid ${rule.is_active ? '#39ff14' : '#ff3366'}`,
                          color: rule.is_active ? '#39ff14' : '#ff3366',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                        }}
                      >
                        {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                      <button
                        onClick={() => handleOpenEditRule(rule)}
                        style={{
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: '1px solid var(--neon-cyan, #00f0ff)',
                          color: 'var(--neon-cyan, #00f0ff)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        style={{
                          background: 'rgba(255, 51, 102, 0.1)',
                          border: '1px solid var(--neon-crimson, #ff3366)',
                          color: '#ff88aa',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: USER QUESTIONS INBOX
        ========================================================================= */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Questions' },
                  { id: 'unhelpful', label: 'Flagged Inaccurate (👎)' },
                  { id: 'corrections', label: 'User Corrections Submitted' },
                  { id: 'pending', label: 'Pending Review' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setQuestionFilter(f.id);
                      loadQuestions(f.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: questionFilter === f.id ? '1.5px solid var(--neon-gold, #ffe600)' : '1px solid rgba(255,255,255,0.12)',
                      background: questionFilter === f.id ? 'rgba(255, 230, 0, 0.18)' : 'rgba(0,0,0,0.3)',
                      color: questionFilter === f.id ? 'var(--neon-gold, #ffe600)' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => loadQuestions()}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  fontWeight: 'bold'
                }}
              >
                <RefreshCw size={16} className={questionsLoading ? 'animate-spin' : ''} />
                <span>Refresh Inbox</span>
              </button>
            </div>

            {/* Questions Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {questions.length === 0 ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(14, 22, 42, 0.7)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.5)'
                  }}
                >
                  No user questions logged matching this filter. Ask questions in the TCG Chatbot to see real-time player interactions appear here!
                </div>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      background: 'rgba(14, 22, 42, 0.85)',
                      border: `1.5px solid ${q.user_rating === 'unhelpful' ? 'rgba(255, 51, 102, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)', fontSize: '0.95rem' }}>
                          👤 {q.user_name || 'Warrior'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                          {new Date(q.created_at).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.6)' }}>
                          App: {q.app_source || 'companion_hub'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {q.user_rating === 'helpful' && (
                          <span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ThumbsUp size={12} /> Helpful
                          </span>
                        )}
                        {q.user_rating === 'unhelpful' && (
                          <span style={{ background: 'rgba(255, 51, 102, 0.15)', color: 'var(--neon-crimson, #ff3366)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ThumbsDown size={12} /> Flagged Inaccurate
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--neon-gold, #ffe600)', background: 'rgba(255, 230, 0, 0.1)', padding: '3px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                          Status: {q.admin_status || 'pending'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Player Asked:</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
                        "{q.question_text}"
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan, #00f0ff)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                        Oracle AI Response:
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                        {q.ai_answer}
                      </div>
                    </div>

                    {q.user_suggested_answer && (
                      <div style={{ background: 'rgba(255, 230, 0, 0.08)', border: '1.5px solid rgba(255, 230, 0, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold, #ffe600)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                          💡 Warrior's Suggested Correction:
                        </div>
                        <div style={{ fontSize: '0.92rem', color: '#fff', fontStyle: 'italic', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                          "{q.user_suggested_answer}"
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                      <button
                        onClick={() => handlePromoteToKnowledge(q)}
                        style={{
                          background: 'linear-gradient(90deg, #ffe600 0%, #ff9900 100%)',
                          border: 'none',
                          color: '#050a18',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.88rem',
                          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                          boxShadow: '0 0 12px rgba(255, 230, 0, 0.25)'
                        }}
                      >
                        <Sparkles size={16} />
                        <span>PROMOTE TO KNOWLEDGE BASE</span>
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
          ADD / EDIT RULE MODAL (Cyber Theme matching App)
      ========================================================================= */}
      {editingRule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setEditingRule(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'rgba(14, 22, 42, 0.96)',
              border: '2px solid var(--neon-cyan, #00f0ff)',
              borderRadius: '20px',
              padding: '30px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: '900', letterSpacing: '1px' }}>
                {isCreatingNew ? 'ADD NEW RULES KNOWLEDGE' : 'EDIT RULES KNOWLEDGE'}
              </h3>
              <div className="brand-pill-badge" style={{ fontSize: '0.8rem', padding: '2px 10px' }}>注意!</div>
            </div>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: 'bold' }}>TOPIC TITLE</label>
                <input
                  type="text"
                  value={ruleForm.topic}
                  onChange={(e) => setRuleForm({ ...ruleForm, topic: e.target.value })}
                  placeholder="e.g. 2-Stage Clash Roll & DP Rule"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: 'bold' }}>CATEGORY</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      background: 'rgba(5, 10, 24, 0.8)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                      fontWeight: 'bold',
                      outline: 'none'
                    }}
                  >
                    <option value="Gameplay">Gameplay</option>
                    <option value="Combat">Combat</option>
                    <option value="Setup">Setup</option>
                    <option value="Characters">Characters</option>
                    <option value="Cards">Cards</option>
                    <option value="Lore">Lore</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: 'bold' }}>ORDER INDEX</label>
                  <input
                    type="number"
                    value={ruleForm.orderIndex}
                    onChange={(e) => setRuleForm({ ...ruleForm, orderIndex: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      background: 'rgba(5, 10, 24, 0.8)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: 'bold' }}>
                  SEARCH KEYWORDS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={ruleForm.keywords}
                  onChange={(e) => setRuleForm({ ...ruleForm, keywords: e.target.value })}
                  placeholder="dice, clash, roll, defense point, 6, dp"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: 'bold' }}>
                  SHORT ANSWER (SPOKEN BY AI AVATAR TTS)
                </label>
                <textarea
                  rows={3}
                  value={ruleForm.shortAnswer}
                  onChange={(e) => setRuleForm({ ...ruleForm, shortAnswer: e.target.value })}
                  placeholder="Keep concise: 1-3 sentences spoken aloud by avatar."
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: 'bold' }}>
                  FULL DETAILS (DETAILED TEXT IN CHAT CARD)
                </label>
                <textarea
                  rows={6}
                  value={ruleForm.details}
                  onChange={(e) => setRuleForm({ ...ruleForm, details: e.target.value })}
                  placeholder="Full bulleted rule breakdown for reading."
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: '0.95rem', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  Active & Live for Players in Chatbot
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                    fontWeight: 'bold',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 26px',
                    background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                    border: 'none',
                    color: '#050a18',
                    borderRadius: '10px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                    letterSpacing: '1px',
                    fontSize: '1rem',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                  }}
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
