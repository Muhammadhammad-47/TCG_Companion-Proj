import { supabase, isSupabaseConfigured } from './supabaseClient';
import { RULES_KNOWLEDGE as FALLBACK_RULES } from '../game/data/rulesKnowledge.js';

// In-memory cache for ultra-fast instant answers
let cachedRules = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute

export const knowledgeService = {

  // =========================================================================
  // RULES KNOWLEDGE
  // =========================================================================

  // Fetch active rules — always Supabase first, static fallback only if DB unreachable
  async fetchRulesKnowledge(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedRules && now - lastCacheTime < CACHE_TTL_MS) {
      return cachedRules;
    }

    if (!isSupabaseConfigured || !supabase) {
      return FALLBACK_RULES;
    }

    try {
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
      console.warn('knowledgeService: Network error, using static fallback rules:', err);
      cachedRules = FALLBACK_RULES;
      return FALLBACK_RULES;
    }
  },

  // Admin: Fetch all rules (including inactive) — Supabase only, no fallback
  async fetchAllRulesForAdmin() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('rules_knowledge')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('knowledgeService: fetchAllRulesForAdmin error:', error);
      return [];
    }

    return (data || []).map((r, idx) => ({
      id: r.id,
      topic: r.topic || 'Untitled Rule',
      category: r.category || 'Combat',
      keywords: Array.isArray(r.keywords) ? r.keywords : [],
      short_answer: r.short_answer || '',
      details: r.details || '',
      order_index: r.order_index ?? idx + 1,
      is_active: r.is_active !== false
    }));
  },

  async fetchKnowledgeBase() {
    return this.fetchAllRulesForAdmin();
  },

  // Admin: Create new rule — Supabase only, throws on error
  async createRule(ruleData) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const shortAnswer = (ruleData.shortAnswer || ruleData.short_answer || '').trim();
    const { data, error } = await supabase
      .from('rules_knowledge')
      .insert({
        topic: ruleData.topic.trim(),
        category: ruleData.category || 'Gameplay',
        keywords: ruleData.keywords || [],
        short_answer: shortAnswer,
        details: (ruleData.details || '').trim(),
        order_index: ruleData.orderIndex || ruleData.order_index || 0,
        is_active: ruleData.isActive !== undefined ? ruleData.isActive : (ruleData.is_active !== false),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    cachedRules = null;
    return data;
  },

  // Admin: Update rule — Supabase only, throws on error
  async updateRule(id, updates) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const dbPayload = {};
    if (updates.topic !== undefined) dbPayload.topic = updates.topic.trim();
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.keywords !== undefined) dbPayload.keywords = updates.keywords;
    if (updates.shortAnswer !== undefined) dbPayload.short_answer = updates.shortAnswer.trim();
    if (updates.short_answer !== undefined) dbPayload.short_answer = updates.short_answer.trim();
    if (updates.details !== undefined) dbPayload.details = updates.details.trim();
    if (updates.orderIndex !== undefined) dbPayload.order_index = updates.orderIndex;
    if (updates.order_index !== undefined) dbPayload.order_index = updates.order_index;
    if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;
    if (updates.is_active !== undefined) dbPayload.is_active = updates.is_active;
    dbPayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rules_knowledge')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    cachedRules = null;
    return data;
  },

  // Admin: Delete rule — Supabase only, throws on error
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

  // =========================================================================
  // USER QUESTIONS
  // =========================================================================

  // Log user question — fire and forget, never blocks
  async logUserQuestion({ userId = null, userName = 'Guest Player', questionText, aiAnswer, matchedTopic = null, appSource = 'companion_hub' }) {
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
        console.warn('Could not log question:', error);
        return null;
      }
      return data?.id;
    } catch (e) {
      console.warn('Background question log failed:', e);
      return null;
    }
  },

  // Submit feedback — Supabase only
  async submitFeedback(questionId, rating, suggestedAnswer = null) {
    if (!supabase || !questionId) return false;
    try {
      const updates = { user_rating: rating };
      if (suggestedAnswer) {
        updates.user_suggested_answer = suggestedAnswer.trim();
        updates.admin_status = 'pending';
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

  // Submit rule correction — Supabase only
  async submitRuleCorrection({ questionId = null, questionText = '', aiAnswer = '', suggestedAnswer, userId = null, userName = 'Guest Player' }) {
    if (!suggestedAnswer || !suggestedAnswer.trim()) return false;
    try {
      if (questionId) {
        const ok = await this.submitFeedback(questionId, 'unhelpful', suggestedAnswer.trim());
        if (ok) return true;
      }
      if (!supabase) return false;
      const { error } = await supabase
        .from('user_questions')
        .insert({
          user_id: userId,
          user_name: userName,
          question_text: questionText ? questionText.trim() : 'Official Rule Correction Submission',
          ai_answer: aiAnswer ? aiAnswer.trim() : '',
          user_rating: 'unhelpful',
          user_suggested_answer: suggestedAnswer.trim(),
          admin_status: 'pending',
          app_source: 'companion_hub',
          created_at: new Date().toISOString()
        });
      return !error;
    } catch (e) {
      console.warn('Direct rule correction submit failed:', e);
      return false;
    }
  },

  // Admin: Fetch questions — always Supabase, filter by pending by default
  async fetchUserQuestions({ filter = 'pending', limit = 50 } = {}) {
    if (!supabase) return [];
    let query = supabase
      .from('user_questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter === 'unhelpful') {
      query = query.eq('user_rating', 'unhelpful');
    } else if (filter === 'corrections') {
      query = query.not('user_suggested_answer', 'is', null).eq('admin_status', 'pending');
    } else {
      // 'all', 'pending' — only show unresolved questions
      query = query.eq('admin_status', 'pending');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Admin: Update question status — Supabase only, throws on error
  async updateQuestionStatus(questionId, status, adminApprovedAnswer = null) {
    if (!supabase) throw new Error('Supabase not configured');
    const updates = { admin_status: status, updated_at: new Date().toISOString() };
    if (adminApprovedAnswer) {
      updates.admin_approved_answer = adminApprovedAnswer.trim();
    }
    const { error } = await supabase
      .from('user_questions')
      .update(updates)
      .eq('id', questionId);

    if (error) {
      console.error('updateQuestionStatus error:', error);
      throw new Error(`Failed to update question: ${error.message}`);
    }
    return true;
  },

  // Admin: Promote question to knowledge base
  async promoteQuestionToKnowledge(questionId, ruleData) {
    const createdRule = await this.createRule(ruleData);
    await this.updateQuestionStatus(questionId, 'approved_for_kb', ruleData.shortAnswer || ruleData.short_answer);
    return createdRule;
  },

  // =========================================================================
  // KNOWLEDGE DOCUMENTS — Supabase authoritative, disk file as seed only
  // =========================================================================

  async fetchMasterDocumentFromDisk() {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const url = `${cleanBase}Knowledge%20Base/AI_Breakdowns.txt`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    const text = await res.text();
    if (!text || text.trim().length === 0) throw new Error('AI_Breakdowns.txt is empty');
    return text;
  },

  async fetchDocuments() {
    if (!supabase) return this._loadDocumentsFromDiskFallback();

    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // If Supabase has documents, return them
      if (data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          filename: d.filename,
          title: d.title,
          category: d.category,
          content: d.content,
          charCount: d.char_count,
          estimatedTokens: d.estimated_tokens,
          isMaster: d.is_master,
          isActive: d.is_active,
          updatedAt: d.updated_at
        }));
      }

      // If DB is empty, seed it from disk and return
      return await this._seedMasterDocumentToSupabase();
    } catch (e) {
      console.warn('knowledgeService: fetchDocuments Supabase error:', e);
      return this._loadDocumentsFromDiskFallback();
    }
  },

  // Internal: seed master doc to Supabase from disk file
  async _seedMasterDocumentToSupabase() {
    try {
      const masterContent = await this.fetchMasterDocumentFromDisk();
      const masterDoc = {
        id: 'ai-breakdowns-master',
        filename: 'AI_Breakdowns.txt',
        title: 'Attention TCG Master Rulebook & AI Breakdowns',
        category: 'Master Rulebook',
        content: masterContent,
        char_count: masterContent.length,
        estimated_tokens: Math.ceil(masterContent.length / 4),
        is_master: true,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('knowledge_documents')
        .upsert(masterDoc, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      return [{
        id: data.id,
        filename: data.filename,
        title: data.title,
        category: data.category,
        content: data.content,
        charCount: data.char_count,
        estimatedTokens: data.estimated_tokens,
        isMaster: data.is_master,
        isActive: data.is_active,
        updatedAt: data.updated_at
      }];
    } catch (e) {
      console.warn('knowledgeService: Could not seed master document to Supabase:', e);
      return this._loadDocumentsFromDiskFallback();
    }
  },

  // Internal: last-resort fallback when Supabase is fully unavailable
  async _loadDocumentsFromDiskFallback() {
    try {
      const masterContent = await this.fetchMasterDocumentFromDisk();
      return [{
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
      }];
    } catch {
      return [{
        id: 'ai-breakdowns-master',
        filename: 'AI_Breakdowns.txt',
        title: 'Attention TCG Master Rulebook & AI Breakdowns',
        category: 'Master Rulebook',
        content: '# Master Rulebook\n\nNo content loaded yet.',
        charCount: 0,
        estimatedTokens: 0,
        isMaster: true,
        isActive: true,
        updatedAt: new Date().toISOString()
      }];
    }
  },

  // Save document — always writes to Supabase, throws on error
  async saveDocument(docId, updates) {
    if (!supabase) throw new Error('Supabase is not configured.');

    const docs = await this.fetchDocuments();
    const target = docs.find((d) => d.id === docId);
    if (!target) throw new Error(`Document ${docId} not found.`);

    const newContent = updates.content !== undefined ? updates.content : target.content;
    const charCount = newContent.length;
    const estimatedTokens = Math.ceil(charCount / 4);

    const payload = {
      filename: updates.filename ?? target.filename,
      title: updates.title ?? target.title,
      category: updates.category ?? target.category,
      content: newContent,
      char_count: charCount,
      estimated_tokens: estimatedTokens,
      is_master: target.isMaster,
      is_active: target.isActive,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update(payload)
      .eq('id', docId)
      .select()
      .single();

    if (error) throw new Error(`Failed to save document: ${error.message}`);

    return {
      id: data.id,
      filename: data.filename,
      title: data.title,
      category: data.category,
      content: data.content,
      charCount: data.char_count,
      estimatedTokens: data.estimated_tokens,
      isMaster: data.is_master,
      isActive: data.is_active,
      updatedAt: data.updated_at
    };
  },

  // Append section to document — always Supabase
  async appendSectionToDocument(docId, { title, content, type = 'qa' }) {
    const docs = await this.fetchDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) throw new Error(`Document ${docId} not found.`);

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

  // Create new document — always Supabase
  async createDocument({ filename, title, category = 'Custom Expansion', content = '' }) {
    if (!supabase) throw new Error('Supabase is not configured.');

    const cleanName = filename.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const safeFilename = cleanName.endsWith('.txt') ? cleanName : `${cleanName}.txt`;
    const charCount = content.length;

    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        filename: safeFilename,
        title: (title || safeFilename).trim(),
        category: (category || 'General').trim(),
        content,
        char_count: charCount,
        estimated_tokens: Math.ceil(charCount / 4),
        is_master: false,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);

    return {
      id: data.id,
      filename: data.filename,
      title: data.title,
      category: data.category,
      content: data.content,
      charCount: data.char_count,
      estimatedTokens: data.estimated_tokens,
      isMaster: data.is_master,
      isActive: data.is_active,
      updatedAt: data.updated_at
    };
  },

  // Delete document — always Supabase
  async deleteDocument(docId) {
    if (!supabase) throw new Error('Supabase is not configured.');

    const docs = await this.fetchDocuments();
    const target = docs.find((d) => d.id === docId);
    if (!target) throw new Error('Document not found');
    if (target.isMaster || target.id === 'ai-breakdowns-master') {
      throw new Error('Master document cannot be deleted. Use "Reset Master Document" instead.');
    }

    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', docId);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
    return true;
  },

  // Reset master document — re-seeds from disk file to Supabase
  async resetMasterDocument() {
    if (!supabase) throw new Error('Supabase is not configured.');

    const masterContent = await this.fetchMasterDocumentFromDisk();
    const masterDoc = {
      id: 'ai-breakdowns-master',
      filename: 'AI_Breakdowns.txt',
      title: 'Attention TCG Master Rulebook & AI Breakdowns',
      category: 'Master Rulebook',
      content: masterContent,
      char_count: masterContent.length,
      estimated_tokens: Math.ceil(masterContent.length / 4),
      is_master: true,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('knowledge_documents')
      .upsert(masterDoc, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw new Error(`Failed to reset master document: ${error.message}`);

    return {
      id: data.id,
      filename: data.filename,
      title: data.title,
      category: data.category,
      content: data.content,
      charCount: data.char_count,
      estimatedTokens: data.estimated_tokens,
      isMaster: data.is_master,
      isActive: data.is_active,
      updatedAt: data.updated_at
    };
  },

  // Load all active knowledge as combined text — always from Supabase
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
  MAX_CONTEXT_CHARS: 131072,
  SAFE_PROMPT_CHARS: 32768,
  RECOMMENDED_MAX_CHUNK_CHARS: 4000,
  WARNING_THRESHOLD_PERCENT: 80
};

export const calculateGroqMetrics = (text = '') => {
  const safeText = typeof text === 'string' ? text : '';
  const charCount = safeText.length;
  const wordCount = safeText.trim() ? safeText.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.ceil(charCount / 4);
  const utilizationPercent = Math.min(100, Math.round((charCount / GROQ_LIMITS.MAX_CONTEXT_CHARS) * 100));

  let status = 'SAFE';
  let message = 'Within Groq context budget';

  if (charCount > GROQ_LIMITS.MAX_CONTEXT_CHARS) {
    status = 'EXCEEDED';
    message = `Exceeds Groq context limit of ${GROQ_LIMITS.MAX_CONTEXT_CHARS.toLocaleString()} chars`;
  } else if (charCount > GROQ_LIMITS.MAX_CONTEXT_CHARS * (GROQ_LIMITS.WARNING_THRESHOLD_PERCENT / 100)) {
    status = 'WARNING';
    message = `Approaching Groq context threshold (>${GROQ_LIMITS.WARNING_THRESHOLD_PERCENT}%)`;
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
