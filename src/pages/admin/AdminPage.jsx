import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, BookOpen, HelpCircle, Plus, Search, Filter,
  Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw,
  Copy, Check, ExternalLink, Save, X, ToggleLeft, ToggleRight,
  TrendingUp, Award, Layers, Users, Swords, UserX, UserCheck, Flame,
  Crown, Lock, Ban, Sparkles, Gem, Clock, Zap, LogOut, ChevronRight,
  Server, Globe, LayoutGrid, List, FileCode, Cpu, FileText, Download,
  PlusCircle, FilePlus, Code, AlertCircle
} from 'lucide-react';
import { authService } from '../../services/authService';
import { knowledgeService, calculateGroqMetrics, GROQ_LIMITS } from '../../services/knowledgeService';

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

  // Active Navigation: 'users' | 'matches' | 'rules' | 'questions' | 'tcg_apis'
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

  // Document-based Knowledge Base (Master: public/Knowledge Base/AI_Breakdowns.txt + Custom Documents)
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('ai-breakdowns-master');
  const [docsLoading, setDocsLoading] = useState(false);
  const [docViewMode, setDocViewMode] = useState('breakdown'); // 'breakdown' | 'raw'
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docSectionFilter, setDocSectionFilter] = useState('ALL');

  // Document CRUD Modals
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);
  const [editDocData, setEditDocData] = useState({ title: '', category: '', content: '' });

  const [isAppendModalOpen, setIsAppendModalOpen] = useState(false);
  const [appendData, setAppendData] = useState({
    type: 'qa', // 'qa' | 'section'
    title: '',
    content: ''
  });

  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [newDocData, setNewDocData] = useState({
    filename: '',
    title: '',
    category: 'Tournament & Errata',
    content: ''
  });

  // Legacy Rules State (Backwards compatibility)
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
      loadDocuments();
      loadQuestions();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await authService.fetchAllUsers(userSearch);
      setUsersList(data || []);
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
      setMatchHistory(data || []);
    } catch (e) {
      console.warn('Failed loading matches:', e);
    } finally {
      setIsMatchesLoading(false);
    }
  };

  const loadDocuments = async () => {
    setDocsLoading(true);
    try {
      const docs = await knowledgeService.fetchDocuments();
      setDocuments(docs || []);
      if (docs && docs.length > 0) {
        setSelectedDocId((prev) => {
          const exists = docs.some((d) => d.id === prev);
          return exists ? prev : docs[0].id;
        });
      }
    } catch (e) {
      console.warn('Failed loading knowledge documents:', e);
    } finally {
      setDocsLoading(false);
    }
  };

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const data = await knowledgeService.fetchAllRulesForAdmin();
      setRules(data || []);
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
      setQuestions(data || []);
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
      setModNotice(`User "${targetUser.username}" ${nextBanStatus ? 'suspended' : 'reinstated'} successfully.`);
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
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: !rule.is_active } : r)));
    } catch (err) {
      // In-memory toggle if using fallback ID
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: !rule.is_active } : r)));
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
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
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
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...r, ...payload } : r)));
        setModNotice('Rule updated successfully!');
      } else {
        const created = await knowledgeService.createRule(payload);
        setRules((prev) => [{ ...payload, id: created?.id || `new-${Date.now()}` }, ...prev]);
        setModNotice('New rule created and published!');
      }
      setIsCreatingRule(false);
      setEditingRule(null);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to save rule: ' + err.message);
    }
  };

  // Active selected document
  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === selectedDocId) || documents[0] || null;
  }, [documents, selectedDocId]);

  // Groq metrics for the active document
  const activeDocMetrics = useMemo(() => {
    return calculateGroqMetrics(activeDoc ? activeDoc.content : '');
  }, [activeDoc]);

  // Parse document content into major sections and Q&A pairs
  const parsedDocData = useMemo(() => {
    if (!activeDoc || !activeDoc.content) return { sections: [], qaPairs: [], lineCount: 0 };
    const text = activeDoc.content;
    const lines = text.split('\n');
    const lineCount = lines.length;

    // Major sections (e.g. 1. GENERAL, 2. ACTIONS & COMBAT, etc.)
    const sections = [];
    const sectionRegex = /^([0-9]+\.\s+[A-Z\s&]+)/gm;
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
      if (!sections.includes(match[1].trim())) {
        sections.push(match[1].trim());
      }
    }

    // Q&A blocks
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 10);
    const qaPairs = [];
    for (let b of blocks) {
      const bLines = b.trim().split('\n');
      if (bLines[0].trim().endsWith('?')) {
        const question = bLines[0].trim();
        const answer = bLines.slice(1).join('\n').trim();
        const charLen = b.length;
        const tokenEst = Math.ceil(charLen / 4);
        qaPairs.push({
          question,
          answer,
          fullBlock: b,
          charLen,
          tokenEst,
          isSafeChunk: charLen <= GROQ_LIMITS.RECOMMENDED_MAX_CHUNK_CHARS
        });
      }
    }

    return { sections, qaPairs, lineCount };
  }, [activeDoc]);

  // Filtered Q&A pairs within active document
  const filteredDocQAPairs = useMemo(() => {
    let list = parsedDocData.qaPairs;
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.toLowerCase();
      list = list.filter((item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [parsedDocData.qaPairs, docSearchQuery]);

  // Document Handlers
  const handleOpenEditDocModal = () => {
    if (!activeDoc) return;
    setEditDocData({
      title: activeDoc.title || '',
      category: activeDoc.category || 'General',
      content: activeDoc.content || ''
    });
    setIsEditDocModalOpen(true);
  };

  const handleSaveEditedDoc = async (e) => {
    e.preventDefault();
    if (!activeDoc) return;
    const metrics = calculateGroqMetrics(editDocData.content);
    if (metrics.status === 'EXCEEDED') {
      if (!window.confirm(`⚠️ Caution: Document has ${metrics.charCount.toLocaleString()} chars, exceeding Groq's rubric context window of ${metrics.maxChars.toLocaleString()} chars. Prompts may exceed context limits. Save anyway?`)) {
        return;
      }
    }
    try {
      const updated = await knowledgeService.saveDocument(activeDoc.id, editDocData);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setModNotice(`Document "${updated.filename}" updated successfully! (${metrics.charCount.toLocaleString()} chars)`);
      setIsEditDocModalOpen(false);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to save document: ' + err.message);
    }
  };

  const handleAppendToDoc = async (e) => {
    e.preventDefault();
    if (!activeDoc) return;
    if (!appendData.title.trim() || !appendData.content.trim()) {
      alert('Please fill in both the Question/Heading and Content/Answer fields.');
      return;
    }
    try {
      const updated = await knowledgeService.appendSectionToDocument(activeDoc.id, appendData);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setModNotice(`Appended new section to "${updated.filename}"!`);
      setIsAppendModalOpen(false);
      setAppendData({ type: 'qa', title: '', content: '' });
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to append to document: ' + err.message);
    }
  };

  const handleCreateNewDoc = async (e) => {
    e.preventDefault();
    if (!newDocData.filename.trim()) {
      alert('Please provide a valid document filename.');
      return;
    }
    try {
      const created = await knowledgeService.createDocument(newDocData);
      setDocuments((prev) => [...prev, created]);
      setSelectedDocId(created.id);
      setModNotice(`Created new Knowledge Document "${created.filename}"!`);
      setIsNewDocModalOpen(false);
      setNewDocData({ filename: '', title: '', category: 'Tournament & Errata', content: '' });
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to create document: ' + err.message);
    }
  };

  const handleDeleteDoc = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    if (doc.isMaster || doc.id === 'ai-breakdowns-master') {
      alert('The master document AI_Breakdowns.txt cannot be deleted. You can use "Reset Master Document" instead.');
      return;
    }
    if (!window.confirm(`Permanently delete document "${doc.filename}"?`)) return;
    try {
      await knowledgeService.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSelectedDocId('ai-breakdowns-master');
      setModNotice(`Document "${doc.filename}" removed.`);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  const handleResetMasterDoc = async () => {
    if (!window.confirm('Reset AI_Breakdowns.txt to the original master copy from public/Knowledge Base/AI_Breakdowns.txt? This will discard any manual changes.')) return;
    try {
      const masterDoc = await knowledgeService.resetMasterDocument();
      setDocuments((prev) => prev.map((d) => (d.id === masterDoc.id ? masterDoc : d)));
      setModNotice('AI_Breakdowns.txt restored from local disk file!');
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      alert('Failed to reset master document: ' + err.message);
    }
  };

  const handleDownloadDoc = (doc) => {
    if (!doc || !doc.content) return;
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename || 'AI_Breakdowns.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setModNotice(`Downloaded ${doc.filename} (${(doc.content.length / 1024).toFixed(1)} KB)`);
    setTimeout(() => setModNotice(''), 3000);
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
      // 1. Append directly to active Master Knowledge Base document
      const targetDocId = selectedDocId || 'ai-breakdowns-master';
      await knowledgeService.appendSectionToDocument(targetDocId, {
        title: q.question_text,
        content: finalAnswer,
        type: 'qa'
      });
      await loadDocuments();

      // 2. Also register in database rule index if available
      try {
        const created = await knowledgeService.promoteQuestionToKnowledge(q.id, newRule);
        if (created) setRules((prev) => [created, ...prev]);
      } catch (e) {}

      setPromotedSuccess(`Appended question to Master Knowledge Document & approved!`);
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
      details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(r.keywords) && r.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCat = selectedCategory === 'ALL' || category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Category Badge Colors
  const getCategoryBadge = (cat) => {
    const c = (cat || 'Combat').toLowerCase();
    let bg = 'rgba(0, 240, 255, 0.12)';
    let color = 'var(--neon-cyan, #00f0ff)';
    let border = 'rgba(0, 240, 255, 0.35)';

    if (c === 'combat') {
      bg = 'rgba(255, 42, 85, 0.12)';
      color = 'var(--neon-crimson, #ff2a55)';
      border = 'rgba(255, 42, 85, 0.35)';
    } else if (c === 'energy') {
      bg = 'rgba(255, 230, 0, 0.12)';
      color = 'var(--neon-gold, #ffe600)';
      border = 'rgba(255, 230, 0, 0.35)';
    } else if (c === 'characters') {
      bg = 'rgba(168, 85, 247, 0.12)';
      color = '#c084fc';
      border = 'rgba(168, 85, 247, 0.35)';
    } else if (c === 'lore') {
      bg = 'rgba(57, 255, 20, 0.12)';
      color = '#39ff14';
      border = 'rgba(57, 255, 20, 0.35)';
    }

    return (
      <span style={{ background: bg, color, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
        {cat}
      </span>
    );
  };

  // Sidebar Navigation Items
  const navItems = [
    { id: 'users', label: 'Users Directory', icon: Users, badge: usersList.length },
    { id: 'matches', label: 'Match History', icon: Swords, badge: matchHistory.length },
    { id: 'rules', label: 'Knowledge Base', icon: BookOpen, badge: `${documents.length || 1} Doc` },
    { id: 'questions', label: 'Questions Inbox', icon: HelpCircle, badge: questions.length },
    { id: 'tcg_apis', label: 'TCG APIs', icon: Server, badge: 'Live' }
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
            .category-pill {
              transition: all 0.15s ease;
            }
            .category-pill:hover {
              border-color: var(--neon-cyan, #00f0ff) !important;
              color: #fff !important;
            }
          `}</style>

          {/* Top Bar - Clean & Non-Redundant */}
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

            {/* Top Right: User Identity & Sign Out (NO DUPLICATE TCG APIS BUTTON) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(5, 10, 24, 0.8)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255, 230, 0, 0.3)' }}>
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
                padding: '20px 26px 50px 26px',
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
                    marginBottom: '16px',
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
                  PAGE 1: USERS DIRECTORY
              ========================================================================= */}
              {activeTab === 'users' && (
                <div>
                  {/* Top Minimal KPI Stat Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL USERS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{usersList.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE USERS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{usersList.filter(u => !u.is_banned).length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>SUSPENDED</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ff88aa', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{usersList.filter(u => u.is_banned).length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CIRCULATING CRYSTALS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        💎 {usersList.reduce((acc, u) => acc + (u.crystals_collected || 0), 0)}
                      </div>
                    </div>
                  </div>

                  {/* Header & Filter Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        USERS & PLAYERS DIRECTORY
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                        Manage player accounts, adjust stability crystals, or suspend rule violators
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', width: '220px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                          type="text"
                          placeholder="Search username or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 10px 6px 28px',
                            background: 'rgba(5, 10, 24, 0.85)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {['ALL', 'ACTIVE', 'BANNED'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setUserFilter(f)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: userFilter === f ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                            background: userFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'rgba(14, 22, 42, 0.6)',
                            color: userFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.65)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.76rem',
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
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={12} className={isUsersLoading ? 'spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Minimal Rows Container */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1fr 1.4fr', padding: '10px 16px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '0.74rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      <span>USER / PLAYER</span>
                      <span>EMAIL</span>
                      <span>CRYSTALS</span>
                      <span>WIN RATE</span>
                      <span>STATUS</span>
                      <span style={{ textAlign: 'right' }}>ACTIONS</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {filteredUsers.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                          No users found matching your search filter.
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
                                fontSize: '0.84rem'
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

                              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{u.email}</div>

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
                  PAGE 2: MATCH HISTORY
              ========================================================================= */}
              {activeTab === 'matches' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL DUELS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{matchHistory.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CRYSTALS AWARDED</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        💎 {matchHistory.reduce((acc, m) => acc + (m.crystals_awarded || 1), 0)}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE ARENA ROOMS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {new Set(matchHistory.map(m => m.room_code || 'ARENA')).size}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>LATEST CHAMPION</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        👑 {matchHistory[0]?.winner_name || 'No duels yet'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        RECORDED DUEL OUTCOMES
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                        Logged match victories recorded from Kontrola Arena and Tabletop Simulator
                      </span>
                    </div>

                    <button
                      onClick={loadMatches}
                      style={{
                        background: 'rgba(0, 240, 255, 0.08)',
                        border: '1px solid var(--neon-cyan, #00f0ff)',
                        color: 'var(--neon-cyan, #00f0ff)',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={12} className={isMatchesLoading ? 'spin' : ''} /> REFRESH
                    </button>
                  </div>

                  <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr 2fr 1fr', padding: '10px 16px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '0.74rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      <span>DATE & TIME</span>
                      <span>ROOM</span>
                      <span>MODE</span>
                      <span>👑 WINNER</span>
                      <span>PLAYERS</span>
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
                              fontSize: '0.82rem'
                            }}
                          >
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
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
                              <strong style={{ color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontSize: '0.92rem' }}>
                                {m.winner_name}
                              </strong>
                            </div>
                            <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                              {Array.isArray(m.player_names) && m.player_names.length > 0 ? m.player_names.join(' vs ') : '2 Players'}
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
                  PAGE 3: KNOWLEDGE BASE (DOCUMENT-CENTRIC ENGINE & GROQ RUBRIC)
              ========================================================================= */}
              {activeTab === 'rules' && (
                <div>
                  {/* Top KPI Cards: Document Status & Groq Health */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE DOCUMENT</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                          {activeDoc?.filename || 'AI_Breakdowns.txt'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan, #00f0ff)' }}>
                          {activeDoc?.isMaster ? 'Master Rulebook' : activeDoc?.category || 'Custom Document'}
                        </div>
                      </div>
                      <FileText size={20} color="var(--neon-cyan, #00f0ff)" />
                    </div>

                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL DOCUMENTS</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          {documents.length || 1} Registered
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                          1 Master · {Math.max(0, documents.length - 1)} Expansions
                        </div>
                      </div>
                      <Layers size={20} color="#39ff14" />
                    </div>

                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>DOCUMENT VOLUME</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          {(activeDoc?.content?.length || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>chars</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                          ~{activeDocMetrics.estimatedTokens.toLocaleString()} Tokens · {parsedDocData.lineCount.toLocaleString()} Lines
                        </div>
                      </div>
                      <BookOpen size={20} color="var(--neon-gold, #ffe600)" />
                    </div>

                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: `1px solid ${activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : 'rgba(0, 240, 255, 0.2)'}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>GROQ CONTEXT RUBRIC</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          {activeDocMetrics.utilizationPercent}% Used
                        </div>
                        <div style={{ fontSize: '0.7rem', color: activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14', fontWeight: 'bold' }}>
                          {activeDocMetrics.status === 'EXCEEDED' ? 'LIMIT EXCEEDED' : activeDocMetrics.status === 'WARNING' ? 'APPROACHING LIMIT' : 'RUBRIC COMPLIANT (SAFE)'}
                        </div>
                      </div>
                      <Cpu size={20} color={activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : 'var(--neon-cyan, #00f0ff)'} />
                    </div>
                  </div>

                  {/* GROQ RUBRIC CONTEXT HUD GAUGE */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(14, 22, 42, 0.95) 0%, rgba(6, 12, 28, 0.98) 100%)',
                      border: `1px solid ${activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : 'rgba(0, 240, 255, 0.3)'}`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '14px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.45)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="var(--neon-gold, #ffe600)" />
                        <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>
                          GROQ API CONTEXT RUBRIC MONITOR
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan, #00f0ff)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Model: {GROQ_LIMITS.MODEL}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          <strong style={{ color: activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14' }}>
                            {(activeDoc?.content?.length || 0).toLocaleString()}
                          </strong> / {GROQ_LIMITS.MAX_CONTEXT_CHARS.toLocaleString()} characters
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.3)' }}>·</span>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          ~{activeDocMetrics.estimatedTokens.toLocaleString()} / {GROQ_LIMITS.MAX_CONTEXT_TOKENS.toLocaleString()} tokens
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            background: activeDocMetrics.status === 'EXCEEDED' ? 'rgba(255, 42, 85, 0.2)' : activeDocMetrics.status === 'WARNING' ? 'rgba(255, 230, 0, 0.2)' : 'rgba(57, 255, 20, 0.15)',
                            color: activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14',
                            border: `1px solid ${activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : activeDocMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14'}`
                          }}
                        >
                          {activeDocMetrics.status === 'EXCEEDED' ? 'LIMIT EXCEEDED' : activeDocMetrics.status === 'WARNING' ? 'APPROACHING LIMIT' : 'SAFE FOR INFERENCE'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with safe zone markers */}
                    <div style={{ position: 'relative', width: '100%', height: '8px', background: 'rgba(5, 10, 24, 0.8)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div
                        style={{
                          width: `${Math.min(100, activeDocMetrics.utilizationPercent)}%`,
                          height: '100%',
                          background: activeDocMetrics.status === 'EXCEEDED' ? 'linear-gradient(90deg, #ff2a55, #ff0033)' : activeDocMetrics.status === 'WARNING' ? 'linear-gradient(90deg, #ffe600, #ff8800)' : 'linear-gradient(90deg, #00f0ff, #39ff14)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                          boxShadow: activeDocMetrics.status === 'EXCEEDED' ? '0 0 10px #ff2a55' : '0 0 10px #00f0ff'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                      <span>0 Chars (Empty)</span>
                      <span>32K Chars (Safe Single-Turn Prompt Budget)</span>
                      <span>104K Chars (80% Warning Threshold)</span>
                      <span style={{ color: activeDocMetrics.status === 'EXCEEDED' ? '#ff2a55' : 'rgba(255,255,255,0.6)' }}>131,072 Chars (Groq Context Hard Ceiling)</span>
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.74rem' }}>
                      <span style={{ color: '#94a3b8' }}>
                        💡 <strong>Groq Rubric Rule:</strong> The AI Rulekeeper searches matching sections in this document to answer player queries. Recommended max section chunk: <strong>≤ 4,000 chars (~1,000 tokens)</strong> for instant response generation.
                      </span>
                      <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold' }}>
                        {parsedDocData.qaPairs.filter((p) => p.isSafeChunk).length} / {parsedDocData.qaPairs.length} Q&A blocks compliant
                      </span>
                    </div>
                  </div>

                  {/* DOCUMENT SELECTOR & CRUD TOOLBAR */}
                  <div
                    style={{
                      background: 'rgba(10, 18, 38, 0.9)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      {/* Document Tabs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          DOCUMENTS:
                        </span>
                        {documents.map((doc) => {
                          const isSelected = doc.id === (activeDoc?.id || selectedDocId);
                          return (
                            <button
                              key={doc.id}
                              onClick={() => setSelectedDocId(doc.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: isSelected ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                                background: isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(14, 22, 42, 0.65)',
                                color: isSelected ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <FileText size={13} />
                              <span>{doc.filename}</span>
                              {doc.isMaster && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(0, 240, 255, 0.25)', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                                  MASTER
                                </span>
                              )}
                              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
                                ({((doc.content?.length || 0) / 1024).toFixed(1)} KB)
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Document Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setIsNewDocModalOpen(true)}
                          style={{
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid var(--neon-cyan, #00f0ff)',
                            color: 'var(--neon-cyan, #00f0ff)',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Plus size={13} /> NEW DOCUMENT
                        </button>

                        <button
                          onClick={() => setIsAppendModalOpen(true)}
                          style={{
                            background: 'rgba(57, 255, 20, 0.12)',
                            border: '1px solid #39ff14',
                            color: '#39ff14',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <FilePlus size={13} /> APPEND TO DOC
                        </button>

                        <button
                          onClick={handleOpenEditDocModal}
                          style={{
                            background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                            border: 'none',
                            color: '#050a18',
                            padding: '5px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Edit2 size={13} /> EDIT FULL DOC
                        </button>

                        <button
                          onClick={() => handleDownloadDoc(activeDoc)}
                          title="Download updated .txt file to disk"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={13} /> EXPORT .TXT
                        </button>

                        {activeDoc?.isMaster ? (
                          <button
                            onClick={handleResetMasterDoc}
                            title="Reset AI_Breakdowns.txt to local public file"
                            style={{
                              background: 'rgba(255, 230, 0, 0.08)',
                              border: '1px solid rgba(255, 230, 0, 0.3)',
                              color: 'var(--neon-gold, #ffe600)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.76rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RefreshCw size={12} /> RESET MASTER
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteDoc(activeDoc?.id)}
                            style={{
                              background: 'rgba(255, 42, 85, 0.1)',
                              border: '1px solid rgba(255, 42, 85, 0.3)',
                              color: '#ff88aa',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.76rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} /> DELETE
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Toolbar Row 2: Search + Mode Switcher + Section Outline */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                          type="text"
                          placeholder={`Search in ${activeDoc?.filename || 'document'}...`}
                          value={docSearchQuery}
                          onChange={(e) => setDocSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 10px 6px 30px',
                            background: 'rgba(5, 10, 24, 0.85)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* View Mode Toggle */}
                      <div style={{ display: 'flex', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '6px', padding: '2px' }}>
                        <button
                          onClick={() => setDocViewMode('breakdown')}
                          style={{
                            background: docViewMode === 'breakdown' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                            border: 'none',
                            color: docViewMode === 'breakdown' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.5)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.76rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <LayoutGrid size={13} />
                          <span>Q&A Breakdowns ({filteredDocQAPairs.length})</span>
                        </button>
                        <button
                          onClick={() => setDocViewMode('raw')}
                          style={{
                            background: docViewMode === 'raw' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                            border: 'none',
                            color: docViewMode === 'raw' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.5)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.76rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Code size={13} />
                          <span>Raw Document ({parsedDocData.lineCount} Lines)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* INSPECTOR VIEWPORT */}
                  {docViewMode === 'breakdown' ? (
                    /* VIEW 1: PARSED Q&A CARDS BREAKDOWN */
                    <div>
                      {filteredDocQAPairs.length === 0 ? (
                        <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                          <p style={{ fontSize: '0.95rem', margin: '0 0 10px 0' }}>
                            {docsLoading ? 'Loading document content...' : `No Q&A blocks found matching "${docSearchQuery}".`}
                          </p>
                          <button
                            onClick={() => setIsAppendModalOpen(true)}
                            style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan, #00f0ff)', color: 'var(--neon-cyan, #00f0ff)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            + Append New Q&A to this Document
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                          {filteredDocQAPairs.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: 'rgba(14, 22, 42, 0.8)',
                                border: '1px solid rgba(0, 240, 255, 0.2)',
                                borderRadius: '10px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.15s ease, border-color 0.15s ease'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.12)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    #{idx + 1}
                                  </span>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                                      {item.charLen} chars · ~{item.tokenEst} tokens
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        background: item.isSafeChunk ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 230, 0, 0.15)',
                                        color: item.isSafeChunk ? '#39ff14' : 'var(--neon-gold, #ffe600)'
                                      }}
                                    >
                                      {item.isSafeChunk ? '✓ Safe Groq Chunk' : '⚠️ Large Chunk'}
                                    </span>
                                  </div>
                                </div>

                                <h3 style={{ fontSize: '0.96rem', color: '#fff', margin: '0 0 8px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontWeight: 'bold', lineHeight: '1.4' }}>
                                  {item.question}
                                </h3>

                                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                                  {item.answer}
                                </div>
                              </div>

                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                  {activeDoc?.filename}
                                </span>
                                <button
                                  onClick={() => handleCopy(item.fullBlock, `qa-${idx}`)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: copiedKey === `qa-${idx}` ? '#39ff14' : 'var(--neon-cyan, #00f0ff)',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {copiedKey === `qa-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedKey === `qa-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* VIEW 2: RAW DOCUMENT LINE-NUMBERED VIEWER */
                    <div style={{ background: 'rgba(6, 12, 28, 0.95)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(10, 18, 38, 0.9)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileCode size={16} color="var(--neon-cyan, #00f0ff)" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
                            {activeDoc?.filename}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                            ({parsedDocData.lineCount} lines · {(activeDoc?.content?.length || 0).toLocaleString()} chars)
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleCopy(activeDoc?.content || '', 'raw-doc')}
                            style={{
                              background: 'rgba(0, 240, 255, 0.1)',
                              border: '1px solid rgba(0, 240, 255, 0.3)',
                              color: 'var(--neon-cyan, #00f0ff)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {copiedKey === 'raw-doc' ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedKey === 'raw-doc' ? 'Copied Full Document' : 'Copy All'}</span>
                          </button>

                          <button
                            onClick={handleOpenEditDocModal}
                            style={{
                              background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                              border: 'none',
                              color: '#050a18',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            Edit In Modal
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          maxHeight: '520px',
                          overflowY: 'auto',
                          padding: '12px 16px',
                          fontFamily: 'Consolas, "Fira Code", monospace',
                          fontSize: '0.8rem',
                          color: '#e2e8f0',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          background: 'rgba(5, 10, 24, 0.95)'
                        }}
                      >
                        {(activeDoc?.content || '').split('\n').map((line, lIdx) => {
                          const isHeading = /^[0-9]+\.\s+[A-Z\s&]+/.test(line);
                          const isQuestion = line.trim().endsWith('?');
                          const isHighlighted = docSearchQuery && line.toLowerCase().includes(docSearchQuery.toLowerCase());

                          return (
                            <div
                              key={lIdx}
                              style={{
                                display: 'flex',
                                background: isHighlighted ? 'rgba(255, 230, 0, 0.15)' : 'transparent',
                                borderLeft: isHighlighted ? '2px solid var(--neon-gold, #ffe600)' : 'none',
                                padding: '1px 0'
                              }}
                            >
                              <span style={{ width: '42px', flexShrink: 0, color: 'rgba(255,255,255,0.25)', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                                {lIdx + 1}
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  color: isHeading ? 'var(--neon-gold, #ffe600)' : isQuestion ? 'var(--neon-cyan, #00f0ff)' : '#cbd5e1',
                                  fontWeight: isHeading || isQuestion ? 'bold' : 'normal'
                                }}
                              >
                                {line || '\u00A0'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  PAGE 4: QUESTIONS INBOX
              ========================================================================= */}
              {activeTab === 'questions' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>INBOUND QUERIES</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>{questions.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>HELPFUL RATING %</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {questions.length > 0 ? Math.round((questions.filter(q => q.user_rating === 'helpful').length / questions.length) * 100) : 100}%
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>PLAYER CORRECTIONS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {questions.filter(q => q.user_suggested_answer).length}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>UNHELPFUL / FLAGGED</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ff88aa', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                        {questions.filter(q => q.user_rating === 'unhelpful').length}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        PLAYER QUESTIONS & CONTINUOUS LEARNING
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                        Review feedback submitted by players and promote corrections to official rules
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['all', 'unhelpful', 'suggested_only'].map((f) => (
                        <button
                          key={f}
                          onClick={() => { setQuestionFilter(f); loadQuestions(); }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: questionFilter === f ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                            background: questionFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'rgba(14, 22, 42, 0.6)',
                            color: questionFilter === f ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.65)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.76rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                            borderRadius: '10px',
                            padding: '14px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan, #00f0ff)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              USER: {q.user_name || 'Anonymous'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: q.user_rating === 'helpful' ? '#39ff14' : '#ff88aa' }}>
                              {q.user_rating === 'helpful' ? '👍 Helpful' : q.user_rating === 'unhelpful' ? '👎 Inaccurate' : 'Unrated'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.96rem', color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
                            ❓ "{q.question_text}"
                          </div>

                          <div style={{ background: 'rgba(5, 10, 24, 0.7)', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', borderLeft: '3px solid var(--neon-cyan, #00f0ff)', fontSize: '0.82rem', color: '#cbd5e1' }}>
                            <strong>AI Answer:</strong> {q.ai_answer}
                          </div>

                          {q.user_suggested_answer && (
                            <div style={{ background: 'rgba(255, 230, 0, 0.08)', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', borderLeft: '3px solid var(--neon-gold, #ffe600)', fontSize: '0.82rem', color: '#fff' }}>
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
                                padding: '5px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '900',
                                fontSize: '0.78rem',
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
                  PAGE 5: TCG APIS (CLEAN DEDICATED VIEW)
              ========================================================================= */}
              {activeTab === 'tcg_apis' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>GATEWAY STATUS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#39ff14', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>ONLINE (200 OK)</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>REST DB LATENCY</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>~28ms</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>POSTGRES RLS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--neon-gold, #ffe600)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>ACTIVE & LOCKED</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CONNECTED TCG APPS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>4 CLIENT TYPES</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        TCG APIS & ECOSYSTEM INTEGRATION
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                        Verified connectivity credentials and endpoints for all Attention TCG applications
                      </span>
                    </div>

                    <button
                      onClick={() => navigate('/docs')}
                      style={{
                        background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                        border: 'none',
                        color: '#050a18',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ExternalLink size={13} /> OPEN DEVELOPER PORTAL
                    </button>
                  </div>

                  {/* Config Keys Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>PRODUCTION REST URL</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ color: '#fff', fontSize: '0.84rem' }}>{supabaseUrl}</code>
                        <button onClick={() => handleCopy(supabaseUrl, 'admin_url')} style={{ background: 'none', border: 'none', color: copiedKey === 'admin_url' ? '#39ff14' : 'var(--neon-cyan, #00f0ff)', cursor: 'pointer' }}>
                          {copiedKey === 'admin_url' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>ANON PUBLIC KEY</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.82rem' }}>{anonKey.substring(0, 36)}...</code>
                        <button onClick={() => handleCopy(anonKey, 'admin_key')} style={{ background: 'none', border: 'none', color: copiedKey === 'admin_key' ? '#39ff14' : 'var(--neon-gold, #ffe600)', cursor: 'pointer' }}>
                          {copiedKey === 'admin_key' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connected TCG Applications Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          ⚔️ Kontrola Arena (Web)
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Real-time multiplayer duel client. Authenticates users via JWT and logs match outcomes directly to <code>matches</code> table.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'var(--neon-cyan, #00f0ff)' }}>POST /rest/v1/matches</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          🎲 Tabletop Simulator / Unity
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Unity C# client querying active rules and updating stability crystals for victorious players.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'var(--neon-cyan, #00f0ff)' }}>GET /rest/v1/rules_knowledge</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          📱 Mobile Tournament (Flutter)
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Companion app for physical tournaments. Syncs usernames, crystal inventories, and deck stats.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'var(--neon-cyan, #00f0ff)' }}>GET /rest/v1/profiles</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                          🤖 AI Rulekeeper Assistant
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Grounded AI rules referee. Logs queries to Questions Inbox and incorporates promoted GM clarifications.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'var(--neon-cyan, #00f0ff)' }}>POST /rest/v1/user_questions</code>
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
                  {banModalUser.is_banned ? 'Reinstate User?' : 'Suspend User?'}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  {banModalUser.is_banned
                    ? `User "${banModalUser.username}" will immediately regain access to the companion and arena.`
                    : `User "${banModalUser.username}" will immediately be signed out and locked out until reinstated.`}
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
              MODAL 4: EDIT FULL KNOWLEDGE DOCUMENT
          ========================================================================= */}
          {isEditDocModalOpen && activeDoc && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ width: '100%', maxWidth: '850px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'rgba(12, 18, 36, 0.98)', border: '1.5px solid var(--neon-cyan, #00f0ff)', borderRadius: '18px', padding: '24px', boxShadow: '0 0 50px rgba(0, 240, 255, 0.35)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      EDITING: {activeDoc.filename}
                    </h2>
                    <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)' }}>
                      {activeDoc.isMaster ? 'Master Attention TCG Rulebook (public/Knowledge Base/AI_Breakdowns.txt)' : 'Custom Knowledge Document'}
                    </span>
                  </div>
                  <button onClick={() => setIsEditDocModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Live Groq Rubric HUD in Modal */}
                {(() => {
                  const modalMetrics = calculateGroqMetrics(editDocData.content);
                  return (
                    <div style={{ background: 'rgba(6, 12, 28, 0.9)', border: `1px solid ${modalMetrics.status === 'EXCEEDED' ? '#ff2a55' : modalMetrics.status === 'WARNING' ? '#ffe600' : 'rgba(0, 240, 255, 0.3)'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.78rem' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>
                          ⚡ Groq Context Rubric: <strong style={{ color: modalMetrics.status === 'EXCEEDED' ? '#ff2a55' : modalMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14' }}>{modalMetrics.charCount.toLocaleString()}</strong> / {GROQ_LIMITS.MAX_CONTEXT_CHARS.toLocaleString()} chars (~{modalMetrics.estimatedTokens.toLocaleString()} tokens)
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: modalMetrics.status === 'EXCEEDED' ? '#ff2a55' : modalMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14' }}>
                          {modalMetrics.status === 'EXCEEDED' ? '🚨 EXCEEDS GROQ RUBRIC LIMIT' : modalMetrics.status === 'WARNING' ? '⚠️ APPROACHING CONTEXT CEILING' : '✓ SAFE CONTEXT BUDGET'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(5, 10, 24, 0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, modalMetrics.utilizationPercent)}%`, height: '100%', background: modalMetrics.status === 'EXCEEDED' ? '#ff2a55' : modalMetrics.status === 'WARNING' ? '#ffe600' : '#39ff14' }} />
                      </div>
                    </div>
                  );
                })()}

                <form onSubmit={handleSaveEditedDoc} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px', minHeight: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>DOCUMENT TITLE</label>
                      <input
                        type="text"
                        required
                        value={editDocData.title}
                        onChange={(e) => setEditDocData({ ...editDocData, title: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>CATEGORY</label>
                      <input
                        type="text"
                        value={editDocData.category}
                        onChange={(e) => setEditDocData({ ...editDocData, category: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>DOCUMENT CONTENT (.txt)</label>
                    <textarea
                      required
                      value={editDocData.content}
                      onChange={(e) => setEditDocData({ ...editDocData, content: e.target.value })}
                      style={{
                        flex: 1,
                        minHeight: '260px',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        background: 'rgba(5, 10, 24, 0.95)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                        fontSize: '0.82rem',
                        fontFamily: 'Consolas, "Fira Code", monospace',
                        lineHeight: '1.5',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)' }}>
                      Changes persist immediately to local storage and companion AI.
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsEditDocModalOpen(false)}
                        style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.84rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.84rem' }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 5: APPEND TO DOCUMENT
          ========================================================================= */}
          {isAppendModalOpen && activeDoc && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(14, 22, 42, 0.98)', border: '1.5px solid var(--neon-cyan, #00f0ff)', borderRadius: '18px', padding: '24px', boxShadow: '0 0 45px rgba(0, 240, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      APPEND TO {activeDoc.filename}
                    </h2>
                    <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)' }}>
                      New content will be cleanly appended at the end of the document
                    </span>
                  </div>
                  <button onClick={() => setIsAppendModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAppendToDoc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Mode Selector */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAppendData({ ...appendData, type: 'qa' })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: appendData.type === 'qa' ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                        background: appendData.type === 'qa' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(5, 10, 24, 0.6)',
                        color: appendData.type === 'qa' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.6)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.82rem'
                      }}
                    >
                      Q&A Pair (For AI Rulekeeper)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppendData({ ...appendData, type: 'section' })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: appendData.type === 'section' ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                        background: appendData.type === 'section' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(5, 10, 24, 0.6)',
                        color: appendData.type === 'section' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.6)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.82rem'
                      }}
                    >
                      Raw Section / Rule Block
                    </button>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>
                      {appendData.type === 'qa' ? 'QUESTION (Will auto-append ? if missing)' : 'SECTION HEADING (e.g. 12. TOURNAMENT OVERTIME)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={appendData.title}
                      onChange={(e) => setAppendData({ ...appendData, title: e.target.value })}
                      placeholder={appendData.type === 'qa' ? 'e.g. How does Saigo No Blitz activate when HP is below 50?' : 'e.g. 12. TOURNAMENT ERRATA'}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold' }}>
                        {appendData.type === 'qa' ? 'SPOKEN ANSWER / MECHANIC BREAKDOWN' : 'SECTION BODY TEXT'}
                      </label>
                      <span style={{ fontSize: '0.72rem', color: (appendData.content.length > 4000) ? '#ff2a55' : 'rgba(255,255,255,0.5)' }}>
                        {appendData.content.length} chars / 4,000 recommended single-turn limit
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      required
                      value={appendData.content}
                      onChange={(e) => setAppendData({ ...appendData, content: e.target.value })}
                      placeholder="Write the clear rule breakdown or answer here..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.86rem', lineHeight: '1.5' }}
                    />
                  </div>

                  {/* Formatted Append Preview */}
                  <div style={{ background: 'rgba(5, 10, 24, 0.8)', border: '1px dashed rgba(0, 240, 255, 0.25)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--neon-gold, #ffe600)', fontWeight: 'bold', marginBottom: '4px' }}>
                      PREVIEW OF APPENDED TEXT:
                    </div>
                    <code style={{ fontSize: '0.76rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', display: 'block', maxHeight: '80px', overflowY: 'auto' }}>
                      {appendData.title
                        ? (appendData.type === 'qa'
                            ? `\n${appendData.title.trim().endsWith('?') ? appendData.title.trim() : appendData.title.trim() + '?'}\n${appendData.content.trim() || '[Your answer here]'}\n`
                            : `\n${appendData.title.trim().toUpperCase()}\n\n${appendData.content.trim() || '[Your section content here]'}\n`)
                        : 'Fill in the fields above to preview.'}
                    </code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAppendModalOpen(false)}
                      style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #39ff14, #00cc44)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Append to {activeDoc.filename}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 6: CREATE NEW DOCUMENT
          ========================================================================= */}
          {isNewDocModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(14, 22, 42, 0.98)', border: '1.5px solid var(--neon-cyan, #00f0ff)', borderRadius: '18px', padding: '24px', boxShadow: '0 0 45px rgba(0, 240, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                    ADD NEW KNOWLEDGE DOCUMENT
                  </h2>
                  <button onClick={() => setIsNewDocModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateNewDoc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>FILENAME (.txt)</label>
                    <input
                      type="text"
                      required
                      value={newDocData.filename}
                      onChange={(e) => setNewDocData({ ...newDocData, filename: e.target.value })}
                      placeholder="e.g. Tournament_Rules_2026.txt"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>DOCUMENT TITLE</label>
                      <input
                        type="text"
                        required
                        value={newDocData.title}
                        onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                        placeholder="e.g. Official Tournament & Errata Guide"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.86rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px', fontWeight: 'bold' }}>CATEGORY</label>
                      <input
                        type="text"
                        value={newDocData.category}
                        onChange={(e) => setNewDocData({ ...newDocData, category: e.target.value })}
                        placeholder="e.g. Tournament"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.86rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold' }}>INITIAL CONTENT</label>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                        {newDocData.content.length} chars (Limit: 131,072 chars)
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={newDocData.content}
                      onChange={(e) => setNewDocData({ ...newDocData, content: e.target.value })}
                      placeholder="Add initial Q&A pairs or rules text for this document..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.84rem', fontFamily: 'Consolas, monospace', lineHeight: '1.5' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsNewDocModalOpen(false)}
                      style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Create Document
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

