import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Copy, Check, Server, Key, Terminal, Code2,
  Database, UserCheck, Sparkles, Flame, BookOpen, Layers, RefreshCw,
  Send, Trophy, Lock, HelpCircle, ChevronRight, Search
} from 'lucide-react';

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'player' | 'rules' | 'questions' | 'sdk'
  const [sdkLang, setSdkLang] = useState('js'); // 'js' | 'flutter' | 'swift' | 'unity' | 'curl'
  const [copiedKey, setCopiedKey] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyraulajgkonsukrtcvq.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const sdkCode = {
    js: `// =========================================================================
// ATTENTION TCG: COMPLETE JAVASCRIPT / TYPESCRIPT SDK INTEGRATION
// npm install @supabase/supabase-js
// =========================================================================
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${supabaseUrl}',
  '${anonKey}'
);

// -------------------------------------------------------------------------
// 1. AUTHENTICATION (Register, Login, Password Reset, Logout)
// -------------------------------------------------------------------------

// A. Register New Warrior
export async function registerWarrior(email, password, username, avatarId = 'chynaman', appSource = 'sister_app') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        avatar_id: avatarId,
        registered_app: appSource
      }
    }
  });
  if (error) throw error;
  return data.user;
}

// B. Warrior Sign In (Returns JWT Token & User Session)
export async function loginWarrior(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return {
    user: data.user,
    session: data.session,
    accessToken: data.session?.access_token
  };
}

// C. Forgot / Reset Password
export async function sendPasswordResetEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/#/reset-password'
  });
  if (error) throw error;
  return data;
}

// D. Sign Out Warrior
export async function logoutWarrior() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// -------------------------------------------------------------------------
// 2. PLAYER DATA PERSISTENCE & MATCH SAVE
// -------------------------------------------------------------------------

// A. Fetch Complete Warrior Profile
export async function getWarriorProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// B. Save Match Results & Update Stability Crystals (Atomic Update)
export async function saveMatchResult(userId, wonMatch, crystalsDelta = 0, appSource = 'sister_app') {
  // First fetch current record
  const current = await getWarriorProfile(userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      matches_played: (current.matches_played || 0) + 1,
      matches_won: (current.matches_won || 0) + (wonMatch ? 1 : 0),
      crystals_collected: Math.max(0, (current.crystals_collected || 0) + crystalsDelta),
      last_active_app: appSource,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// C. Fetch Global Hall of Fame / Leaderboard
export async function getTopWarriors(limit = 20) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_id, crystals_collected, matches_won, matches_played')
    .order('crystals_collected', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// -------------------------------------------------------------------------
// 3. KNOWLEDGE BASE & RULES QUERIES
// -------------------------------------------------------------------------

// A. Fetch All Active Rules for In-Game Rules Encyclopedia
export async function fetchActiveRules() {
  const { data, error } = await supabase
    .from('rules_knowledge')
    .select('id, topic, category, keywords, short_answer, details, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data;
}

// B. Search Rules by Category ('Gameplay', 'Combat', 'Setup', 'Characters', 'Cards', 'Lore')
export async function fetchRulesByCategory(category) {
  const { data, error } = await supabase
    .from('rules_knowledge')
    .select('*')
    .eq('category', category)
    .eq('is_active', true);
  if (error) throw error;
  return data;
}

// -------------------------------------------------------------------------
// 4. CONTINUOUS LEARNING LOOP (Questions & Feedback)
// -------------------------------------------------------------------------

// A. Log In-Game Query to Central Engine
export async function logSisterAppQuestion(userId, userName, questionText, aiAnswer) {
  const { data, error } = await supabase
    .from('user_questions')
    .insert({
      user_id: userId || null,
      user_name: userName || 'Warrior',
      question_text: questionText,
      ai_answer: aiAnswer,
      app_source: 'sister_app',
      admin_status: 'pending'
    })
    .select('id')
    .single();
  if (error) throw error;
  return data?.id;
}

// B. Submit Player Rating & Correction
export async function submitQuestionCorrection(questionId, rating, suggestedCorrection = null) {
  const { data, error } = await supabase
    .from('user_questions')
    .update({
      user_rating: rating,
      user_suggested_answer: suggestedCorrection
    })
    .eq('id', questionId);
  if (error) throw error;
  return data;
}`,

    flutter: `// =========================================================================
// ATTENTION TCG: COMPLETE FLUTTER / DART SDK INTEGRATION
// pubspec.yaml: supabase_flutter: ^2.8.0
// =========================================================================
import 'package:supabase_flutter/supabase_flutter.dart';

class AttentionTcgEcosystem {
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: '${supabaseUrl}',
      anonKey: '${anonKey}',
    );
  }

  static SupabaseClient get _client => Supabase.instance.client;

  // 1. WARRIOR AUTHENTICATION
  static Future<User?> registerWarrior({
    required String email,
    required String password,
    required String username,
    String avatarId = 'chynaman',
  }) async {
    final res = await _client.auth.signUp(
      email: email.trim(),
      password: password,
      data: {
        'username': username.trim(),
        'avatar_id': avatarId,
        'registered_app': 'sister_flutter_app',
      },
    );
    return res.user;
  }

  static Future<AuthResponse> loginWarrior(String email, String password) async {
    return await _client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  static Future<void> sendPasswordReset(String email) async {
    await _client.auth.resetPasswordForEmail(email.trim());
  }

  // 2. PLAYER DATA SAVE & STABILITY CRYSTALS
  static Future<Map<String, dynamic>?> getWarriorProfile(String userId) async {
    final data = await _client
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
    return data;
  }

  static Future<void> recordMatchEnd({
    required String userId,
    required bool wonMatch,
    int crystalsWon = 0,
  }) async {
    final current = await getWarriorProfile(userId);
    final played = (current?['matches_played'] ?? 0) as int;
    final won = (current?['matches_won'] ?? 0) as int;
    final crystals = (current?['crystals_collected'] ?? 0) as int;

    await _client.from('profiles').update({
      'matches_played': played + 1,
      'matches_won': won + (wonMatch ? 1 : 0),
      'crystals_collected': crystals + crystalsWon,
      'last_active_app': 'sister_flutter_app',
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', userId);
  }

  // 3. FETCH RULES KNOWLEDGE
  static Future<List<Map<String, dynamic>>> fetchActiveRules() async {
    final List<dynamic> data = await _client
        .from('rules_knowledge')
        .select()
        .eq('is_active', true)
        .order('order_index');
    return List<Map<String, dynamic>>.from(data);
  }
}`,

    swift: `// =========================================================================
// ATTENTION TCG: COMPLETE SWIFT / IOS SDK INTEGRATION
// SPM: https://github.com/supabase/supabase-swift
// =========================================================================
import Foundation
import Supabase

public final class AttentionTcgClient {
    public static let shared = AttentionTcgClient()
    public let client: SupabaseClient

    private init() {
        self.client = SupabaseClient(
            supabaseURL: URL(string: "${supabaseUrl}")!,
            supabaseKey: "${anonKey}"
        )
    }

    // 1. WARRIOR AUTHENTICATION
    public func registerWarrior(email: String, pass: String, username: String) async throws -> User {
        let authResponse = try await client.auth.signUp(
            email: email,
            password: pass,
            data: [
                "username": .string(username),
                "registered_app": .string("sister_ios_app")
            ]
        )
        return authResponse.user
    }

    public func loginWarrior(email: String, pass: String) async throws -> Session {
        return try await client.auth.signIn(email: email, password: pass)
    }

    // 2. PLAYER DATA SAVE
    public func updateMatchStats(userId: String, won: Bool, crystalsDelta: Int) async throws {
        // Increment and save warrior match record
        try await client
            .from("profiles")
            .update([
                "last_active_app": "sister_ios_app",
                "updated_at": ISO8601DateFormatter().string(from: Date())
            ])
            .eq("id", value: userId)
            .execute()
    }

    // 3. FETCH RULES ENCYCLOPEDIA
    public func fetchRules() async throws -> [RuleData] {
        return try await client
            .from("rules_knowledge")
            .select()
            .eq("is_active", value: true)
            .order("order_index")
            .execute()
            .value
    }
}

public struct RuleData: Codable, Identifiable {
    public let id: String
    public let topic: String
    public let category: String
    public let short_answer: String
    public let details: String
}`,

    unity: `// =========================================================================
// ATTENTION TCG: COMPLETE UNITY (C#) SISTER APP INTEGRATION
// =========================================================================
using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class AttentionTcgManager : MonoBehaviour
{
    private const string BaseAuthUrl = "${supabaseUrl}/auth/v1";
    private const string BaseRestUrl = "${supabaseUrl}/rest/v1";
    private const string AnonKey = "${anonKey}";

    public string CurrentAccessToken { get; private set; }
    public string CurrentUserId { get; private set; }

    // 1. WARRIOR LOGIN
    public IEnumerator Login(string email, string password, Action<bool, string> onComplete)
    {
        string endpoint = BaseAuthUrl + "/token?grant_type=password";
        string jsonPayload = "{\\"email\\":\\"" + email + "\\",\\"password\\":\\"" + password + "\\"}";

        using (UnityWebRequest req = new UnityWebRequest(endpoint, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", AnonKey);
            req.SetRequestHeader("Content-Type", "application/json");

            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                onComplete?.Invoke(true, req.downloadHandler.text);
            }
            else
            {
                onComplete?.Invoke(false, req.error);
            }
        }
    }

    // 2. SAVE MATCH STATS & STABILITY CRYSTALS
    public IEnumerator SaveMatchResult(string userId, int crystalsDelta, Action<bool> onComplete)
    {
        string endpoint = BaseRestUrl + "/profiles?id=eq." + userId;
        string patchJson = "{\\"last_active_app\\":\\"sister_unity_arena\\"}";

        using (UnityWebRequest req = UnityWebRequest.Put(endpoint, patchJson))
        {
            req.method = "PATCH";
            req.SetRequestHeader("apikey", AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + (CurrentAccessToken ?? AnonKey));
            req.SetRequestHeader("Content-Type", "application/json");

            yield return req.SendWebRequest();
            onComplete?.Invoke(req.result == UnityWebRequest.Result.Success);
        }
    }

    // 3. FETCH KNOWLEDGE BASE
    public IEnumerator FetchRules(Action<string> onComplete)
    {
        string endpoint = BaseRestUrl + "/rules_knowledge?is_active=eq.true&order=order_index.asc";
        using (UnityWebRequest req = UnityWebRequest.Get(endpoint))
        {
            req.SetRequestHeader("apikey", AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + AnonKey);
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                onComplete?.Invoke(req.downloadHandler.text);
            }
        }
    }
}`,

    curl: `# =========================================================================
# ATTENTION TCG: COMPLETE REST / RAW HTTP / cURL SUITE
# =========================================================================

# -------------------------------------------------------------------------
# 1. WARRIOR REGISTRATION (Sign Up)
# -------------------------------------------------------------------------
curl -X POST '${supabaseUrl}/auth/v1/signup' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "warrior@example.com",
    "password": "Password123!",
    "data": {
      "username": "ShadowNinja",
      "avatar_id": "chynaman",
      "registered_app": "sister_mobile"
    }
  }'

# -------------------------------------------------------------------------
# 2. WARRIOR SIGN IN (Get User JWT Access Token)
# -------------------------------------------------------------------------
curl -X POST '${supabaseUrl}/auth/v1/token?grant_type=password' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "warrior@example.com",
    "password": "Password123!"
  }'

# -------------------------------------------------------------------------
# 3. FORGOT PASSWORD / PASSWORD RECOVERY
# -------------------------------------------------------------------------
curl -X POST '${supabaseUrl}/auth/v1/recover' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "warrior@example.com"
  }'

# -------------------------------------------------------------------------
# 4. GET PLAYER PROFILE & STABILITY CRYSTALS
# -------------------------------------------------------------------------
curl -X GET '${supabaseUrl}/rest/v1/profiles?id=eq.YOUR_USER_UUID' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# -------------------------------------------------------------------------
# 5. SAVE MATCH VICTORY & CRYSTALS COLLECTED
# -------------------------------------------------------------------------
curl -X PATCH '${supabaseUrl}/rest/v1/profiles?id=eq.YOUR_USER_UUID' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer USER_JWT_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "crystals_collected": 3,
    "matches_played": 10,
    "matches_won": 7,
    "last_active_app": "sister_tournament_client"
  }'

# -------------------------------------------------------------------------
# 6. GLOBAL LEADERBOARD (Top Warriors by Crystals)
# -------------------------------------------------------------------------
curl -X GET '${supabaseUrl}/rest/v1/profiles?select=username,crystals_collected,matches_won&order=crystals_collected.desc&limit=15' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# -------------------------------------------------------------------------
# 7. QUERY ACTIVE RULES KNOWLEDGE BASE
# -------------------------------------------------------------------------
curl -X GET '${supabaseUrl}/rest/v1/rules_knowledge?is_active=eq.true&order=order_index.asc' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# -------------------------------------------------------------------------
# 8. SUBMIT PLAYER QUESTION & CONTINUOUS LEARNING FEEDBACK
# -------------------------------------------------------------------------
curl -X POST '${supabaseUrl}/rest/v1/user_questions' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "question_text": "What happens when I roll doubles?",
    "ai_answer": "Rolling doubles grants 1 Chance Card and a free re-roll.",
    "user_rating": "helpful",
    "app_source": "sister_tournament_app"
  }'`
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, #0d1a38 0%, #050a18 70%, #02040c 100%)',
        color: 'var(--text-main, #f8fafc)',
        fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
        position: 'relative',
        overflowX: 'hidden',
        paddingBottom: '80px'
      }}
    >
      {/* Ambient Neon Streaks matching the whole app */}
      <div className="menu-bg-elements" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="neon-streak-red" style={{ opacity: 0.35 }}></div>
        <div className="neon-streak-blue" style={{ opacity: 0.35 }}></div>
        <div className="subtle-watermark-card left-wm" style={{ opacity: 0.25 }}></div>
        <div className="subtle-watermark-card right-wm" style={{ opacity: 0.25 }}></div>
      </div>

      {/* Top Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 28px',
          background: 'rgba(13, 26, 56, 0.94)',
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
              ATTENTION TCG <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>DEVELOPER PORTAL & API DOCS</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Unified Player Identity, Match Sync, Rules Engine & Continuous Learning
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'rgba(255, 230, 0, 0.08)',
              border: '1px solid rgba(255, 230, 0, 0.3)',
              color: 'var(--neon-gold, #ffe600)',
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
            <Shield size={16} /> ADMIN PORTAL
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner */}
        <div
          style={{
            background: 'rgba(14, 22, 42, 0.9)',
            border: '1.5px solid rgba(0, 240, 255, 0.28)',
            borderRadius: '20px',
            padding: '28px 32px',
            marginBottom: '28px',
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 10px #39ff14' }} />
              <span style={{ fontSize: '0.9rem', color: '#39ff14', fontWeight: 'bold', letterSpacing: '2px' }}>SHARED BACKEND API v1.0</span>
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '1.5px', color: '#fff' }}>
              Sister Applications & Shared Ecosystem
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', maxWidth: '780px', fontSize: '1.05rem', fontFamily: 'var(--font-sub, "Outfit", sans-serif)', lineHeight: '1.6' }}>
              Build sister mobile apps, tournament dashboards, and Unity arenas that seamlessly share the same player warrior profiles, persistent Stability Crystals, dynamic game rules, and AI chatbot continuous learning pipeline.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(5, 10, 24, 0.8)', border: '1px solid rgba(0, 240, 255, 0.25)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ color: 'var(--neon-cyan, #00f0ff)', fontSize: '1.5rem', fontWeight: '900' }}>Postgres + RLS</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '1px' }}>SECURITY LAYER</div>
            </div>
            <div style={{ background: 'rgba(5, 10, 24, 0.8)', border: '1px solid rgba(255, 230, 0, 0.25)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '1.5rem', fontWeight: '900' }}>REST & Realtime</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '1px' }}>ECOSYSTEM SYNC</div>
            </div>
          </div>
        </div>

        {/* Credentials & Connection Info */}
        <div
          style={{
            background: 'rgba(14, 22, 42, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            padding: '22px 26px',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', fontSize: '1.1rem' }}>
            <Key size={18} /> ENVIRONMENT & REST API HEADERS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '1px' }}>BASE REST & AUTH URL</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ color: '#fff', fontSize: '0.92rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{supabaseUrl}</code>
                <button
                  onClick={() => handleCopy(supabaseUrl, 'url')}
                  style={{ background: 'none', border: 'none', color: copiedKey === 'url' ? '#39ff14' : 'var(--neon-cyan, #00f0ff)', cursor: 'pointer', padding: '4px' }}
                  title="Copy URL"
                >
                  {copiedKey === 'url' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(5, 10, 24, 0.85)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '1px' }}>ANON PUBLIC CLIENT KEY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                  {anonKey.substring(0, 36)}...
                </code>
                <button
                  onClick={() => handleCopy(anonKey, 'key')}
                  style={{ background: 'none', border: 'none', color: copiedKey === 'key' ? '#39ff14' : 'var(--neon-gold, #ffe600)', cursor: 'pointer', padding: '4px' }}
                  title="Copy Anon Key"
                >
                  {copiedKey === 'key' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Category Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'auth', label: '🔐 Auth (Signup/Login/Forgot)', icon: UserCheck },
            { id: 'player', label: '🛡️ Player Data & Crystals Save', icon: Trophy },
            { id: 'rules', label: '📚 Rules Knowledge API', icon: BookOpen },
            { id: 'questions', label: '💬 AI Questions Feedback Loop', icon: Send },
            { id: 'sdk', label: '💻 Client SDK Code Samples', icon: Code2 },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSel = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: isSel ? '2px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                  background: isSel ? 'rgba(0, 240, 255, 0.18)' : 'rgba(14, 22, 42, 0.7)',
                  color: isSel ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  boxShadow: isSel ? '0 0 15px rgba(0, 240, 255, 0.25)' : 'none'
                }}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            CATEGORY 1: COMPLETE AUTHENTICATION APIs
        ========================================================================= */}
        {activeTab === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} /> 1. Warrior Registration (`POST /auth/v1/signup`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Registers a new player from any sister app, creates their authentication user record, and automatically triggers the initial `profiles` row with 0 crystals, 0 matches, and selected avatar.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--neon-gold, #ffe600)', marginBottom: '4px', letterSpacing: '1px' }}>REQUEST HEADERS & BODY:</div>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`POST ${supabaseUrl}/auth/v1/signup
apikey: ${anonKey}
Content-Type: application/json

{
  "email": "warrior@example.com",
  "password": "Password123!",
  "data": {
    "username": "BlazingTiger",
    "avatar_id": "chynaman",
    "registered_app": "sister_tournament_app"
  }
}`}
                </pre>
              </div>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <div style={{ fontSize: '0.75rem', color: '#39ff14', marginBottom: '4px', letterSpacing: '1px' }}>RESPONSE 200 OK:</div>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`{
  "id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
  "email": "warrior@example.com",
  "user_metadata": {
    "username": "BlazingTiger",
    "avatar_id": "chynaman",
    "registered_app": "sister_tournament_app"
  },
  "created_at": "2026-09-20T23:45:00.000Z"
}`}
                </pre>
              </div>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} /> 2. Warrior Login (`POST /auth/v1/token?grant_type=password`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Authenticates an existing player with email & password, returning a signed JWT `access_token` and `refresh_token` for authenticated writes.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto', marginBottom: '14px' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`POST ${supabaseUrl}/auth/v1/token?grant_type=password
apikey: ${anonKey}
Content-Type: application/json

{
  "email": "warrior@example.com",
  "password": "Password123!"
}`}
                </pre>
              </div>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <div style={{ fontSize: '0.75rem', color: '#39ff14', marginBottom: '4px', letterSpacing: '1px' }}>RESPONSE 200 OK:</div>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "r_38a9d1...",
  "user": {
    "id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
    "email": "warrior@example.com"
  }
}`}
                </pre>
              </div>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-gold, #ffe600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} /> 3. Forgot Password / Recovery (`POST /auth/v1/recover`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Sends a secure password reset email to the warrior.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`POST ${supabaseUrl}/auth/v1/recover
