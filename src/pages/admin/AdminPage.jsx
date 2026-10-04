import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, BookOpen, HelpCircle, Plus, Search, Filter,
  Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw,
  Copy, Check, ExternalLink, Save, X, ToggleLeft, ToggleRight,
  TrendingUp, Award, Layers, Users, Swords, UserX, UserCheck, Flame,
  Crown, Lock, Ban, Sparkles, Gem, Clock, Zap, LogOut, ChevronRight,
  Server, Globe, LayoutGrid, List, FileCode, Cpu, FileText, Download,
  PlusCircle, FilePlus, Code, AlertCircle, Coins, ShoppingCart, Music, Play, Pause,
  Bug, MonitorX, ZapOff, MessageSquare
} from 'lucide-react';
import { authService } from '../../services/authService';
import { knowledgeService, calculateGroqMetrics, GROQ_LIMITS } from '../../services/knowledgeService';
import { economyService } from '../../services/economyService';
import { musicService } from '../../services/musicService';
import { bugReportService } from '../../services/bugReportService';
import MusicPlayer from '../../components/MusicPlayer';
import MusicUploadProgress from '../../components/MusicUploadProgress';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
  const [isSavingDoc, setIsSavingDoc] = useState(false);
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
  const [questionFilter, setQuestionFilter] = useState('pending');
  const [promotedSuccess, setPromotedSuccess] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');

  // Monetization State
  const [appSettings, setAppSettings] = useState({ match_cost: 1, premium_modules: ['kontrola'], module_costs: {} });
  const [storeBundles, setStoreBundles] = useState([]);
  const [redeemCodes, setRedeemCodes] = useState([]);
  const [isEconomyLoading, setIsEconomyLoading] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingCode, setEditingCode] = useState(null);

  // Music Library State
  const [musicTracks, setMusicTracks] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicFilter, setMusicFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'success' | 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploadProgressOpen, setIsUploadProgressOpen] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // Bug Reports State
  const [bugReports, setBugReports] = useState([]);
  const [bugReportsLoading, setBugReportsLoading] = useState(false);
  const [bugReportFilter, setBugReportFilter] = useState('new'); // 'new' | 'investigating' | 'resolved' | 'dismissed' | 'all'
  const [expandedBugId, setExpandedBugId] = useState(null);
  const [bugAdminNotes, setBugAdminNotes] = useState({});

  // Quick Copy
  const [copiedKey, setCopiedKey] = useState('');

  // In-app confirm dialog (replaces all window.confirm / alert)
  const [confirmDialog, setConfirmDialog] = useState(null);
  // confirmDialog = { title, message, onConfirm, confirmLabel, isDanger }
  const [inlineError, setInlineError] = useState('');

  const showConfirm = (title, message, onConfirm, opts = {}) => {
    setConfirmDialog({ title, message, onConfirm, confirmLabel: opts.confirmLabel || 'Confirm', isDanger: opts.isDanger !== false });
  };
  const showError = (msg) => {
    setModNotice('⚠️ ' + msg);
    setTimeout(() => setModNotice(''), 5000);
  };

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
      loadEconomyData();
      loadMusic();
      loadBugReports();
    }
  }, [isAdmin]);

  const loadBugReports = async (statusFilter = null) => {
    setBugReportsLoading(true);
    try {
      const reports = await bugReportService.fetchBugReports({ status: statusFilter, limit: 150 });
      setBugReports(reports || []);
    } catch (e) {
      console.warn('Failed to load bug reports:', e);
    } finally {
      setBugReportsLoading(false);
    }
  };

  const loadEconomyData = async () => {
    setIsEconomyLoading(true);
    try {
      const settings = await economyService.getAppSettings();
      setAppSettings(settings);
      const bundles = await economyService.getStoreBundles();
      setStoreBundles(bundles);
      const codes = await economyService.getAllRedeemCodes();
      setRedeemCodes(codes);
    } catch (e) {
      console.warn('Failed to load economy data', e);
    } finally {
      setIsEconomyLoading(false);
    }
  };

  const loadMusic = async () => {
    setMusicLoading(true);
    try {
      const tracks = await musicService.getAllMusic();
      setMusicTracks(tracks || []);
    } catch (e) {
      console.warn('Failed to load music tracks:', e);
    } finally {
      setMusicLoading(false);
    }
  };

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

  const loadQuestions = async (filter) => {
    setQuestionsLoading(true);
    const activeFilter = filter !== undefined ? filter : questionFilter;
    try {
      const data = await knowledgeService.fetchUserQuestions({ filter: activeFilter });
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
      showError('Failed to update ban status: ' + err.message);
    } finally {
      setBanModalUser(null);
    }
  };

  const handleSaveCrystals = async () => {
    if (!crystalModalUser) return;
    const parsed = parseInt(newCrystalCount, 10);
    if (isNaN(parsed) || parsed < 0) {
      showError('Please enter a valid non-negative crystal count.');
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
      showError('Failed to update crystals: ' + err.message);
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
    showConfirm(
      'Delete Rule',
      'Permanently delete this game rule from the knowledge base?',
      async () => {
        try {
          await knowledgeService.deleteRule(ruleId);
          setRules((prev) => prev.filter((r) => r.id !== ruleId));
          setModNotice('Rule deleted successfully.');
          setTimeout(() => setModNotice(''), 3000);
        } catch (err) {
          setRules((prev) => prev.filter((r) => r.id !== ruleId));
        }
      },
      { confirmLabel: 'Delete', isDanger: true }
    );
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
      showError('Failed to save rule: ' + err.message);
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
      showConfirm(
        'Document Exceeds Context Limit',
        `Document has ${metrics.charCount.toLocaleString()} chars, exceeding Groq's context window of ${metrics.maxChars.toLocaleString()} chars. Prompts may exceed context limits. Save anyway?`,
        async () => {
          setIsSavingDoc(true);
          try {
            const updated = await knowledgeService.saveDocument(activeDoc.id, editDocData);
            setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setModNotice(`Document "${updated.filename}" updated! (${metrics.charCount.toLocaleString()} chars)`);
            setIsEditDocModalOpen(false);
            setTimeout(() => setModNotice(''), 4000);
          } catch (err) {
            showError('Failed to save document: ' + err.message);
          } finally {
            setIsSavingDoc(false);
          }
        },
        { confirmLabel: 'Save Anyway', isDanger: false }
      );
      return;
    }
    setIsSavingDoc(true);
    try {
      const updated = await knowledgeService.saveDocument(activeDoc.id, editDocData);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setModNotice(`Document "${updated.filename}" updated successfully! (${metrics.charCount.toLocaleString()} chars)`);
      setIsEditDocModalOpen(false);
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      showError('Failed to save document: ' + err.message);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleAppendToDoc = async (e) => {
    e.preventDefault();
    if (!activeDoc) return;
    if (!appendData.title.trim() || !appendData.content.trim()) {
      showError('Please fill in both the Question/Heading and Content/Answer fields.');
      return;
    }
    setIsSavingDoc(true);
    try {
      const updated = await knowledgeService.appendSectionToDocument(activeDoc.id, appendData);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setModNotice(`Appended new section to "${updated.filename}"!`);
      setIsAppendModalOpen(false);
      setAppendData({ type: 'qa', title: '', content: '' });
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      showError('Failed to append to document: ' + err.message);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleCreateNewDoc = async (e) => {
    e.preventDefault();
    if (!newDocData.filename.trim()) {
      showError('Please provide a valid document filename.');
      return;
    }
    setIsSavingDoc(true);
    try {
      const created = await knowledgeService.createDocument(newDocData);
      setDocuments((prev) => [...prev, created]);
      setSelectedDocId(created.id);
      setModNotice(`Created new Knowledge Document "${created.filename}"!`);
      setIsNewDocModalOpen(false);
      setNewDocData({ filename: '', title: '', category: 'Tournament & Errata', content: '' });
      setTimeout(() => setModNotice(''), 4000);
    } catch (err) {
      showError('Failed to create document: ' + err.message);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    if (doc.isMaster || doc.id === 'ai-breakdowns-master') {
      showError('The master document AI_Breakdowns.txt cannot be deleted. Use "Reset Master Document" instead.');
      return;
    }
    showConfirm(
      'Delete Document',
      `Permanently delete document "${doc.filename}"? This cannot be undone.`,
      async () => {
        setIsSavingDoc(true);
        try {
          await knowledgeService.deleteDocument(docId);
          setDocuments((prev) => prev.filter((d) => d.id !== docId));
          setSelectedDocId('ai-breakdowns-master');
          setModNotice(`Document "${doc.filename}" removed.`);
          setTimeout(() => setModNotice(''), 4000);
        } catch (err) {
          showError('Failed to delete document: ' + err.message);
        } finally {
          setIsSavingDoc(false);
        }
      },
      { confirmLabel: 'Delete', isDanger: true }
    );
  };

  const handleResetMasterDoc = async () => {
    showConfirm(
      'Reset Master Document',
      'Reset AI_Breakdowns.txt to the original master copy from public/Knowledge Base/AI_Breakdowns.txt? This will discard any manual changes.',
      async () => {
        setIsSavingDoc(true);
        try {
          const masterDoc = await knowledgeService.resetMasterDocument();
          setDocuments((prev) => prev.map((d) => (d.id === masterDoc.id ? masterDoc : d)));
          setModNotice('AI_Breakdowns.txt restored from local disk file!');
          setTimeout(() => setModNotice(''), 4000);
        } catch (err) {
          showError('Failed to reset master document: ' + err.message);
        } finally {
          setIsSavingDoc(false);
        }
      },
      { confirmLabel: 'Reset', isDanger: true }
    );
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

  const handleRejectQuestion = async (q) => {
    try {
      console.log('Rejecting question:', q.id);
      const result = await knowledgeService.updateQuestionStatus(q.id, 'rejected');
      console.log('Reject result:', result);
      
      setPromotedSuccess('Correction rejected and archived.');
      // Immediately remove from local state
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      loadQuestions(questionFilter);
      setTimeout(() => setPromotedSuccess(''), 4000);
    } catch (e) {
      console.error('Reject error:', e);
      setPromotedSuccess(`Error rejecting: ${e.message}`);
      setTimeout(() => setPromotedSuccess(''), 4000);
    }
  };

  const handlePromoteQuestion = async (q, overrideAnswer = null) => {
    const finalAnswer = overrideAnswer !== null ? overrideAnswer : (q.user_suggested_answer || q.ai_answer || '');
    const newRule = {
      topic: q.question_text.length > 50 ? q.question_text.substring(0, 47) + '...' : q.question_text,
      category: 'Combat',
      keywords: q.question_text.toLowerCase().split(' ').filter((w) => w.length > 3),
      shortAnswer: finalAnswer.length > 150 ? finalAnswer.substring(0, 147) + '...' : finalAnswer,
      details: `Official Answer to query: "${q.question_text}"\n\nAnswer: ${finalAnswer}`,
      orderIndex: rules.length + 1,
      isActive: true
    };

    try {
      console.log('Promoting question:', q.id);
      
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
      } catch (e) {
        console.warn('Could not register in rules_knowledge:', e);
      }

      setPromotedSuccess(`Appended question to Master Knowledge Document & approved!`);
      // Immediately remove promoted item from local state so it disappears from inbox
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      loadQuestions(questionFilter);
      setTimeout(() => setPromotedSuccess(''), 4000);
    } catch (e) {
      console.error('Promote error:', e);
      showError('Failed to promote rule: ' + e.message);
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
    { id: 'monetization', label: 'Monetization', icon: Coins, badge: 'Eco' },
    { id: 'music', label: 'Music Library', icon: Music, badge: musicTracks.filter(m => m.status === 'pending').length || 0 },
    { id: 'bug_reports', label: 'Bug Reports', icon: Bug, badge: bugReports.filter(r => r.status === 'new').length || 0 },
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
              {/* Neon streaks removed for cleaner UI */}
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
            {/* Neon streaks removed for cleaner UI */}
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
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={12} className={isUsersLoading ? 'spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Compact Minimal Table - No Redundant Columns */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr 0.8fr 1fr 0.7fr 1.2fr', padding: '8px 12px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      <span>USER</span>
                      <span>EMAIL</span>
                      <span>💎 CRYSTALS</span>
                      <span>WIN RATE</span>
                      <span>STATUS</span>
                      <span style={{ textAlign: 'right' }}>ACTIONS</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {filteredUsers.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                          No users found.
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
                                gridTemplateColumns: '1.8fr 2fr 0.8fr 1fr 0.7fr 1.2fr',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: u.is_banned ? 'rgba(255, 51, 102, 0.04)' : 'transparent',
                                fontSize: '0.82rem',
                                gap: '8px'
                              }}
                            >
                              {/* User Avatar + Name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                                  ⚔️
                                </div>
                                <strong style={{ color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {u.username}
                                </strong>
                              </div>

                              {/* Email */}
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.email}
                              </div>

                              {/* Crystals */}
                              <div style={{ color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {u.crystals_collected || 0}
                              </div>

                              {/* Win Rate */}
                              <div style={{ color: winRate >= 50 ? '#39ff14' : '#ff88aa', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {winRate}%
                              </div>

                              {/* Status Badge */}
                              <div>
                                <span
                                  style={{
                                    background: u.is_banned ? 'rgba(255, 51, 102, 0.15)' : 'rgba(57, 255, 20, 0.15)',
                                    color: u.is_banned ? '#ff88aa' : '#39ff14',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {u.is_banned ? 'BANNED' : u.is_premium ? 'PRO' : 'ACT'}
                                </span>
                              </div>

                              {/* Compact Action Buttons */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                <button
                                  onClick={async () => {
                                    const success = await economyService.assignPremiumUser(u.id, !u.is_premium);
                                    if (success) {
                                      setModNotice(u.is_premium ? `PRO revoked from ${u.username}` : `PRO granted to ${u.username}`);
                                      loadUsers();
                                    } else {
                                      setModNotice('Failed to update PRO status. Check DB schema.');
                                    }
                                  }}
                                  title={u.is_premium ? 'Revoke PRO' : 'Grant PRO'}
                                  style={{
                                    background: u.is_premium ? 'rgba(255, 230, 0, 0.2)' : 'transparent',
                                    border: u.is_premium ? '1px solid rgba(255, 215, 0, 0.7)' : '1px solid rgba(255, 215, 0, 0.3)',
                                    color: 'var(--neon-gold)',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Crown size={12} />
                                </button>
                                <button
                                  onClick={() => { setCrystalModalUser(u); setNewCrystalCount(u.crystals_collected || 0); }}
                                  title="Edit Crystals"
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 230, 0, 0.3)',
                                    color: 'var(--neon-gold)',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Gem size={12} />
                                </button>
                                <button
                                  onClick={() => setBanModalUser(u)}
                                  disabled={u.id === currentUser?.id}
                                  title={u.is_banned ? 'Reinstate' : 'Suspend'}
                                  style={{
                                    background: 'transparent',
                                    border: u.is_banned ? '1px solid rgba(57, 255, 20, 0.3)' : '1px solid rgba(255, 51, 102, 0.3)',
                                    color: u.is_banned ? '#39ff14' : '#ff88aa',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: u.id === currentUser?.id ? 0.5 : 1
                                  }}
                                >
                                  {u.is_banned ? <UserCheck size={12} /> : <Ban size={12} />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Modals for Crystal Adjustment */}
                  {crystalModalUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                      <div style={{ background: 'rgba(14, 22, 42, 0.95)', border: '1.5px solid var(--neon-cyan)', borderRadius: '12px', padding: '20px', maxWidth: '300px', width: '90%' }}>
                        <h3 style={{ color: 'var(--neon-cyan)', margin: '0 0 14px 0', fontSize: '1rem' }}>Adjust Crystals: {crystalModalUser.username}</h3>
                        <input
                          type="number"
                          value={newCrystalCount}
                          onChange={(e) => setNewCrystalCount(parseInt(e.target.value) || 0)}
                          style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.3)', color: '#fff', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box', fontSize: '0.9rem' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={handleSaveCrystals} style={{ flex: 1, background: 'rgba(0,240,255,0.2)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                          <button onClick={() => setCrystalModalUser(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {banModalUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                      <div style={{ background: 'rgba(14, 22, 42, 0.95)', border: '1.5px solid var(--neon-crimson)', borderRadius: '12px', padding: '20px', maxWidth: '300px', width: '90%' }}>
                        <h3 style={{ color: '#ff88aa', margin: '0 0 8px 0', fontSize: '1rem' }}>
                          {banModalUser.is_banned ? 'Reinstate' : 'Suspend'} User?
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 14px 0', fontSize: '0.9rem' }}>
                          {banModalUser.username}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleToggleBan(banModalUser)} style={{ flex: 1, background: banModalUser.is_banned ? 'rgba(57,255,20,0.2)' : 'rgba(255,51,102,0.2)', border: banModalUser.is_banned ? '1px solid #39ff14' : '1px solid var(--neon-crimson)', color: banModalUser.is_banned ? '#39ff14' : '#ff88aa', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {banModalUser.is_banned ? 'Reinstate' : 'Suspend'}
                          </button>
                          <button onClick={() => setBanModalUser(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  PAGE 2: MATCH HISTORY
              ========================================================================= */}
              {activeTab === 'matches' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL DUELS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>{matchHistory.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CRYSTALS AWARDED</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>
                        💎 {matchHistory.reduce((acc, m) => acc + (m.crystals_awarded || 1), 0)}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>ACTIVE ARENA ROOMS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>
                        {new Set(matchHistory.map(m => m.room_code || 'ARENA')).size}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>LATEST CHAMPION</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={12} className={isMatchesLoading ? 'spin' : ''} /> REFRESH
                    </button>
                  </div>

                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr 2fr 1fr', padding: '10px 16px', background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', letterSpacing: '1px' }}>
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
                                {m.winner_name || 'Unknown / Draw'}
                              </strong>
                            </div>
                            <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                              {Array.isArray(m.player_names) && m.player_names.length > 0 ? m.player_names.filter(Boolean).join(' vs ') : '2 Players'}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* ── COMPACT HEADER: Inline stats with action buttons ── */}
                  <div style={{
                    background: 'rgba(10, 18, 38, 0.9)',
                    border: '1px solid rgba(0, 240, 255, 0.22)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Doc selector pills - more compact */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                      {documents.map((doc) => {
                        const isSelected = doc.id === (activeDoc?.id || selectedDocId);
                        return (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px',
                              padding: '4px 8px', borderRadius: '16px',
                              border: isSelected ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                              background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(14, 22, 42, 0.7)',
                              color: isSelected ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.6)',
                              cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem',
                              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                              transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                            }}
                          >
                            <FileText size={10} />
                            {doc.filename.replace('.txt', '')}
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline stats */}
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                      <span><strong style={{ color: '#fff' }}>{filteredDocQAPairs.length}</strong> Q&As</span>
                      <span><strong style={{ color: '#fff' }}>{parsedDocData.lineCount}</strong> lines</span>
                    </div>

                    {/* Action buttons - compact icons only */}
                    <div style={{ display: 'flex', gap: '3px', flexShrink: 0, flexWrap: 'nowrap' }}>
                      <button onClick={() => setIsNewDocModalOpen(true)} title="New Document" style={{ background: 'transparent', border: '1px solid rgba(0,240,255,0.4)', color: 'var(--neon-cyan, #00f0ff)', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                      <button onClick={() => setIsAppendModalOpen(true)} title="Append Q&A" style={{ background: 'transparent', border: '1px solid rgba(57,255,20,0.4)', color: '#39ff14', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FilePlus size={11} /></button>
                      <button onClick={handleOpenEditDocModal} title="Edit Document" style={{ background: 'linear-gradient(90deg,#00f0ff,#0088ff)', border: 'none', color: '#050a18', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={11} /></button>
                      <button onClick={() => handleDownloadDoc(activeDoc)} title="Export" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.65)', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Download size={11} /></button>
                      {activeDoc?.isMaster ? (
                        <button onClick={handleResetMasterDoc} title="Reset Master" style={{ background: 'transparent', border: '1px solid rgba(255,230,0,0.3)', color: 'var(--neon-gold, #ffe600)', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={11} /></button>
                      ) : (
                        <button onClick={() => handleDeleteDoc(activeDoc?.id)} title="Delete" style={{ background: 'transparent', border: '1px solid rgba(255,42,85,0.3)', color: '#ff88aa', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={11} /></button>
                      )}
                    </div>
                  </div>

                  {/* ── SEARCH + VIEW TOGGLE ROW ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        placeholder="Search Q&A..."
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px 6px 30px', background: 'rgba(5,10,24,0.85)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(5,10,24,0.85)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '6px', padding: '2px', marginLeft: 'auto' }}>
                      <button
                        onClick={() => setDocViewMode('breakdown')}
                        style={{ background: docViewMode === 'breakdown' ? 'rgba(0,240,255,0.18)' : 'transparent', border: 'none', color: docViewMode === 'breakdown' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.45)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <LayoutGrid size={11} /> List
                      </button>
                      <button
                        onClick={() => setDocViewMode('raw')}
                        style={{ background: docViewMode === 'raw' ? 'rgba(0,240,255,0.18)' : 'transparent', border: 'none', color: docViewMode === 'raw' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.45)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Code size={11} /> Raw
                      </button>
                    </div>
                  </div>

                  {/* ── CONTENT VIEWPORT ── */}
                  {docViewMode === 'breakdown' ? (
                    <div>
                      {filteredDocQAPairs.length === 0 ? (
                        <div style={{ background: 'rgba(14,22,42,0.5)', border: '1px dashed rgba(0,240,255,0.2)', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>
                          <p style={{ margin: '0 0 10px' }}>
                            {docsLoading ? 'Loading...' : docSearchQuery ? `No results for "${docSearchQuery}"` : 'No Q&A blocks yet.'}
                          </p>
                          {!docsLoading && <button onClick={() => setIsAppendModalOpen(true)} style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid var(--neon-cyan,#00f0ff)', color: 'var(--neon-cyan,#00f0ff)', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>+ Add Q&A</button>}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                          {filteredDocQAPairs.map((item, idx) => (
                            <div
                              key={idx}
                              style={{ background: 'rgba(14,22,42,0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.32)', fontWeight: 'bold', flexShrink: 0 }}>#{idx + 1}</span>
                                <button
                                  onClick={() => handleCopy(item.fullBlock, `qa-${idx}`)}
                                  style={{ background: 'none', border: 'none', color: copiedKey === `qa-${idx}` ? '#39ff14' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, padding: 0 }}
                                >
                                  {copiedKey === `qa-${idx}` ? <Check size={9} /> : <Copy size={9} />}
                                </button>
                              </div>
                              <h3 style={{ fontSize: '0.86rem', color: 'var(--neon-cyan, #00f0ff)', margin: 0, fontWeight: 'bold', lineHeight: '1.3' }}>
                                {item.question}
                              </h3>
                              <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.65)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', paddingRight: '2px' }}>
                                {item.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Raw view */
                    <div style={{ background: 'rgba(5,10,24,0.97)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(10,18,38,0.95)', borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileCode size={12} color="var(--neon-cyan,#00f0ff)" />
                          <span style={{ fontSize: '0.77rem', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{activeDoc?.filename}</span>
                        </div>
                        <button onClick={() => handleCopy(activeDoc?.content || '', 'raw-doc')} style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: 'var(--neon-cyan,#00f0ff)', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {copiedKey === 'raw-doc' ? <Check size={9} /> : <Copy size={9} />}
                        </button>
                      </div>
                      <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '8px 12px', fontFamily: 'Consolas,"Fira Code",monospace', fontSize: '0.75rem', color: '#e2e8f0', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {(activeDoc?.content || '').split('\n').map((line, lIdx) => {
                          const isHeading = /^[0-9]+\.\s+[A-Z\s&]+/.test(line);
                          const isQuestion = line.trim().endsWith('?');
                          const isHighlighted = docSearchQuery && line.toLowerCase().includes(docSearchQuery.toLowerCase());
                          return (
                            <div key={lIdx} style={{ display: 'flex', background: isHighlighted ? 'rgba(255,230,0,0.12)' : 'transparent', borderLeft: isHighlighted ? '2px solid var(--neon-gold,#ffe600)' : 'none', paddingLeft: isHighlighted ? '6px' : '2px' }}>
                              <span style={{ width: '30px', flexShrink: 0, color: 'rgba(255,255,255,0.2)', userSelect: 'none', textAlign: 'right', paddingRight: '8px', fontSize: '0.7rem' }}>{lIdx + 1}</span>
                              <span style={{ flex: 1, color: isHeading ? 'var(--neon-gold,#ffe600)' : isQuestion ? 'var(--neon-cyan,#00f0ff)' : '#cbd5e1', fontWeight: isHeading || isQuestion ? 'bold' : 'normal' }}>
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
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>INBOUND QUERIES</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>{questions.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>HELPFUL RATING %</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>
                        {questions.length > 0 ? Math.round((questions.filter(q => q.user_rating === 'helpful').length / questions.length) * 100) : 100}%
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>PLAYER CORRECTIONS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>
                        {questions.filter(q => q.user_suggested_answer).length}
                      </div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>UNHELPFUL / FLAGGED</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff' }}>
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
                          onClick={() => { setQuestionFilter(f); loadQuestions(f); }}
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
                            background: 'rgba(14, 22, 42, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '14px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              USER: {q.user_name || 'Anonymous'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: q.user_rating === 'helpful' ? '#39ff14' : q.user_rating === 'unhelpful' ? '#ff88aa' : 'rgba(255,255,255,0.5)' }}>
                              {q.user_rating === 'helpful' ? '👍 Helpful' : q.user_rating === 'unhelpful' ? '👎 Inaccurate' : 'Unrated'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.96rem', color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
                            ❓ "{q.question_text}"
                          </div>

                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', borderLeft: '3px solid rgba(255,255,255,0.3)', fontSize: '0.82rem', color: '#cbd5e1' }}>
                            <strong>AI Answer:</strong> {q.ai_answer}
                          </div>

                          {q.user_suggested_answer && (
                            <div style={{ background: 'rgba(255, 230, 0, 0.08)', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', borderLeft: '3px solid var(--neon-gold, #ffe600)', fontSize: '0.82rem', color: '#fff' }}>
                              <strong>Player Correction:</strong> "{q.user_suggested_answer}"
                            </div>
                          )}

                          {editingQuestionId === q.id ? (
                            <div style={{ marginTop: '10px' }}>
                              <textarea
                                value={editQuestionText}
                                onChange={(e) => setEditQuestionText(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '8px', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setEditingQuestionId(null)}
                                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    handlePromoteQuestion(q, editQuestionText);
                                    setEditingQuestionId(null);
                                  }}
                                  style={{ background: 'rgba(57, 255, 20, 0.15)', border: '1px solid rgba(57, 255, 20, 0.3)', color: '#39ff14', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                  <Sparkles size={13} /> Save & Promote
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                              <button
                                onClick={() => handleRejectQuestion(q)}
                                style={{
                                  background: 'rgba(255, 77, 0, 0.15)',
                                  border: '1px solid rgba(255, 77, 0, 0.3)',
                                  color: '#ff4d00',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.id);
                                  setEditQuestionText(q.user_suggested_answer || q.ai_answer || '');
                                }}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: '#fff',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handlePromoteQuestion(q)}
                                style={{
                                  background: 'rgba(57, 255, 20, 0.15)',
                                  border: '1px solid rgba(57, 255, 20, 0.3)',
                                  color: '#39ff14',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <Sparkles size={13} /> Promote to Knowledge Base
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* =========================================================================
                  PAGE 6: MONETIZATION
              ========================================================================= */}
              {activeTab === 'monetization' && (
                <div>
                  {/* ── MODULE ACCESS CONFIGURATION ─────────────────────────────────── */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--neon-cyan)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LayoutGrid size={16} /> Module Access Configuration
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 16px 0' }}>
                      Set each module to Free or Premium. Premium modules require crystals per match. PRO users bypass all crystal costs.
                    </p>

                    {/* Module cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {[
                        { slug: 'chatbot',    label: 'TCG Chatbot',           icon: '🤖', desc: 'AI chat companion & rules knowledge base' },
                        { slug: 'calculator', label: 'Score Calculator',      icon: '🎲', desc: 'Tabletop score tracker & simulator' },
                        { slug: 'kontrola',   label: 'Kontrola Game',         icon: '⚔️', desc: 'Online multiplayer card battle arena' },
                      ].map(({ slug, label, icon, desc }) => {
                        const isPremium = appSettings.premium_modules?.includes(slug);
                        const moduleCost = appSettings.module_costs?.[slug] ?? appSettings.match_cost ?? 1;
                        return (
                          <div key={slug} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '12px',
                            alignItems: 'center',
                            background: isPremium ? 'rgba(255, 215, 0, 0.06)' : 'rgba(0, 240, 255, 0.04)',
                            border: `1px solid ${isPremium ? 'rgba(255,215,0,0.3)' : 'rgba(0,240,255,0.15)'}`,
                            borderRadius: '10px',
                            padding: '12px 14px',
                            transition: 'all 0.2s ease'
                          }}>
                            {/* Left: module info + cost input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {label}
                                  {isPremium && (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 'bold', background: 'rgba(255,215,0,0.15)', color: 'var(--neon-gold)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.5px' }}>
                                      PREMIUM
                                    </span>
                                  )}
                                  {!isPremium && (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 'bold', background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.5px' }}>
                                      FREE
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{desc}</div>
                              </div>
                            </div>

                            {/* Right: toggle + cost input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {/* Crystal cost input — only shown when premium */}
                              {isPremium && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '0.9rem' }}>💎</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={moduleCost}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setAppSettings(prev => ({
                                        ...prev,
                                        module_costs: { ...(prev.module_costs || {}), [slug]: val }
                                      }));
                                    }}
                                    style={{
                                      width: '52px',
                                      background: 'rgba(0,0,0,0.35)',
                                      border: '1px solid rgba(255,215,0,0.35)',
                                      color: 'var(--neon-gold)',
                                      padding: '4px 6px',
                                      borderRadius: '6px',
                                      fontSize: '0.82rem',
                                      fontWeight: 'bold',
                                      textAlign: 'center',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,215,0,0.55)', whiteSpace: 'nowrap' }}>/ match</span>
                                </div>
                              )}

                              {/* Free / Premium toggle */}
                              <button
                                onClick={() => {
                                  setAppSettings(prev => {
                                    const mods = prev.premium_modules || [];
                                    return {
                                      ...prev,
                                      premium_modules: mods.includes(slug)
                                        ? mods.filter(m => m !== slug)
                                        : [...mods, slug]
                                    };
                                  });
                                }}
                                title={isPremium ? 'Set to Free' : 'Set to Premium'}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '5px',
                                  background: isPremium ? 'rgba(255,215,0,0.15)' : 'rgba(0,240,255,0.08)',
                                  border: `1px solid ${isPremium ? 'rgba(255,215,0,0.5)' : 'rgba(0,240,255,0.3)'}`,
                                  color: isPremium ? 'var(--neon-gold)' : 'var(--neon-cyan)',
                                  borderRadius: '8px',
                                  padding: '5px 12px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  fontFamily: 'Rajdhani, sans-serif',
                                  letterSpacing: '0.5px',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {isPremium ? <><Lock size={11} /> Set Free</> : <><Crown size={11} /> Set Premium</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* PRO bypass notice */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                      <Crown size={14} style={{ color: 'var(--neon-gold)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--neon-gold)' }}>PRO users</strong> always bypass crystal costs on all premium modules. Grant PRO status to a player from the <strong style={{ color: '#fff' }}>Users</strong> tab.
                      </span>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={async () => {
                        // Sync match_cost to the lowest set premium module cost for backwards compatibility
                        const premiumMods = appSettings.premium_modules || [];
                        const costs = appSettings.module_costs || {};
                        const lowestCost = premiumMods.length > 0
                          ? Math.min(...premiumMods.map(m => costs[m] ?? appSettings.match_cost ?? 1))
                          : appSettings.match_cost ?? 1;
                        const payload = { ...appSettings, match_cost: lowestCost };
                        const success = await economyService.updateAppSettings(payload);
                        setModNotice(success ? '✅ Module settings saved!' : '❌ Failed to save. Check DB connection.');
                        setTimeout(() => setModNotice(''), 3500);
                      }}
                      style={{ width: '100%', background: 'rgba(0,240,255,0.15)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Save size={13} /> Save Module Configuration
                    </button>
                  </div>

                  {/* Global Economy Settings - Simple 2-Column Form */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--neon-cyan)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Coins size={16} /> Global Economy Settings
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MATCH COST</label>
                        <input
                          type="number"
                          value={appSettings.match_cost}
                          onChange={(e) => setAppSettings(prev => ({ ...prev, match_cost: parseInt(e.target.value) || 0 }))}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '0.5px' }}>PREMIUM MODULES</label>
                        <input
                          type="text"
                          value={appSettings.premium_modules.join(', ')}
                          onChange={(e) => setAppSettings(prev => ({ ...prev, premium_modules: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const success = await economyService.updateAppSettings(appSettings);
                        setModNotice(success ? 'Settings updated!' : 'Failed to update settings.');
                        setTimeout(() => setModNotice(''), 3000);
                      }}
                      style={{ width: '100%', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                      <Save size={12} style={{ display: 'inline', marginRight: '4px' }} /> Save
                    </button>
                  </div>

                  {/* Store Bundles - Simple Table/List */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.15)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart size={16} /> Store Bundles ({storeBundles.length})
                      </h2>
                      <button
                        onClick={() => setEditingBundle({ title: '', description: '', image_url: '', crystal_amount: 0, price_usd: 0, discount_percent: 0 })}
                        style={{ background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {editingBundle && (
                      <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderBottom: '1px solid rgba(255, 230, 0, 0.3)' }}>
                        <h3 style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                          {editingBundle.id ? 'Edit Bundle' : 'Create New Bundle'}
                        </h3>
                        
                        {/* Row 1: Basic Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '3px' }}>Bundle Title *</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Starter Pack" 
                              value={editingBundle.title} 
                              onChange={e => setEditingBundle({...editingBundle, title: e.target.value})} 
                              style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '3px' }}>Crystal Amount *</label>
                            <input 
                              type="number" 
                              placeholder="5" 
                              value={editingBundle.crystal_amount} 
                              onChange={e => setEditingBundle({...editingBundle, crystal_amount: parseInt(e.target.value) || 0})} 
                              style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '3px' }}>Price (USD) *</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="1.99" 
                              value={editingBundle.price_usd} 
                              onChange={e => setEditingBundle({...editingBundle, price_usd: parseFloat(e.target.value) || 0})} 
                              style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '3px' }}>Discount %</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              min="0" 
                              max="100" 
                              value={editingBundle.discount_percent || 0} 
                              onChange={e => setEditingBundle({...editingBundle, discount_percent: parseInt(e.target.value) || 0})} 
                              style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                            />
                          </div>
                        </div>
                        
                        {/* Row 2: Image URL */}
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '3px' }}>Image URL (optional)</label>
                          <input 
                            type="text" 
                            placeholder="https://example.com/bundle-image.png" 
                            value={editingBundle.image_url || ''} 
                            onChange={e => setEditingBundle({...editingBundle, image_url: e.target.value})} 
                            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                          />
                        </div>
                        
                        {/* Row 3: Description */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '3px' }}>Description</label>
                          <textarea 
                            placeholder="Brief description of this bundle (e.g., 'Get started with a quick boost!')" 
                            value={editingBundle.description || ''} 
                            onChange={e => setEditingBundle({...editingBundle, description: e.target.value})} 
                            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical', minHeight: '50px' }} 
                          />
                        </div>
                        
                        {/* Help Text */}
                        <div style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '4px', padding: '8px', marginBottom: '8px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                          💡 <strong>Field Guide:</strong> Title appears as the main bundle name. Crystal Amount = diamonds awarded. Price in USD cents (1.99 = $1.99). Discount % shows a red badge if &gt; 0.
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={async () => { const created = await economyService.upsertStoreBundle(editingBundle); if(created) { setEditingBundle(null); loadEconomyData(); } }} style={{ flex: 1, background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {editingBundle.id ? 'Update Bundle' : 'Create Bundle'}
                          </button>
                          <button onClick={() => setEditingBundle(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                      {storeBundles.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No bundles yet.</div>
                      ) : (
                        storeBundles.map((bundle, idx) => (
                          <div key={bundle.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: idx < storeBundles.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '0.82rem' }}>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 'bold' }}>{bundle.title}</div>
                              {bundle.description && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{bundle.description.substring(0, 40)}</div>}
                            </div>
                            <div style={{ color: 'var(--neon-cyan)' }}>💎 {bundle.crystal_amount}</div>
                            <div style={{ color: 'var(--neon-gold)' }}>${bundle.price_usd}</div>
                            {bundle.discount_percent > 0 && <div style={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 'bold' }}>-{bundle.discount_percent}%</div>}
                            {!bundle.discount_percent && <div></div>}
                            <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingBundle(bundle)} style={{ background: 'transparent', border: '1px solid rgba(0,240,255,0.3)', color: 'var(--neon-cyan)', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><Edit2 size={11} /></button>
                              <button onClick={async () => { await economyService.deleteStoreBundle(bundle.id); loadEconomyData(); }} style={{ background: 'transparent', border: '1px solid rgba(255,51,102,0.3)', color: '#ff88aa', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>


                  {/* Redeem Codes - Simple Table */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(255, 215, 0, 0.15)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ color: 'var(--neon-gold)', margin: 0, fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gem size={16} /> Promo Codes ({redeemCodes.length})
                      </h2>
                      <button
                        onClick={() => setEditingCode({ code: '', crystal_amount: 10, max_uses: 1 })}
                        style={{ background: 'rgba(255, 215, 0, 0.15)', border: '1px solid var(--neon-gold)', color: 'var(--neon-gold)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {editingCode && (
                      <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderBottom: '1px solid rgba(255, 215, 0, 0.3)' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input type="text" placeholder="Code (FREEGEMS)" value={editingCode.code} onChange={e => setEditingCode({...editingCode, code: e.target.value.toUpperCase()})} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }} />
                          <input type="number" placeholder="Crystals" value={editingCode.crystal_amount} onChange={e => setEditingCode({...editingCode, crystal_amount: parseInt(e.target.value) || 0})} style={{ width: '100px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem' }} />
                          <input type="number" placeholder="Max Uses" value={editingCode.max_uses} onChange={e => setEditingCode({...editingCode, max_uses: parseInt(e.target.value) || 1})} style={{ width: '100px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={async () => { const created = await economyService.upsertRedeemCode(editingCode); if(created) { setEditingCode(null); loadEconomyData(); } }} style={{ flex: 1, background: 'rgba(255, 215, 0, 0.15)', border: '1px solid var(--neon-gold)', color: 'var(--neon-gold)', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>Save</button>
                          <button onClick={() => setEditingCode(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                      {redeemCodes.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No promo codes yet.</div>
                      ) : (
                        redeemCodes.map((c, idx) => (
                          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr 1fr 0.6fr', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: idx < redeemCodes.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '0.82rem' }}>
                            <div style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{c.code}</div>
                            <div style={{ color: 'var(--neon-cyan)' }}>💎 {c.crystal_amount}</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{c.times_used || 0} / {c.max_uses}</div>
                            <div style={{ color: c.times_used >= c.max_uses ? '#ff88aa' : '#39ff14', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {c.times_used >= c.max_uses ? 'EXPIRED' : 'ACTIVE'}
                            </div>
                            <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingCode(c)} style={{ background: 'transparent', border: '1px solid rgba(255,215,0,0.3)', color: 'var(--neon-gold)', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><Edit2 size={11} /></button>
                              <button onClick={async () => { await economyService.deleteRedeemCode(c.id); loadEconomyData(); }} style={{ background: 'transparent', border: '1px solid rgba(255,51,102,0.3)', color: '#ff88aa', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* =========================================================================
                  PAGE 7: MUSIC LIBRARY (USER SUBMISSIONS & APPROVAL)
              ========================================================================= */}
              {activeTab === 'music' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        MUSIC LIBRARY
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                        User-submitted tracks for gameplay. PRO users can submit, admins approve.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* Filter buttons */}
                      {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setMusicFilter(filter)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${musicFilter === filter ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.2)'}`,
                            background: musicFilter === filter ? 'rgba(0,240,255,0.15)' : 'transparent',
                            color: musicFilter === filter ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {filter}
                        </button>
                      ))}
                      <button
                        onClick={loadMusic}
                        disabled={musicLoading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          cursor: musicLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        <RefreshCw size={12} className={musicLoading ? 'spin' : ''} /> Refresh
                      </button>
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL TRACKS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff' }}>{musicTracks.length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>PENDING</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--neon-gold)' }}>{musicTracks.filter(m => m.status === 'pending').length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>APPROVED</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#39ff14' }}>{musicTracks.filter(m => m.status === 'approved').length}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>REJECTED</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#ff88aa' }}>{musicTracks.filter(m => m.status === 'rejected').length}</div>
                    </div>
                  </div>

                  {/* Tracks list */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(6, 12, 28, 0.95)', borderBottom: '1px solid rgba(0, 240, 255, 0.15)', padding: '12px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr auto', gap: '12px', fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>
                      <div>TRACK & UPLOADER</div>
                      <div>URL</div>
                      <div>SUBMITTED</div>
                      <div>STATUS</div>
                      <div style={{ textAlign: 'center' }}>ACTIONS</div>
                    </div>

                    <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                      {musicLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                          <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                          <div>Loading music tracks...</div>
                        </div>
                      ) : musicTracks.filter(m => musicFilter === 'all' || m.status === musicFilter).length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                          No {musicFilter !== 'all' ? musicFilter : ''} tracks found.
                        </div>
                      ) : (
                        musicTracks.filter(m => musicFilter === 'all' || m.status === musicFilter).map((track, idx, arr) => {
                          const statusColors = {
                            pending: { bg: 'rgba(255,215,0,0.1)', color: 'var(--neon-gold)', border: 'rgba(255,215,0,0.3)' },
                            approved: { bg: 'rgba(57,255,20,0.1)', color: '#39ff14', border: 'rgba(57,255,20,0.3)' },
                            rejected: { bg: 'rgba(255,51,102,0.1)', color: '#ff88aa', border: 'rgba(255,51,102,0.3)' }
                          };
                          const statusStyle = statusColors[track.status] || statusColors.pending;
                          const submittedDate = new Date(track.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                          return (
                            <div key={track.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                              {/* Header Row: Track Info + Player + Date + Status + Actions */}
                              <div className="data-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 16px', fontSize: '0.85rem' }}>
                                {/* Track Info (Left) */}
                                <div style={{ flex: '0 0 auto', minWidth: '180px' }}>
                                  <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Music size={13} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                                    {track.title}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                                    by <strong style={{ color: 'var(--neon-cyan)' }}>{track.username}</strong>
                                  </div>
                                </div>

                                {/* Music Player (Center/Main) */}
                                <div style={{ flex: 1, minWidth: '400px' }}>
                                  <MusicPlayer track={track} />
                                </div>

                                {/* Date (Right) */}
                                <div style={{ flex: '0 0 auto', minWidth: '90px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                                  {submittedDate}
                                </div>

                                {/* Status Badge (Right) */}
                                <div style={{ flex: '0 0 auto', minWidth: '80px' }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'center' }}>
                                    {track.status}
                                  </span>
                                </div>

                                {/* Actions (Far Right) */}
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flex: '0 0 auto', minWidth: '120px' }}>
                                  {track.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          const success = await musicService.updateMusicStatus(track.id, 'approved');
                                          if (success) {
                                            setModNotice(`✅ Approved "${track.title}"!`);
                                            setTimeout(() => setModNotice(''), 3000);
                                            loadMusic();
                                          } else {
                                            showError('Failed to approve track.');
                                          }
                                        }}
                                        title="Approve"
                                        style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                      >
                                        <CheckCircle2 size={12} /> Approve
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const success = await musicService.updateMusicStatus(track.id, 'rejected');
                                          if (success) {
                                            setModNotice(`❌ Rejected "${track.title}"`);
                                            setTimeout(() => setModNotice(''), 3000);
                                            loadMusic();
                                          } else {
                                            showError('Failed to reject track.');
                                          }
                                        }}
                                        title="Reject"
                                        style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff88aa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                      >
                                        <XCircle size={12} /> Reject
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={async () => {
                                      showConfirm(
                                        'Delete Track',
                                        `Permanently delete "${track.title}" by ${track.username}? This cannot be undone.`,
                                        async () => {
                                          const success = await musicService.deleteMusic(track.id);
                                          if (success) {
                                            setModNotice(`🗑️ Deleted "${track.title}"`);
                                            setTimeout(() => setModNotice(''), 3000);
                                            loadMusic();
                                          } else {
                                            showError('Failed to delete track.');
                                          }
                                        },
                                        { confirmLabel: 'Delete', isDanger: true }
                                      );
                                    }}
                                    title="Delete"
                                    style={{ background: 'transparent', border: '1px solid rgba(255,51,102,0.3)', color: '#ff88aa', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
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
                  PAGE 8: BUG REPORTS
              ========================================================================= */}
              {activeTab === 'bug_reports' && (
                <div>
                  {/* KPI Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    {[
                      { label: 'NEW', value: bugReports.filter(r => r.status === 'new').length, color: '#ff2a55' },
                      { label: 'INVESTIGATING', value: bugReports.filter(r => r.status === 'investigating').length, color: '#ffe600' },
                      { label: 'RESOLVED', value: bugReports.filter(r => r.status === 'resolved').length, color: '#39ff14' },
                      { label: 'DISMISSED', value: bugReports.filter(r => r.status === 'dismissed').length, color: 'rgba(255,255,255,0.35)' },
                      { label: 'TOTAL', value: bugReports.length, color: '#00f0ff' }
                    ].map(stat => (
                      <div key={stat.label} className="kpi-card" style={{ background: 'rgba(14,22,42,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Header + Filter + Refresh */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#fff', margin: '0 0 2px 0', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                        🐛 BUG REPORTS
                      </h2>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        Automatic crash captures and player-submitted issues
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['new', 'investigating', 'resolved', 'dismissed', 'all'].map(f => (
                        <button
                          key={f}
                          onClick={() => {
                            setBugReportFilter(f);
                            loadBugReports(f === 'all' ? null : f);
                          }}
                          style={{
                            background: bugReportFilter === f ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
                            border: bugReportFilter === f ? '1px solid rgba(0,240,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                            color: bugReportFilter === f ? '#00f0ff' : 'rgba(255,255,255,0.6)',
                            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase'
                          }}
                        >
                          {f}
                        </button>
                      ))}
                      <button
                        onClick={() => loadBugReports(bugReportFilter === 'all' ? null : bugReportFilter)}
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
                      >
                        <RefreshCw size={13} /> Refresh
                      </button>
                    </div>
                  </div>

                  {/* Reports List */}
                  {bugReportsLoading ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px', fontSize: '0.9rem' }}>Loading bug reports...</div>
                  ) : bugReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
                      <Bug size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>No bug reports found</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>Reports appear here automatically when players encounter errors</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {bugReports.filter(report => {
                        // Only show actual bug reports, not contact support messages
                        // Contact support = errorType 'manual' with no error_stack
                        return report.error_type !== 'manual' || report.error_stack;
                      }).map(report => {
                        const isExpanded = expandedBugId === report.id;
                        const statusColors = { new: '#ff2a55', investigating: '#ffe600', resolved: '#39ff14', dismissed: 'rgba(255,255,255,0.35)' };
                        const typeIcons = { crash: '💥', freeze: '🧊', blackout: '⬛', manual: '✍️', error: '⚠️' };
                        const statusColor = statusColors[report.status] || '#00f0ff';

                        return (
                          <div
                            key={report.id}
                            style={{
                              background: 'rgba(14,22,42,0.5)',
                              border: `1px solid ${report.status === 'new' ? 'rgba(255,42,85,0.4)' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: '10px',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Row Header */}
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', cursor: 'pointer', flexWrap: 'wrap' }}
                              onClick={() => setExpandedBugId(isExpanded ? null : report.id)}
                            >
                              <span style={{ fontSize: '1.1rem' }}>{typeIcons[report.error_type] || '🐛'}</span>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {report.error_message}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                  <span>👤 {report.username}</span>
                                  {report.match_id && <span>🎮 Match: {report.match_id}</span>}
                                  <span>🕐 {new Date(report.created_at).toLocaleString()}</span>
                                  <span style={{ textTransform: 'uppercase', color: 'rgba(0,240,255,0.7)' }}>{report.error_type}</span>
                                </div>
                              </div>

                              {/* Status badge */}
                              <span style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55`, padding: '3px 10px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                {report.status}
                              </span>

                              {/* Expand chevron */}
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'}</span>
                            </div>

                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                {/* Screenshot */}
                                {report.screenshot_url && (
                                  <div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>Screenshot</div>
                                    <img
                                      src={report.screenshot_url}
                                      alt="Bug screenshot"
                                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', objectFit: 'contain', background: '#000' }}
                                    />
                                  </div>
                                )}

                                {/* Error Details Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                                  {[
                                    { label: 'Error Type', value: report.error_type },
                                    { label: 'Page URL', value: report.page_url },
                                    { label: 'Match ID', value: report.match_id || '—' },
                                    { label: 'User Agent', value: report.user_agent?.substring(0, 60) + '...' }
                                  ].map(field => (
                                    <div key={field.label} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px' }}>
                                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '3px' }}>{field.label}</div>
                                      <div style={{ fontSize: '0.78rem', color: '#fff', wordBreak: 'break-all' }}>{field.value}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* Stack Trace */}
                                {report.error_stack && (
                                  <div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Stack Trace</div>
                                    <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', color: '#ff8099', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '180px', margin: 0 }}>
                                      {report.error_stack}
                                    </pre>
                                  </div>
                                )}

                                {/* Game State Snapshot */}
                                {report.game_state && (
                                  <div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Game State Snapshot</div>
                                    <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', color: '#94a3b8', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '180px', margin: 0 }}>
                                      {JSON.stringify(report.game_state, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Admin Notes */}
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Admin Notes</div>
                                  <textarea
                                    value={bugAdminNotes[report.id] !== undefined ? bugAdminNotes[report.id] : (report.admin_notes || '')}
                                    onChange={e => setBugAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                                    placeholder="Add investigation notes..."
                                    rows={2}
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '0.82rem', resize: 'vertical' }}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {['investigating', 'resolved', 'dismissed'].map(newStatus => (
                                    <button
                                      key={newStatus}
                                      onClick={async () => {
                                        const notes = bugAdminNotes[report.id] !== undefined ? bugAdminNotes[report.id] : (report.admin_notes || null);
                                        const ok = await bugReportService.updateBugReportStatus(report.id, newStatus, notes);
                                        if (ok) {
                                          setModNotice(`✅ Report marked as ${newStatus}`);
                                          setTimeout(() => setModNotice(''), 3000);
                                          loadBugReports(bugReportFilter === 'all' ? null : bugReportFilter);
                                          setExpandedBugId(null);
                                        } else {
                                          showError('Failed to update report status.');
                                        }
                                      }}
                                      style={{
                                        background: newStatus === 'resolved' ? 'rgba(57,255,20,0.12)' : newStatus === 'investigating' ? 'rgba(255,230,0,0.12)' : 'rgba(255,255,255,0.06)',
                                        border: newStatus === 'resolved' ? '1px solid rgba(57,255,20,0.4)' : newStatus === 'investigating' ? '1px solid rgba(255,230,0,0.4)' : '1px solid rgba(255,255,255,0.15)',
                                        color: newStatus === 'resolved' ? '#39ff14' : newStatus === 'investigating' ? '#ffe600' : 'rgba(255,255,255,0.6)',
                                        padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase'
                                      }}
                                    >
                                      {newStatus === 'investigating' ? '🔍 Investigate' : newStatus === 'resolved' ? '✅ Resolve' : '🚫 Dismiss'}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => {
                                      showConfirm(
                                        'Delete Bug Report',
                                        'Permanently delete this bug report?',
                                        async () => {
                                          const ok = await bugReportService.deleteBugReport(report.id);
                                          if (ok) {
                                            setModNotice('🗑️ Bug report deleted');
                                            setTimeout(() => setModNotice(''), 3000);
                                            loadBugReports(bugReportFilter === 'all' ? null : bugReportFilter);
                                            setExpandedBugId(null);
                                          } else {
                                            showError('Failed to delete bug report.');
                                          }
                                        },
                                        { confirmLabel: 'Delete', isDanger: true }
                                      );
                                    }}
                                    style={{ background: 'rgba(255,42,85,0.1)', border: '1px solid rgba(255,42,85,0.35)', color: '#ff2a55', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
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
              {/* =========================================================================
                  PAGE 5: TCG APIS (CLEAN DEDICATED VIEW)
              ========================================================================= */}
              {activeTab === 'tcg_apis' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>GATEWAY STATUS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff' }}>ONLINE (200 OK)</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>REST DB LATENCY</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff' }}>~28ms</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>POSTGRES RLS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff' }}>ACTIVE & LOCKED</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', fontWeight: 'bold' }}>CONNECTED TCG APPS</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff' }}>4 CLIENT TYPES</div>
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
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
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
                    <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>PRODUCTION REST URL</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ color: '#fff', fontSize: '0.84rem' }}>{supabaseUrl}</code>
                        <button onClick={() => handleCopy(supabaseUrl, 'admin_url')} style={{ background: 'none', border: 'none', color: copiedKey === 'admin_url' ? '#39ff14' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                          {copiedKey === 'admin_url' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>ANON PUBLIC KEY</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', filter: 'blur(2px)', transition: 'filter 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.filter = 'none'} onMouseOut={(e) => e.currentTarget.style.filter = 'blur(2px)'}>{anonKey.substring(0, 36)}...</code>
                        <button onClick={() => handleCopy(anonKey, 'admin_key')} style={{ background: 'none', border: 'none', color: copiedKey === 'admin_key' ? '#39ff14' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                          {copiedKey === 'admin_key' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connected TCG Applications Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>
                          ⚔️ Kontrola Arena (Web)
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Real-time multiplayer duel client. Authenticates users via JWT and logs match outcomes directly to <code>matches</code> table.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>POST /rest/v1/matches</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>
                          🎲 Tabletop Simulator / Unity
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Unity C# client querying active rules and updating stability crystals for victorious players.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>GET /rest/v1/rules_knowledge</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>
                          📱 Mobile Tournament (Flutter)
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Companion app for physical tournaments. Syncs usernames, crystal inventories, and deck stats.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>GET /rest/v1/profiles</code>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>
                          🤖 AI Rulekeeper Assistant
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CONNECTED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: '1.45' }}>
                        Grounded AI rules referee. Logs queries to Questions Inbox and incorporates promoted GM clarifications.
                      </p>
                      <code style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>POST /rest/v1/user_questions</code>
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
                        disabled={isSavingDoc}
                        style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: isSavingDoc ? 'not-allowed' : 'pointer', fontSize: '0.84rem', opacity: isSavingDoc ? 0.7 : 1 }}
                      >
                        {isSavingDoc ? 'Saving...' : 'Save Changes'}
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
                      disabled={isSavingDoc}
                      style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #39ff14, #00cc44)', color: '#050a18', fontWeight: 'bold', cursor: isSavingDoc ? 'not-allowed' : 'pointer', fontSize: '0.84rem', opacity: isSavingDoc ? 0.7 : 1 }}
                    >
                      {isSavingDoc ? 'Saving...' : `Append to ${activeDoc.filename}`}
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
                      disabled={isSavingDoc}
                      style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)', color: '#050a18', fontWeight: 'bold', cursor: isSavingDoc ? 'not-allowed' : 'pointer', fontSize: '0.84rem', opacity: isSavingDoc ? 0.7 : 1 }}
                    >
                      {isSavingDoc ? 'Creating...' : 'Create Document'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* In-app Confirm Dialog (replaces window.confirm) */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'rgba(8, 16, 36, 0.98)', border: `2px solid ${confirmDialog.isDanger ? 'var(--neon-crimson)' : 'rgba(0,240,255,0.4)'}`, borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', fontFamily: 'Rajdhani, sans-serif' }}>
            <h3 style={{ margin: '0 0 12px 0', color: confirmDialog.isDanger ? 'var(--neon-crimson)' : 'var(--neon-cyan)', fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '1px' }}>{confirmDialog.title}</h3>
            <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: confirmDialog.isDanger ? 'linear-gradient(135deg, #ff2a55, #cc0033)' : 'linear-gradient(135deg, #00f0ff, #0088ff)', color: confirmDialog.isDanger ? '#fff' : '#040a18', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', boxShadow: `0 4px 12px ${confirmDialog.isDanger ? 'rgba(255,42,85,0.3)' : 'rgba(0,240,255,0.3)'}`, transition: 'transform 0.15s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >{confirmDialog.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

