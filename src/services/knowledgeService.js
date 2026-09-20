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

  // Admin: Fetch all rules including inactive
  async fetchAllRulesForAdmin() {
    if (!supabase) return FALLBACK_RULES;
    const { data, error } = await supabase
      .from('rules_knowledge')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
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
  }
};