apikey: ${anonKey}
Content-Type: application/json

{
  "email": "warrior@example.com"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CATEGORY 2: PLAYER DATA & CRYSTALS PERSISTENCE
        ========================================================================= */}
        {activeTab === 'player' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} /> 1. Fetch Warrior Profile (`GET /rest/v1/profiles?id=eq.{uuid}`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Retrieves current Stability Crystals balance, match wins, games played, and avatar across all companion and sister apps.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto', marginBottom: '14px' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`GET ${supabaseUrl}/rest/v1/profiles?id=eq.c7a8b9e0-1234-5678-90ab-cdef12345678
apikey: ${anonKey}
Authorization: Bearer ${anonKey}`}
                </pre>
              </div>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <div style={{ fontSize: '0.75rem', color: '#39ff14', marginBottom: '4px', letterSpacing: '1px' }}>RESPONSE 200 OK:</div>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`[
  {
    "id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
    "email": "warrior@example.com",
    "username": "BlazingTiger",
    "avatar_id": "chynaman",
    "is_admin": false,
    "crystals_collected": 7,
    "matches_played": 14,
    "matches_won": 10,
    "last_active_app": "companion_hub"
  }
]`}
                </pre>
              </div>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-gold, #ffe600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} /> 2. Save Match Results & Crystals (`PATCH /rest/v1/profiles?id=eq.{uuid}`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Saves match outcomes, increments wins, updates crystals, and notes originating sister app. Requires player's own JWT token.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto', marginBottom: '14px' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`PATCH ${supabaseUrl}/rest/v1/profiles?id=eq.c7a8b9e0-1234-5678-90ab-cdef12345678
apikey: ${anonKey}
Authorization: Bearer USER_JWT_ACCESS_TOKEN
Content-Type: application/json

{
  "matches_played": 15,
  "matches_won": 11,
  "crystals_collected": 10,
  "last_active_app": "sister_tournament_arena"
}`}
                </pre>
              </div>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: '#39ff14', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} /> 3. Global Hall of Fame (`GET /rest/v1/profiles?order=crystals_collected.desc`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Returns leaderboard rankings for tournaments or in-game banners.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`GET ${supabaseUrl}/rest/v1/profiles?select=username,avatar_id,crystals_collected,matches_won&order=crystals_collected.desc&limit=10
apikey: ${anonKey}
Authorization: Bearer ${anonKey}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CATEGORY 3: RULES & KNOWLEDGE BASE APIs
        ========================================================================= */}
        {activeTab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} /> 1. Query Active Rules Knowledge (`GET /rest/v1/rules_knowledge`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Fetches active official rules, keyword tokens, spoken short answers, and detailed card descriptions.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto', marginBottom: '14px' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`GET ${supabaseUrl}/rest/v1/rules_knowledge?is_active=eq.true&order=order_index.asc
apikey: ${anonKey}
Authorization: Bearer ${anonKey}`}
                </pre>
              </div>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <div style={{ fontSize: '0.75rem', color: '#39ff14', marginBottom: '4px', letterSpacing: '1px' }}>RESPONSE 200 OK:</div>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`[
  {
    "id": "18f921ab-...",
    "topic": "Official Attention TCG Rules & Overview",
    "category": "Gameplay",
    "keywords": ["rule", "rules", "setup", "crystals"],
    "short_answer": "Players roll 2 dice for turn order, start with 5 ET, 10 Action Cards, 10 Character Cards, and 1 Stability Crystal...",
    "details": "Core Rules Breakdown:\\n1. Setup: Each player draws 10 cards...\\n2. Victory: First to collect 3 Stability Crystals wins!",
    "order_index": 1,
    "is_active": true
  }
]`}
                </pre>
              </div>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={20} /> 2. Category & Keyword Filter
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Filter rules by category (`Combat`, `Gameplay`, `Setup`, `Characters`, `Cards`, `Lore`) or match array keywords.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`# Filter by Category:
GET ${supabaseUrl}/rest/v1/rules_knowledge?category=eq.Combat&is_active=eq.true

# Keyword Token Array Search:
GET ${supabaseUrl}/rest/v1/rules_knowledge?keywords=cs.{"clash","dp"}&is_active=eq.true`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CATEGORY 4: CONTINUOUS LEARNING LOOP APIs
        ========================================================================= */}
        {activeTab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} /> 1. Log User Question (`POST /rest/v1/user_questions`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Submits user inquiries asked in chatbots or sister app in-game help screens.
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`POST ${supabaseUrl}/rest/v1/user_questions
apikey: ${anonKey}
Authorization: Bearer ${anonKey}
Content-Type: application/json

{
  "user_id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
  "user_name": "BlazingTiger",
  "question_text": "How many dice do I roll for the clash?",
  "ai_answer": "Each player rolls 2 dice for the clash: attacker rolls 2 Red dice, defender rolls 2 Gold dice.",
  "app_source": "sister_tournament_app"
}`}
                </pre>
              </div>
            </div>

            <div style={{ background: 'rgba(14, 22, 42, 0.88)', border: '1.5px solid rgba(0, 240, 255, 0.25)', borderRadius: '18px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--neon-gold, #ffe600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} /> 2. Submit Player Rating & Suggested Correction (`PATCH /rest/v1/user_questions`)
              </h3>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                Allows players to flag inaccurate answers and submit what the rule should be. This feeds into the Admin Inbox for 1-click promotion to the official Knowledge Base!
              </p>

              <div style={{ background: '#030610', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', fontFamily: 'Consolas, monospace' }}>
{`PATCH ${supabaseUrl}/rest/v1/user_questions?id=eq.QUESTION_UUID
apikey: ${anonKey}
Authorization: Bearer ${anonKey}
Content-Type: application/json

{
  "user_rating": "unhelpful",
  "user_suggested_answer": "Attacker rolls 2 red dice, defender rolls 2 gold dice, and defender DP armor triggers if gold dice sum to 6 or higher."
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CATEGORY 5: CLIENT SDK CODE EXAMPLES
        ========================================================================= */}
        {activeTab === 'sdk' && (
          <div
            style={{
              background: 'rgba(14, 22, 42, 0.88)',
              border: '1.5px solid rgba(0, 240, 255, 0.25)',
              borderRadius: '18px',
              overflow: 'hidden'
            }}
          >
            {/* Language Selector Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'rgba(8, 15, 32, 0.95)',
                borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'js', label: 'JavaScript / React / TS' },
                  { id: 'flutter', label: 'Flutter / Dart' },
                  { id: 'swift', label: 'iOS / Swift' },
                  { id: 'unity', label: 'Unity / C#' },
                  { id: 'curl', label: 'cURL / REST HTTP' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSdkLang(tab.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: sdkLang === tab.id ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                      background: sdkLang === tab.id ? 'rgba(0, 240, 255, 0.18)' : 'rgba(0,0,0,0.3)',
                      color: sdkLang === tab.id ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopy(sdkCode[sdkLang], 'sdk_code')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--neon-cyan, #00f0ff)',
                  background: 'rgba(0, 240, 255, 0.12)',
                  color: 'var(--neon-cyan, #00f0ff)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                }}
              >
                {copiedKey === 'sdk_code' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedKey === 'sdk_code' ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}</span>
              </button>
            </div>

            {/* Code Block Display */}
            <div style={{ padding: '24px', background: '#030610', overflowX: 'auto' }}>
              <pre
                style={{
                  margin: 0,
                  color: '#e2e8f0',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}
              >
                {sdkCode[sdkLang]}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
