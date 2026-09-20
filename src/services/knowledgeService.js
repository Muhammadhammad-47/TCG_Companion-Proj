import { supabase, isSupabaseConfigured } from './supabaseClient';
import { RULES_KNOWLEDGE as FALLBACK_RULES } from '../game/data/rulesKnowledge.js';

// In-memory cache for ultra-fast instant answers with zero lag
let cachedRules = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute

export const knowledgeService = {
  // Fetch active rules with automatic fallback to static RULES_KNOWLEDGE
  async fetchRulesKnowledge(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedRules && now - lastCacheTime < CACHE_TTL_MS) {
      return cachedRules;
    }

    if (!isSupabaseConfigured || !supabase) {
      return FALLBACK_RULES;
    }

    try {
      // 1500ms safety timeout to guarantee zero delay for players
      const fetchPromise = supabase
        .from('rules_knowledge')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase fetch timed out')), 1500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error || !data || data.length === 0) {
        cachedRules = FALLBACK_RULES;
        lastCacheTime = now;
        return FALLBACK_RULES;
      }

      // Format DB rows to match the engine's expected structure
      const formatted = data.map((item) => ({
        id: item.id,
        topic: item.topic,
        category: item.category || 'Gameplay',
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        shortAnswer: item.short_answer,
        details: item.details,
        orderIndex: item.order_index,
        isActive: item.is_active
      }));

      cachedRules = formatted;
      lastCacheTime = now;
      return formatted;
    } catch (err) {
      console.warn('knowledgeService: Using fallback rules knowledge due to network error:', err);
      cachedRules = FALLBACK_RULES;
      return FALLBACK_RULES;
    }
  },

  // Admin: Fetch all rules including inactive (with automatic fallback to official GDD rules)
  async fetchAllRulesForAdmin() {
    let dbRules = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('rules_knowledge')
          .select('*')
          .order('order_index', { ascending: true });

        if (!error && data && data.length > 0) {
          dbRules = data;
        }
      } catch (err) {
        console.warn('knowledgeService: Supabase query error, using fallback rules:', err);
      }
    }

    // If Supabase table is empty or unseeded, populate with official Attention TCG rules
    if (dbRules.length === 0) {
      return FALLBACK_RULES.map((r, idx) => {
        let cat = 'Combat';
        const t = (r.topic || '').toLowerCase();
        if (t.includes('setup') || t.includes('start') || t.includes('begin') || t.includes('hand')) cat = 'Setup';
        else if (t.includes('energy') || t.includes('et')) cat = 'Energy';
        else if (t.includes('lore') || t.includes('story') || t.includes('objective') || t.includes('caca')) cat = 'Lore';
        else if (t.includes('character') || t.includes('move') || t.includes('abilities') || t.includes('wild')) cat = 'Characters';
        else if (t.includes('zombie') || t.includes('poison') || t.includes('antidote')) cat = 'Combat';

        return {
          id: `rule-${idx + 1}`,
          topic: r.topic,
          category: r.category || cat,
          keywords: Array.isArray(r.keywords) ? r.keywords : [],
          short_answer: r.short_answer || r.shortAnswer || '',
          details: r.details || '',
          order_index: r.order_index || r.orderIndex || idx + 1,
          is_active: r.is_active !== undefined ? r.is_active : true
        };
      });
    }

    return dbRules.map((r, idx) => ({
      id: r.id,
      topic: r.topic || 'Untitled Rule',
      category: r.category || 'Combat',
      keywords: Array.isArray(r.keywords) ? r.keywords : (r.keywords ? [r.keywords] : []),
      short_answer: r.short_answer || r.shortAnswer || '',
      details: r.details || '',
      order_index: r.order_index ?? idx + 1,
      is_active: r.is_active !== false
    }));
  },

  async fetchKnowledgeBase() {
    return this.fetchAllRulesForAdmin();
  },

  // Admin: Create new rule
  async createRule(ruleData) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('rules_knowledge')
      .insert({
        topic: ruleData.topic.trim(),
        category: ruleData.category || 'Gameplay',
        keywords: ruleData.keywords || [],
        short_answer: ruleData.shortAnswer.trim(),
        details: ruleData.details.trim(),
        order_index: ruleData.orderIndex || 0,
        is_active: ruleData.isActive !== false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    cachedRules = null; // Invalidate cache
    return data;
  },

  // Admin: Update rule
  async updateRule(id, updates) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const dbPayload = {};
    if (updates.topic !== undefined) dbPayload.topic = updates.topic.trim();
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.keywords !== undefined) dbPayload.keywords = updates.keywords;
    if (updates.shortAnswer !== undefined) dbPayload.short_answer = updates.shortAnswer.trim();
    if (updates.details !== undefined) dbPayload.details = updates.details.trim();
    if (updates.orderIndex !== undefined) dbPayload.order_index = updates.orderIndex;
    if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;
    dbPayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rules_knowledge')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    cachedRules = null; // Invalidate cache
    return data;
  },

  // Admin: Delete rule
  async deleteRule(id) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase
      .from('rules_knowledge')
      .delete()
      .eq('id', id);

    if (error) throw error;
    cachedRules = null;
    return true;
  },

  // Log user question in background (fire-and-forget, zero blocking)
  async logUserQuestion({ userId = null, userName = 'Guest Warrior', questionText, aiAnswer, matchedTopic = null, appSource = 'companion_hub' }) {
    if (!supabase || !questionText) return null;
    try {
      const { data, error } = await supabase
        .from('user_questions')
        .insert({
          user_id: userId,
          user_name: userName,
          question_text: questionText.trim(),
          ai_answer: aiAnswer ? aiAnswer.trim() : '',
          matched_topic: matchedTopic,
          app_source: appSource,
          admin_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.warn('Could not log question to user_questions:', error);
        return null;
      }
      return data?.id;
    } catch (e) {
      console.warn('Background question log failed:', e);
      return null;
    }
  },

  // Submit feedback on an answer (Thumbs Up / Thumbs Down / Suggested Correction)
  async submitFeedback(questionId, rating, suggestedAnswer = null) {
    if (!supabase || !questionId) return false;
    try {
      const updates = {
        user_rating: rating
      };
      if (suggestedAnswer) {
        updates.user_suggested_answer = suggestedAnswer.trim();
      }

      const { error } = await supabase
        .from('user_questions')
        .update(updates)
        .eq('id', questionId);

      return !error;
    } catch (e) {
      console.warn('Feedback update failed:', e);
      return false;
    }
  },

  // Admin: Fetch user questions with optional filtering
  async fetchUserQuestions({ filter = 'all', limit = 50 } = {}) {
    if (!supabase) return [];
    let query = supabase
      .from('user_questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter === 'unhelpful') {
      query = query.eq('user_rating', 'unhelpful');
    } else if (filter === 'corrections') {
      query = query.not('user_suggested_answer', 'is', null);
    } else if (filter === 'pending') {
      query = query.eq('admin_status', 'pending');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Admin: Update question review status
  async updateQuestionStatus(questionId, status, adminApprovedAnswer = null) {
    if (!supabase) return;
    const updates = { admin_status: status };
    if (adminApprovedAnswer) {
      updates.admin_approved_answer = adminApprovedAnswer.trim();
    }
    const { data, error } = await supabase
      .from('user_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin: Promote question & approved answer directly to Knowledge Base
  async promoteQuestionToKnowledge(questionId, ruleData) {
    const createdRule = await this.createRule(ruleData);
    await this.updateQuestionStatus(questionId, 'approved_for_kb', ruleData.shortAnswer);
    return createdRule;
  },

  // =========================================================================
  // DOCUMENT-BASED KNOWLEDGE BASE (AI_Breakdowns.txt & Custom Expansions)
  // =========================================================================

  async fetchMasterDocumentFromDisk() {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const url = `${cleanBase}Knowledge Base/AI_Breakdowns.txt`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    const text = await res.text();
    return text;
  },

  async fetchDocuments() {
    try {
      const stored = localStorage.getItem('tcg_knowledge_documents_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored knowledge documents:', e);
    }

    // Default: Load local master document public/Knowledge Base/AI_Breakdowns.txt
    try {
      const masterContent = await this.fetchMasterDocumentFromDisk();
      const masterDoc = {
        id: 'ai-breakdowns-master',
        filename: 'AI_Breakdowns.txt',
        title: 'Attention TCG Master Rulebook & AI Breakdowns',
        category: 'Master Rulebook',
        content: masterContent,
        charCount: masterContent.length,
        estimatedTokens: Math.ceil(masterContent.length / 4),
        isMaster: true,
        isActive: true,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('tcg_knowledge_documents_v2', JSON.stringify([masterDoc]));
      return [masterDoc];
    } catch (err) {
      console.error('Failed to load initial AI_Breakdowns.txt from disk:', err);
      return [{
        id: 'ai-breakdowns-master',
        filename: 'AI_Breakdowns.txt',
        title: 'Attention TCG Master Rulebook & AI Breakdowns',
        category: 'Master Rulebook',
        content: '',
        charCount: 0,
        estimatedTokens: 0,
        isMaster: true,
        isActive: true,
        updatedAt: new Date().toISOString()
      }];
    }
  },

  async saveDocument(docId, updates) {
    const docs = await this.fetchDocuments();
    const docIndex = docs.findIndex((d) => d.id === docId);
    if (docIndex === -1) throw new Error(`Document with ID ${docId} not found.`);

    const target = docs[docIndex];
    const newContent = updates.content !== undefined ? updates.content : target.content;
    const charCount = newContent.length;
    const estimatedTokens = Math.ceil(charCount / 4);

    const updatedDoc = {
      ...target,
      ...updates,
      content: newContent,
      charCount,
      estimatedTokens,
      updatedAt: new Date().toISOString()
    };

    docs[docIndex] = updatedDoc;
    localStorage.setItem('tcg_knowledge_documents_v2', JSON.stringify(docs));
    return updatedDoc;
  },

  async appendSectionToDocument(docId, { title, content, type = 'qa' }) {
    const docs = await this.fetchDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) throw new Error(`Document with ID ${docId} not found.`);

    let addition = '';
    if (type === 'qa') {
      const q = title.trim().endsWith('?') ? title.trim() : `${title.trim()}?`;
      addition = `\n\n${q}\n${content.trim()}\n`;
    } else {
      addition = `\n\n${title.trim().toUpperCase()}\n\n${content.trim()}\n`;
    }

    const newContent = (doc.content || '').trimEnd() + addition;
    return this.saveDocument(docId, { content: newContent });
  },

  async createDocument({ filename, title, category = 'Custom Expansion', content = '' }) {
    const docs = await this.fetchDocuments();
    const cleanName = filename.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const safeFilename = cleanName.endsWith('.txt') ? cleanName : `${cleanName}.txt`;
    const charCount = content.length;
    const newDoc = {
      id: `doc-${Date.now()}`,
      filename: safeFilename,
      title: (title || safeFilename).trim(),
      category: (category || 'General').trim(),
      content,
      charCount,
      estimatedTokens: Math.ceil(charCount / 4),
      isMaster: false,
      isActive: true,
      updatedAt: new Date().toISOString()
    };

    const updatedList = [...docs, newDoc];
    localStorage.setItem('tcg_knowledge_documents_v2', JSON.stringify(updatedList));
    return newDoc;
  },

  async deleteDocument(docId) {
    const docs = await this.fetchDocuments();
    const target = docs.find((d) => d.id === docId);
    if (!target) throw new Error('Document not found');
    if (target.isMaster || target.id === 'ai-breakdowns-master') {
      throw new Error('Master document AI_Breakdowns.txt cannot be deleted. You can reset it to original default instead.');
    }
    const filtered = docs.filter((d) => d.id !== docId);
    localStorage.setItem('tcg_knowledge_documents_v2', JSON.stringify(filtered));
    return true;
  },

  async resetMasterDocument() {
    const masterContent = await this.fetchMasterDocumentFromDisk();
    const docs = await this.fetchDocuments();
    const masterIndex = docs.findIndex((d) => d.isMaster || d.id === 'ai-breakdowns-master');
    const masterDoc = {
      id: 'ai-breakdowns-master',
      filename: 'AI_Breakdowns.txt',
      title: 'Attention TCG Master Rulebook & AI Breakdowns',
      category: 'Master Rulebook',
      content: masterContent,
      charCount: masterContent.length,
      estimatedTokens: Math.ceil(masterContent.length / 4),
      isMaster: true,
      isActive: true,
      updatedAt: new Date().toISOString()
    };

    if (masterIndex >= 0) {
      docs[masterIndex] = masterDoc;
    } else {
      docs.unshift(masterDoc);
    }
    localStorage.setItem('tcg_knowledge_documents_v2', JSON.stringify(docs));
    return masterDoc;
  },

  async loadActiveKnowledgeText() {
    try {
      const docs = await this.fetchDocuments();
      const activeDocs = docs.filter((d) => d.isActive !== false);
      if (activeDocs.length > 0) {
        return activeDocs.map((d) => d.content).join('\n\n');
      }
    } catch (e) {
      console.warn('Error loading active knowledge text:', e);
    }
    return this.fetchMasterDocumentFromDisk();
  }
};

// =========================================================================
// GROQ RUBRIC LIMITS & METRICS CALCULATOR
// =========================================================================
export const GROQ_LIMITS = {
  MODEL: 'openai/gpt-oss-120b',
  MAX_CONTEXT_TOKENS: 32768,
  MAX_CONTEXT_CHARS: 131072, // 32,768 tokens * 4 chars/token
  SAFE_PROMPT_CHARS: 32768,  // 8,192 tokens safe single-turn prompt budget
  RECOMMENDED_MAX_CHUNK_CHARS: 4000, // Safe maximum single-turn rule chunk (~1000 tokens)
  WARNING_THRESHOLD_PERCENT: 80
};

export const calculateGroqMetrics = (text = '') => {
  const safeText = typeof text === 'string' ? text : '';
  const charCount = safeText.length;
  const wordCount = safeText.trim() ? safeText.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.ceil(charCount / 4);
  const utilizationPercent = Math.min(100, Math.round((charCount / GROQ_LIMITS.MAX_CONTEXT_CHARS) * 100));

  let status = 'SAFE'; // 'SAFE' | 'WARNING' | 'EXCEEDED'
  let message = 'Within Groq context budget';

  if (charCount > GROQ_LIMITS.MAX_CONTEXT_CHARS) {
    status = 'EXCEEDED';
    message = `Exceeds Groq context limit of ${GROQ_LIMITS.MAX_CONTEXT_CHARS.toLocaleString()} chars (${GROQ_LIMITS.MAX_CONTEXT_TOKENS.toLocaleString()} tokens)`;
  } else if (charCount > GROQ_LIMITS.MAX_CONTEXT_CHARS * (GROQ_LIMITS.WARNING_THRESHOLD_PERCENT / 100)) {
    status = 'WARNING';
    message = `Approaching Groq context rubric threshold (>${GROQ_LIMITS.WARNING_THRESHOLD_PERCENT}%)`;
  }

  return {
    charCount,
    wordCount,
    estimatedTokens,
    utilizationPercent,
    status,
    message,
    maxChars: GROQ_LIMITS.MAX_CONTEXT_CHARS,
    maxTokens: GROQ_LIMITS.MAX_CONTEXT_TOKENS,
    recommendedMaxChunkChars: GROQ_LIMITS.RECOMMENDED_MAX_CHUNK_CHARS,
    model: GROQ_LIMITS.MODEL
  };
};

