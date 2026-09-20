import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Copy, Check, Server, Key, Terminal, Code2,
  Database, UserCheck, Sparkles, Flame, BookOpen, Layers, RefreshCw,
  Send, Trophy, Lock, HelpCircle, ChevronRight, Search, ExternalLink,
  Info, AlertTriangle, CheckCircle2, FileText, Cpu, Smartphone, Globe
} from 'lucide-react';

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [activeSdk, setActiveSdk] = useState('js');
  const [copiedKey, setCopiedKey] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const mainScrollRef = useRef(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyraulajgkonsukrtcvq.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Syntax highlighting simulated tokens for JSON/Code
  const HighlightedJson = ({ code }) => {
    return (
      <pre
        style={{
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.86rem',
          lineHeight: '1.65',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {code}
      </pre>
    );
  };

  const navGroups = [
    {
      title: 'GETTING STARTED',
      items: [
        { id: 'overview', label: 'Architecture & Overview' },
        { id: 'auth-headers', label: 'Headers & Security (RLS)' },
        { id: 'project-config', label: 'Base URL & Project Keys' }
      ]
    },
    {
      title: 'WARRIOR IDENTITY & AUTH',
      items: [
        { id: 'auth-signup', label: 'Register Warrior (POST /signup)', method: 'POST' },
        { id: 'auth-login', label: 'Warrior Login (POST /token)', method: 'POST' },
        { id: 'auth-refresh', label: 'Refresh Session Token', method: 'POST' },
        { id: 'auth-recover', label: 'Password Recovery (POST /recover)', method: 'POST' }
      ]
    },
    {
      title: 'PLAYER DATA & MATCH SAVE',
      items: [
        { id: 'player-get', label: 'Get Player Profile & Stats', method: 'GET' },
        { id: 'player-save', label: 'Save Match & Crystals', method: 'PATCH' },
        { id: 'player-leaderboard', label: 'Global Hall of Fame', method: 'GET' }
      ]
    },
    {
      title: 'RULES KNOWLEDGE ENGINE',
      items: [
        { id: 'rules-all', label: 'Query Active Game Rules', method: 'GET' },
        { id: 'rules-category', label: 'Category & Keyword Filter', method: 'GET' }
      ]
    },
    {
      title: 'AI CHAT & LEARNING LOOP',
      items: [
        { id: 'questions-log', label: 'Log Sister App Query', method: 'POST' },
        { id: 'questions-feedback', label: 'Submit Rating & Correction', method: 'PATCH' }
      ]
    },
    {
      title: 'CLIENT SDK LIBRARIES',
      items: [
        { id: 'sdk-section', label: 'JS, Flutter, Swift, Unity, cURL' }
      ]
    }
  ];

  const sdkCode = {
    js: `// =========================================================================
// ATTENTION TCG: COMPLETE JAVASCRIPT / TYPESCRIPT SDK INTEGRATION
// npm install @supabase/supabase-js
// =========================================================================
import { createClient } from '@supabase/supabase-js';

export const tcgClient = createClient(
  '${supabaseUrl}',
  '${anonKey}'
);

// 1. REGISTER NEW WARRIOR
export async function registerWarrior(email, password, username, appSource = 'sister_web') {
  const { data, error } = await tcgClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        avatar_id: 'chynaman',
        registered_app: appSource
      }
    }
  });
  if (error) throw error;
  return data.user;
}

// 2. WARRIOR LOGIN (Returns JWT token & Session)
export async function loginWarrior(email, password) {
  const { data, error } = await tcgClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return { user: data.user, token: data.session?.access_token };
}

// 3. FETCH WARRIOR PROFILE & STABILITY CRYSTALS
export async function getWarriorProfile(userId) {
  const { data, error } = await tcgClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// 4. SAVE MATCH RESULT & INCREMENT CRYSTALS
export async function recordMatchVictory(userId, wonMatch, crystalsWon = 1, appSource = 'sister_web') {
  const current = await getWarriorProfile(userId);
  const { data, error } = await tcgClient
    .from('profiles')
    .update({
      matches_played: (current.matches_played || 0) + 1,
      matches_won: (current.matches_won || 0) + (wonMatch ? 1 : 0),
      crystals_collected: Math.max(0, (current.crystals_collected || 0) + crystalsWon),
      last_active_app: appSource,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 5. FETCH LIVE RULES ENCYCLOPEDIA
export async function fetchRules() {
  const { data, error } = await tcgClient
    .from('rules_knowledge')
    .select('*')
    .eq('is_active', true)
    .order('order_index');
  if (error) throw error;
  return data;
}`,

    flutter: `// =========================================================================
// ATTENTION TCG: COMPLETE FLUTTER / DART SDK INTEGRATION
// pubspec.yaml: supabase_flutter: ^2.8.0
// =========================================================================
import 'package:supabase_flutter/supabase_flutter.dart';

class TcgEcosystemService {
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: '${supabaseUrl}',
      anonKey: '${anonKey}',
    );
  }

  static SupabaseClient get client => Supabase.instance.client;

  // 1. WARRIOR LOGIN
  static Future<AuthResponse> login(String email, String password) async {
    return await client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  // 2. SAVE MATCH OUTCOME & CRYSTALS
  static Future<void> saveMatchResult({
    required String userId,
    required bool wonMatch,
    int crystalsWon = 1,
  }) async {
    final current = await client.from('profiles').select().eq('id', userId).single();
    final played = (current['matches_played'] ?? 0) as int;
    final won = (current['matches_won'] ?? 0) as int;
    final crystals = (current['crystals_collected'] ?? 0) as int;

    await client.from('profiles').update({
      'matches_played': played + 1,
      'matches_won': won + (wonMatch ? 1 : 0),
      'crystals_collected': crystals + crystalsWon,
      'last_active_app': 'sister_flutter_app',
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', userId);
  }

  // 3. FETCH RULES
  static Future<List<Map<String, dynamic>>> getRules() async {
    final List<dynamic> data = await client
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

public final class AttentionTcgEcosystem {
    public static let shared = AttentionTcgEcosystem()
    public let client: SupabaseClient

    private init() {
        self.client = SupabaseClient(
            supabaseURL: URL(string: "${supabaseUrl}")!,
            supabaseKey: "${anonKey}"
        )
    }

    // 1. WARRIOR LOGIN
    public func login(email: String, pass: String) async throws -> Session {
        return try await client.auth.signIn(email: email, password: pass)
    }

    // 2. FETCH ACTIVE RULES
    public func fetchRules() async throws -> [Rule] {
        return try await client
            .from("rules_knowledge")
            .select()
            .eq("is_active", value: true)
            .order("order_index")
            .execute()
            .value
    }
}

public struct Rule: Codable, Identifiable {
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

public class AttentionTcgClient : MonoBehaviour
{
    private const string RestUrl = "${supabaseUrl}/rest/v1";
    private const string AuthUrl = "${supabaseUrl}/auth/v1";
    private const string AnonKey = "${anonKey}";

    // 1. AUTHENTICATE WARRIOR
    public IEnumerator Authenticate(string email, string password, Action<string> onSuccess, Action<string> onError)
    {
        string endpoint = AuthUrl + "/token?grant_type=password";
        string json = "{\\"email\\":\\"" + email + "\\",\\"password\\":\\"" + password + "\\"}";

        using (UnityWebRequest req = new UnityWebRequest(endpoint, "POST"))
        {
            byte[] body = Encoding.UTF8.GetBytes(json);
            req.uploadHandler = new UploadHandlerRaw(body);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("apikey", AnonKey);
            req.SetRequestHeader("Content-Type", "application/json");

            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success) {
                onSuccess?.Invoke(req.downloadHandler.text);
            } else {
                onError?.Invoke(req.error);
            }
        }
    }

    // 2. FETCH RULES ENCYCLOPEDIA
    public IEnumerator FetchRules(Action<string> onComplete)
    {
        string endpoint = RestUrl + "/rules_knowledge?is_active=eq.true&order=order_index.asc";
        using (UnityWebRequest req = UnityWebRequest.Get(endpoint))
        {
            req.SetRequestHeader("apikey", AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + AnonKey);
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success) {
                onComplete?.Invoke(req.downloadHandler.text);
            }
        }
    }
}`,

    curl: `# =========================================================================
# ATTENTION TCG: COMPLETE cURL / RAW REST HTTP SPECIFICATION
# =========================================================================

# 1. WARRIOR SIGN UP
curl -X POST '${supabaseUrl}/auth/v1/signup' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "warrior@example.com",
    "password": "Password123!",
    "data": { "username": "CyberDragon", "registered_app": "sister_tournament" }
  }'

# 2. WARRIOR LOGIN (Fetch User JWT Bearer Token)
curl -X POST '${supabaseUrl}/auth/v1/token?grant_type=password' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "warrior@example.com",
    "password": "Password123!"
  }'

# 3. GET PLAYER PROFILE & STABILITY CRYSTALS
curl -X GET '${supabaseUrl}/rest/v1/profiles?id=eq.YOUR_USER_UUID' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# 4. SAVE MATCH RESULT & INCREMENT CRYSTALS
curl -X PATCH '${supabaseUrl}/rest/v1/profiles?id=eq.YOUR_USER_UUID' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "crystals_collected": 5,
    "matches_played": 8,
    "matches_won": 6,
    "last_active_app": "sister_unity_arena"
  }'

# 5. FETCH ACTIVE RULES ENCYCLOPEDIA
curl -X GET '${supabaseUrl}/rest/v1/rules_knowledge?is_active=eq.true&order=order_index.asc' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# 6. LOG IN-GAME USER QUESTION
curl -X POST '${supabaseUrl}/rest/v1/user_questions' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "question_text": "How many dice do I roll for the clash?",
    "ai_answer": "Attacker rolls 2 red dice, defender rolls 2 gold dice.",
    "app_source": "sister_tournament_client"
  }'`
  };

  const methodBadge = (method) => {
    switch (method) {
      case 'GET':
        return <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: 'var(--neon-cyan, #00f0ff)', border: '1px solid rgba(0, 240, 255, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>GET</span>;
      case 'POST':
        return <span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', border: '1px solid rgba(57, 255, 20, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>POST</span>;
      case 'PATCH':
        return <span style={{ background: 'rgba(255, 230, 0, 0.15)', color: 'var(--neon-gold, #ffe600)', border: '1px solid rgba(255, 230, 0, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>PATCH</span>;
      case 'DELETE':
        return <span style={{ background: 'rgba(255, 51, 102, 0.15)', color: 'var(--neon-crimson, #ff3366)', border: '1px solid rgba(255, 51, 102, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>DELETE</span>;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#040816',
        color: '#f8fafc',
        fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
        overflow: 'hidden'
      }}
    >
      <style>{`
        /* Custom sleek cyberpunk scrollbars */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(3, 7, 18, 0.95);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 240, 255, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 240, 255, 0.6);
        }
        .docs-nav-link:hover {
          background: rgba(0, 240, 255, 0.08) !important;
          color: var(--neon-cyan, #00f0ff) !important;
        }
        .docs-endpoint-card {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .docs-endpoint-card:hover {
          border-color: rgba(0, 240, 255, 0.4) !important;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.08);
        }
      `}</style>

      {/* Top Sticky Navigation Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'rgba(10, 18, 38, 0.96)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.22)',
          backdropFilter: 'blur(12px)',
          zIndex: 100,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: 'var(--neon-cyan, #00f0ff)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
              fontSize: '0.9rem'
            }}
          >
            <ArrowLeft size={16} /> HUB
          </button>
          <div className="brand-pill-badge" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>注意!</div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '1px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
              ATTENTION TCG <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>DEVELOPER PORTAL</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => handleCopy(supabaseUrl, 'top_url')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copiedKey === 'top_url' ? <Check size={14} color="#39ff14" /> : <Copy size={14} />}
            <span>Copy Base URL</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'rgba(255, 230, 0, 0.1)',
              border: '1px solid rgba(255, 230, 0, 0.3)',
              color: 'var(--neon-gold, #ffe600)',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
              fontSize: '0.9rem'
            }}
          >
            <Shield size={14} /> ADMIN
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          style={{
            width: '280px',
            background: 'rgba(6, 12, 28, 0.95)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto'
          }}
        >
          {/* Quick Filter */}
          <div style={{ padding: '16px 16px 8px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '7px 10px 7px 32px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Navigation Tree */}
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {navGroups.map((group, gIdx) => {
              const filteredItems = group.items.filter((item) =>
                item.label.toLowerCase().includes(searchFilter.toLowerCase())
              );
              if (filteredItems.length === 0) return null;

              return (
                <div key={gIdx}>
                  <div style={{ fontSize: '0.72rem', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 'bold', padding: '0 8px 6px 8px', textTransform: 'uppercase' }}>
                    {group.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {filteredItems.map((item) => {
                      const isSel = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          className="docs-nav-link"
                          onClick={() => scrollTo(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isSel ? 'rgba(0, 240, 255, 0.14)' : 'transparent',
                            color: isSel ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255, 255, 255, 0.75)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.86rem',
                            fontWeight: isSel ? 'bold' : 'normal',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>
                          {item.method && methodBadge(item.method)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* MAIN DOCUMENTATION CONTENT */}
        <main
          ref={mainScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '40px 48px 100px 48px',
            maxWidth: '1100px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {/* SECTION 1: ARCHITECTURE OVERVIEW */}
          <section id="overview" style={{ marginBottom: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#39ff14', fontWeight: 'bold', letterSpacing: '1px' }}>
                ARCHITECTURE & SYNC
              </span>
            </div>
            <h1 style={{ fontSize: '2.6rem', fontWeight: '900', letterSpacing: '1px', margin: '0 0 16px 0', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
              Sister Applications & Shared Ecosystem
            </h1>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: '#cbd5e1', margin: '0 0 20px 0' }}>
              The Attention TCG backend powers a synchronized universe. Players can register from any sister app (mobile tournament organizer, companion hub, or Unity 3D tabletop) and retain their single unified identity, shared <strong>Stability Crystals</strong>, deck statistics, and access to the dynamic <strong>Knowledge Base</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '24px' }}>
              <div style={{ background: 'rgba(14, 22, 42, 0.7)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '18px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '6px' }}>Single Player Identity</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>Sign in once, play everywhere. Player stats and crystal inventory sync automatically across all sister apps.</div>
              </div>
              <div style={{ background: 'rgba(14, 22, 42, 0.7)', border: '1px solid rgba(255, 230, 0, 0.2)', padding: '18px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--neon-gold, #ffe600)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '6px' }}>Live Game Rules</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>Game Masters update rules in the Admin Portal; sister apps query live endpoints so rule changes deploy instantly with zero app re-builds.</div>
              </div>
              <div style={{ background: 'rgba(14, 22, 42, 0.7)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '18px', borderRadius: '12px' }}>
                <div style={{ color: '#39ff14', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '6px' }}>Continuous Learning</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>Questions asked in your sister apps feed directly into the central learning loop for admin review and 1-click promotion.</div>
              </div>
            </div>
          </section>

          {/* SECTION 2: HEADERS & RLS */}
          <section id="auth-headers" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 12px 0', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
              Headers & Row Level Security (RLS)
            </h2>
            <p style={{ color: '#cbd5e1', lineHeight: '1.7', margin: '0 0 16px 0' }}>
              Every HTTP request to the backend must include the public anon <code>apikey</code> header. For authenticated write operations (such as saving match crystals or updating a warrior profile), include the player's signed JWT token in the <code>Authorization: Bearer &lt;token&gt;</code> header.
            </p>

            <div style={{ background: '#030712', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--neon-cyan, #00f0ff)' }}>
                    <th style={{ padding: '8px' }}>HEADER NAME</th>
                    <th style={{ padding: '8px' }}>VALUE</th>
                    <th style={{ padding: '8px' }}>PURPOSE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 8px' }}><code>apikey</code></td>
                    <td style={{ padding: '10px 8px', color: 'var(--neon-gold, #ffe600)' }}>ANON_PUBLIC_KEY</td>
                    <td style={{ padding: '10px 8px', color: '#94a3b8' }}>Mandatory on all requests to route through Supabase API gateway.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 8px' }}><code>Authorization</code></td>
                    <td style={{ padding: '10px 8px', color: '#39ff14' }}>Bearer &lt;USER_JWT_OR_ANON&gt;</td>
                    <td style={{ padding: '10px 8px', color: '#94a3b8' }}>Used by Postgres RLS to verify that players can only edit their own data.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 8px' }}><code>Content-Type</code></td>
                    <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>application/json</td>
                    <td style={{ padding: '10px 8px', color: '#94a3b8' }}>Required for all POST and PATCH payloads.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: PROJECT CONFIG */}
          <section id="project-config" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 12px 0', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
              Host Config & Environment Variables
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>BASE REST / AUTH HOST</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ color: '#fff', fontSize: '0.9rem' }}>{supabaseUrl}</code>
                  <button onClick={() => handleCopy(supabaseUrl, 'cfg_url')} style={{ background: 'none', border: 'none', color: copiedKey === 'cfg_url' ? '#39ff14' : 'var(--neon-cyan, #00f0ff)', cursor: 'pointer' }}>
                    {copiedKey === 'cfg_url' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>ANON CLIENT KEY</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.85rem' }}>{anonKey.substring(0, 32)}...</code>
                  <button onClick={() => handleCopy(anonKey, 'cfg_key')} style={{ background: 'none', border: 'none', color: copiedKey === 'cfg_key' ? '#39ff14' : 'var(--neon-gold, #ffe600)', cursor: 'pointer' }}>
                    {copiedKey === 'cfg_key' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              ENDPOINT 1: WARRIOR REGISTRATION (SIGN UP)
          ========================================================================= */}
          <section id="auth-signup" className="docs-endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {methodBadge('POST')}
              <code style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>/auth/v1/signup</code>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>Public (Anon Key)</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' }}>Register New Warrior</h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              Call this endpoint when a player registers in your sister app. It creates the authentication account and automatically generates their profile record in the <code>profiles</code> table with initial stats (0 crystals, 0 matches, and selected avatar).
            </p>

            {/* Parameters Table */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>REQUEST BODY PARAMETERS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', background: '#020612', borderRadius: '8px', overflow: 'hidden' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 12px', color: '#fff', width: '140px' }}><code>email</code></td>
                    <td style={{ padding: '8px 12px', color: '#39ff14', width: '90px' }}>string</td>
                    <td style={{ padding: '8px 12px', color: 'var(--neon-crimson, #ff3366)', width: '80px' }}>Required</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>Warrior email address.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 12px', color: '#fff' }}><code>password</code></td>
                    <td style={{ padding: '8px 12px', color: '#39ff14' }}>string</td>
                    <td style={{ padding: '8px 12px', color: 'var(--neon-crimson, #ff3366)' }}>Required</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>Password (minimum 6 characters).</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', color: '#fff' }}><code>data.username</code></td>
                    <td style={{ padding: '8px 12px', color: '#39ff14' }}>string</td>
                    <td style={{ padding: '8px 12px', color: 'var(--neon-crimson, #ff3366)' }}>Required</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>Display name chosen by the warrior.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Code Sample */}
            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--neon-gold, #ffe600)', letterSpacing: '1px' }}>EXAMPLE JSON PAYLOAD:</span>
                <button
                  onClick={() => handleCopy(`{\n  "email": "warrior@example.com",\n  "password": "Password123!",\n  "data": {\n    "username": "ShadowNinja",\n    "registered_app": "sister_tournament"\n  }\n}`, 'req_signup')}
                  style={{ background: 'none', border: 'none', color: copiedKey === 'req_signup' ? '#39ff14' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'req_signup' ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
              <HighlightedJson code={`POST ${supabaseUrl}/auth/v1/signup
apikey: ${anonKey}
Content-Type: application/json

{
  "email": "warrior@example.com",
  "password": "Password123!",
  "data": {
    "username": "ShadowNinja",
    "avatar_id": "chynaman",
    "registered_app": "sister_tournament_app"
  }
}`} />
            </div>
          </section>

          {/* =========================================================================
              ENDPOINT 2: WARRIOR LOGIN
          ========================================================================= */}
          <section id="auth-login" className="docs-endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {methodBadge('POST')}
              <code style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>/auth/v1/token?grant_type=password</code>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>Public (Anon Key)</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' }}>Warrior Sign In (Get JWT Session Token)</h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              Authenticates an existing player with email & password. Returns a signed JWT <code>access_token</code> and <code>refresh_token</code>. Save the <code>access_token</code> to authorize subsequent match results and profile updates.
            </p>

            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <HighlightedJson code={`POST ${supabaseUrl}/auth/v1/token?grant_type=password
apikey: ${anonKey}
Content-Type: application/json

{
  "email": "warrior@example.com",
  "password": "Password123!"
}

# --- RESPONSE 200 OK ---
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "r_982ab1...",
  "user": {
    "id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
    "email": "warrior@example.com"
  }
}`} />
            </div>
          </section>

          {/* =========================================================================
              ENDPOINT 3: GET PLAYER PROFILE & CRYSTALS
          ========================================================================= */}
          <section id="player-get" className="docs-endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {methodBadge('GET')}
              <code style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/profiles?id=eq.&#123;uuid&#125;</code>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>Public / Authenticated</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' }}>Fetch Warrior Profile & Stability Crystals</h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              Retrieves the player's lifetime statistics, matches won, matches played, and current balance of <strong>Stability Crystals</strong> (the primary victory asset in Attention TCG).
            </p>

            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <HighlightedJson code={`GET ${supabaseUrl}/rest/v1/profiles?id=eq.c7a8b9e0-1234-5678-90ab-cdef12345678
apikey: ${anonKey}
Authorization: Bearer ${anonKey}

# --- RESPONSE 200 OK ---
[
  {
    "id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
    "email": "warrior@example.com",
    "username": "ShadowNinja",
    "avatar_id": "chynaman",
    "is_admin": false,
    "crystals_collected": 7,
    "matches_played": 14,
    "matches_won": 10,
    "registered_app": "sister_tournament_app",
    "last_active_app": "companion_hub"
  }
]`} />
            </div>
          </section>

          {/* =========================================================================
              ENDPOINT 4: SAVE MATCH RESULT & CRYSTALS
          ========================================================================= */}
          <section id="player-save" className="docs-endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1.5px solid rgba(255, 230, 0, 0.3)', borderRadius: '18px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {methodBadge('PATCH')}
              <code style={{ fontSize: '1.1rem', color: 'var(--neon-gold, #ffe600)', fontWeight: 'bold' }}>/rest/v1/profiles?id=eq.&#123;uuid&#125;</code>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255, 230, 0, 0.15)', border: '1px solid rgba(255, 230, 0, 0.3)', padding: '2px 8px', borderRadius: '4px', color: 'var(--neon-gold, #ffe600)' }}>Requires Player JWT</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' }}>Save Match Results & Update Stability Crystals</h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              Call this endpoint when a match ends in your sister mobile, tournament, or Unity arena. It updates the warrior's match record and increments crystals won. Protected by Row Level Security (players can only update their own record).
            </p>

            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <HighlightedJson code={`PATCH ${supabaseUrl}/rest/v1/profiles?id=eq.c7a8b9e0-1234-5678-90ab-cdef12345678
apikey: ${anonKey}
Authorization: Bearer USER_JWT_ACCESS_TOKEN
Content-Type: application/json

{
  "matches_played": 15,
  "matches_won": 11,
  "crystals_collected": 10,
  "last_active_app": "sister_unity_arena"
}`} />
            </div>
          </section>

          {/* =========================================================================
              ENDPOINT 5: RULES ENCYCLOPEDIA QUERY
          ========================================================================= */}
          <section id="rules-all" className="docs-endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {methodBadge('GET')}
              <code style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/rules_knowledge?is_active=eq.true</code>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>Public (Anon Key)</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' }}>Query Active Rules Encyclopedia</h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              Returns all active Attention TCG game rules (Combat, Setup, Zombie Mode, Energy Tokens, Saigo No Blitz, DP defense checks). Use this to render dynamic rulebook screens in your sister applications.
            </p>

            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <HighlightedJson code={`GET ${supabaseUrl}/rest/v1/rules_knowledge?is_active=eq.true&order=order_index.asc
apikey: ${anonKey}
Authorization: Bearer ${anonKey}

# --- RESPONSE 200 OK (Array of Rule Objects) ---
[
  {
    "id": "a901f4c2-...",
    "topic": "2-Stage Clash Roll & Defense Point (DP) Rule",
    "category": "Combat",
    "keywords": ["dice", "clash", "dp", "defense", "6"],
    "short_answer": "Attacker rolls 2 red dice, defender rolls 2 gold dice. Defender DP activates if gold dice sum to 6 or higher.",
    "details": "Combat Resolution Breakdown:\\n1. Clash: Attacker higher sum wins.\\n2. Multiplier: Roll 1 die for AP.\\n3. DP Armor: -10 or -15 AP if defender rolled 6+.",
    "order_index": 4,
    "is_active": true
  }
]`} />
            </div>
          </section>

          {/* =========================================================================
              ENDPOINT 6: CONTINUOUS LEARNING LOOP
          ========================================================================= */}
          <section id="questions-log" className="docs-endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {methodBadge('POST')}
              <code style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/user_questions</code>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>Public / Authenticated</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' }}>Log In-Game Question & Rating</h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              When a player asks an in-game question in your sister app, send it to this endpoint. If they click 👎 (Flag Inaccurate) and enter a correction, send a <code>PATCH /rest/v1/user_questions?id=eq.&#123;id&#125;</code>. It immediately appears in the Admin Portal inbox for 1-click promotion to the official rulebook!
            </p>

            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <HighlightedJson code={`POST ${supabaseUrl}/rest/v1/user_questions
apikey: ${anonKey}
Authorization: Bearer ${anonKey}
Content-Type: application/json

{
  "user_id": "c7a8b9e0-1234-5678-90ab-cdef12345678",
  "user_name": "ShadowNinja",
  "question_text": "How much AP damage does Saigo No Blitz inflict?",
  "ai_answer": "Saigo No Blitz unleashes an unstoppable 200 AP blast to all opponents and costs 5 Energy Tokens.",
  "app_source": "sister_tournament_client"
}`} />
            </div>
          </section>

          {/* =========================================================================
              SDK SECTION
          ========================================================================= */}
          <section id="sdk-section" style={{ background: 'rgba(14, 22, 42, 0.9)', border: '1.5px solid rgba(0, 240, 255, 0.3)', borderRadius: '20px', padding: '28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                  Complete Client SDK Samples
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>
                  Drop-in code snippets with authentication, data persistence, and rules fetching.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'js', label: 'JavaScript / React' },
                  { id: 'flutter', label: 'Flutter (Dart)' },
                  { id: 'swift', label: 'Swift (iOS)' },
                  { id: 'unity', label: 'Unity (C#)' },
                  { id: 'curl', label: 'cURL / Shell' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSdk(s.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: activeSdk === s.id ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.12)',
                      background: activeSdk === s.id ? 'rgba(0, 240, 255, 0.18)' : 'rgba(0,0,0,0.4)',
                      color: activeSdk === s.id ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#020510', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button
                  onClick={() => handleCopy(sdkCode[activeSdk], 'sdk_copy')}
                  style={{
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: '1px solid var(--neon-cyan, #00f0ff)',
                    color: 'var(--neon-cyan, #00f0ff)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedKey === 'sdk_copy' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === 'sdk_copy' ? 'COPIED TO CLIPBOARD!' : 'COPY SDK SNIPPET'}</span>
                </button>
              </div>

              <HighlightedJson code={sdkCode[activeSdk]} />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
