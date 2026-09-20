import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Copy, Check, Server, Key, Terminal, Code2,
  Database, UserCheck, Sparkles, Flame, BookOpen, Layers, RefreshCw,
  Send, Trophy, Lock, HelpCircle, ChevronRight, Search, ExternalLink,
  Info, AlertTriangle, CheckCircle2, FileText, Cpu, Smartphone, Globe,
  FileCode, Play, Award, Zap
} from 'lucide-react';

export default function DocsPage() {
  const navigate = useNavigate();
  // Dedicated page switching: 'overview' | 'auth' | 'player' | 'rules' | 'questions' | 'sdks'
  const [activePage, setActivePage] = useState('overview');
  const [activeSdk, setActiveSdk] = useState('js');
  const [copiedKey, setCopiedKey] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

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
        <p>The Attention TCG Developer Docs are optimized for landscape mode.</p>
      </div>
    </div>
  );

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyraulajgkonsukrtcvq.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  // Syntax highlighting / Code Block
  const CodeBlock = ({ code, label, copyId }) => (
    <div style={{ background: '#020510', border: '1px solid rgba(255, 255, 255, 0.09)', borderRadius: '10px', padding: '14px', position: 'relative', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--neon-cyan, #00f0ff)', letterSpacing: '1px', fontWeight: 'bold', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
          {label || 'HTTP / JSON PAYLOAD'}
        </span>
        {copyId && (
          <button
            onClick={() => handleCopy(code, copyId)}
            style={{
              background: 'none',
              border: 'none',
              color: copiedKey === copyId ? '#39ff14' : 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
            }}
          >
            {copiedKey === copyId ? <Check size={13} /> : <Copy size={13} />}
            {copiedKey === copyId ? 'COPIED' : 'COPY'}
          </button>
        )}
      </div>
      <pre
        style={{
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.84rem',
          lineHeight: '1.6',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '340px',
          overflowY: 'auto'
        }}
      >
        {code}
      </pre>
    </div>
  );

  // Minimal Table Component
  const ParamTable = ({ headers = ['PARAMETER', 'TYPE', 'REQUIRED', 'DESCRIPTION'], rows = [] }) => (
    <div style={{ background: 'rgba(5, 10, 24, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', margin: '12px 0 16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
        <thead>
          <tr style={{ background: 'rgba(10, 20, 45, 0.8)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', textAlign: 'left', color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', fontSize: '0.78rem', letterSpacing: '1px' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '10px 14px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} style={{ borderBottom: rIdx < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <td style={{ padding: '9px 14px', color: '#fff' }}><code>{row[0]}</code></td>
              <td style={{ padding: '9px 14px', color: '#39ff14', fontSize: '0.8rem' }}>{row[1]}</td>
              <td style={{ padding: '9px 14px', color: row[2] === 'Required' ? 'var(--neon-crimson, #ff3366)' : 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: row[2] === 'Required' ? 'bold' : 'normal' }}>
                {row[2]}
              </td>
              <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '0.84rem' }}>{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const methodBadge = (method) => {
    switch (method) {
      case 'GET':
        return <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: 'var(--neon-cyan, #00f0ff)', border: '1px solid rgba(0, 240, 255, 0.4)', padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold' }}>GET</span>;
      case 'POST':
        return <span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', border: '1px solid rgba(57, 255, 20, 0.4)', padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold' }}>POST</span>;
      case 'PATCH':
        return <span style={{ background: 'rgba(255, 230, 0, 0.15)', color: 'var(--neon-gold, #ffe600)', border: '1px solid rgba(255, 230, 0, 0.4)', padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 'bold' }}>PATCH</span>;
      default:
        return null;
    }
  };

  // Dedicated Pages Configuration for the Left Sidebar
  const docPages = [
    {
      id: 'overview',
      title: 'Architecture & Security',
      subtitle: 'Shared ecosystem, base host & RLS auth',
      icon: Shield,
      badge: 'Core'
    },
    {
      id: 'auth',
      title: 'Warrior Identity & Auth',
      subtitle: 'Registration, tokens, password recovery',
      icon: UserCheck,
      badge: '4 Endpoints'
    },
    {
      id: 'player',
      title: 'Player Stats & Match Save',
      subtitle: 'Profiles, crystals & global hall of fame',
      icon: Trophy,
      badge: '3 Endpoints'
    },
    {
      id: 'rules',
      title: 'Rules Knowledge Engine',
      subtitle: 'Live rules queries & keyword search',
      icon: BookOpen,
      badge: '2 Endpoints'
    },
    {
      id: 'questions',
      title: 'AI Chat & Feedback Loop',
      subtitle: 'Log player queries & feedback submissions',
      icon: HelpCircle,
      badge: '2 Endpoints'
    },
    {
      id: 'sdks',
      title: 'Client SDK Libraries',
      subtitle: 'JS, Unity C#, iOS Swift, Flutter, cURL',
      icon: Code2,
      badge: '5 SDKs'
    }
  ];

  // All endpoints for global search
  const allEndpoints = [
    { page: 'overview', label: 'Architecture & Synchronized Universe', route: 'Architecture', method: 'DOC' },
    { page: 'overview', label: 'Host Config & Base URL', route: supabaseUrl, method: 'CONFIG' },
    { page: 'overview', label: 'HTTP Headers & RLS Security', route: 'Authorization: Bearer', method: 'RLS' },
    { page: 'auth', label: 'Register Warrior Account', route: '/auth/v1/signup', method: 'POST' },
    { page: 'auth', label: 'Warrior Password Login', route: '/auth/v1/token?grant_type=password', method: 'POST' },
    { page: 'auth', label: 'Refresh Session Token', route: '/auth/v1/token?grant_type=refresh_token', method: 'POST' },
    { page: 'auth', label: 'Password Recovery Link', route: '/auth/v1/recover', method: 'POST' },
    { page: 'player', label: 'Get Warrior Profile & Stats', route: '/rest/v1/profiles?id=eq.{uuid}', method: 'GET' },
    { page: 'player', label: 'Save Match Victory & Award Crystals', route: '/rest/v1/profiles?id=eq.{uuid}', method: 'PATCH' },
    { page: 'player', label: 'Global Hall of Fame Leaderboard', route: '/rest/v1/profiles?order=crystals_collected.desc', method: 'GET' },
    { page: 'rules', label: 'Query Active Game Rules', route: '/rest/v1/rules_knowledge?is_active=eq.true', method: 'GET' },
    { page: 'rules', label: 'Filter Rules by Category & Keyword', route: '/rest/v1/rules_knowledge?category=eq.{name}', method: 'GET' },
    { page: 'questions', label: 'Log TCG App Query to Inbox', route: '/rest/v1/user_questions', method: 'POST' },
    { page: 'questions', label: 'Submit Rating & Suggested Correction', route: '/rest/v1/user_questions?id=eq.{id}', method: 'PATCH' },
    { page: 'sdks', label: 'JavaScript / TypeScript SDK', route: 'npm install @supabase/supabase-js', method: 'SDK' },
    { page: 'sdks', label: 'Unity (C#) Client Script', route: 'AttentionTcgClient.cs', method: 'SDK' },
    { page: 'sdks', label: 'iOS / Swift Package', route: 'AttentionTcgEcosystem.swift', method: 'SDK' },
    { page: 'sdks', label: 'Flutter / Dart Service', route: 'TcgEcosystemService.dart', method: 'SDK' },
    { page: 'sdks', label: 'cURL & Raw HTTP Specification', route: 'Terminal Shell', method: 'CURL' }
  ];

  const searchResults = searchFilter.trim()
    ? allEndpoints.filter(e => e.label.toLowerCase().includes(searchFilter.toLowerCase()) || e.route.toLowerCase().includes(searchFilter.toLowerCase()))
    : [];

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
export async function registerWarrior(email, password, username, appSource = 'tcg_web') {
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
export async function recordMatchVictory(userId, wonMatch, crystalsWon = 1, appSource = 'tcg_web') {
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

    unity: `// =========================================================================
// ATTENTION TCG: COMPLETE UNITY (C#) TCG CLIENT INTEGRATION
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
      'last_active_app': 'tcg_flutter_app',
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
    "data": { "username": "CyberDragon", "registered_app": "tcg_tournament" }
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
    "last_active_app": "tcg_unity_arena"
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
    "app_source": "tcg_tournament_client"
  }'`
  };

  return (
    <>
      <LandscapeOverlay />
      <div className="webgl-canvas-frame landscape-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'radial-gradient(circle at 50% 20%, #111a36 0%, #080d1e 60%, #040710 100%)',
            color: '#f8fafc',
            fontFamily: 'var(--font-sub, "Outfit", sans-serif)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Background diagonal neon streaks & particle glow matching Score Calculator */}
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
            .sidebar-page-btn {
              transition: all 0.2s ease;
            }
            .sidebar-page-btn:hover {
              background: rgba(0, 240, 255, 0.1) !important;
              color: var(--neon-cyan, #00f0ff) !important;
            }
            .endpoint-card {
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }
            .endpoint-card:hover {
              border-color: rgba(0, 240, 255, 0.38) !important;
              box-shadow: 0 4px 20px rgba(0, 240, 255, 0.08);
            }
          `}</style>

          {/* TOP HEADER - CLEAN & NON-REDUNDANT */}
          <header
            style={{
              height: '56px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 24px',
              background: 'rgba(10, 20, 45, 0.92)',
              borderBottom: '1.5px solid rgba(0, 240, 255, 0.28)',
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
                DEVELOPER PORTAL <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontSize: '0.85rem', fontWeight: 'normal', letterSpacing: '1px' }}>// TCG APIS</span>
              </div>
            </div>

            {/* Top Right: Only utility copy URL button (NO REDUNDANT COMMAND DECK BUTTON) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => handleCopy(supabaseUrl, 'header_url')}
                style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: 'var(--neon-cyan, #00f0ff)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copiedKey === 'header_url' ? <Check size={13} color="#39ff14" /> : <Copy size={13} />}
                <span>COPY REST URL</span>
              </button>
            </div>
          </header>

          {/* BODY: SIDEBAR + DEDICATED PAGES VIEWPORT */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>

            {/* DEDICATED LEFT SIDEBAR */}
            <aside
              style={{
                width: '260px',
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
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder="Search all endpoints..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
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

                {/* Search results or modules list */}
                {searchFilter.trim() ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '420px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', padding: '0 4px 6px 4px', letterSpacing: '1px' }}>
                      SEARCH RESULTS ({searchResults.length})
                    </div>
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '12px 8px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                        No matching endpoints found.
                      </div>
                    ) : (
                      searchResults.map((sr, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActivePage(sr.page);
                            setSearchFilter('');
                          }}
                          style={{
                            background: 'rgba(14, 22, 42, 0.8)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)' }}>{sr.label}</span>
                            <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>{sr.method}</span>
                          </div>
                          <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sr.route}</code>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.72rem', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', padding: '0 8px 10px 8px', textTransform: 'uppercase' }}>
                      TCG API MODULES
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {docPages.map((page) => {
                        const Icon = page.icon;
                        const isSel = activePage === page.id;
                        return (
                          <button
                            key={page.id}
                            className="sidebar-page-btn"
                            onClick={() => setActivePage(page.id)}
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
                              textAlign: 'left',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Icon size={16} />
                              <div>
                                <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '0.5px' }}>
                                  {page.title}
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                background: isSel ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255, 255, 255, 0.1)',
                                color: isSel ? '#050a18' : 'rgba(255, 255, 255, 0.6)',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {page.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer: Quick Connection Status */}
              <div style={{ background: 'rgba(5, 10, 24, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 8px #39ff14' }}></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#39ff14' }}>TCG REST GATEWAY READY</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                  Supabase v2.8+ · JWT Bearer Verification
                </div>
              </div>
            </aside>

            {/* MAIN WORKSPACE: RENDERS DEDICATED CLEAN PAGE */}
            <main
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 32px 60px 32px',
                boxSizing: 'border-box'
              }}
            >

              {/* =========================================================================
                  PAGE 1: ARCHITECTURE & OVERVIEW
              ========================================================================= */}
              {activePage === 'overview' && (
                <div>
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#39ff14', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        SYSTEM ARCHITECTURE & SECURITY
                      </span>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      ATTENTION TCG APIS SPECIFICATION
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: '850px', lineHeight: '1.5' }}>
                      Attention TCG powers a unified universe. Players register from any TCG app (Unity 3D tabletop, Flutter tournament companion, or Kontrola Arena) and retain their single callsign, shared Stability Crystals, and access to the dynamic Game Rules database.
                    </p>
                  </div>

                  {/* Top Minimal KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px' }}>
                        <Zap size={16} /> Single Warrior Identity
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.5' }}>
                        Sign up once; your callsign, match statistics, and crystal balance automatically sync across every client.
                      </div>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(255, 230, 0, 0.25)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-gold, #ffe600)', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px' }}>
                        <BookOpen size={16} /> Live Rules Engine
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.5' }}>
                        Game Masters update rules in the Command Deck; TCG apps query live endpoints with zero client rebuilds.
                      </div>
                    </div>

                    <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(57, 255, 20, 0.25)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#39ff14', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px' }}>
                        <HelpCircle size={16} /> Continuous Learning Loop
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.5' }}>
                        In-game player inquiries feed directly into the central inbox for GM review and 1-click rule promotion.
                      </div>
                    </div>
                  </div>

                  {/* Project Host & Keys Minimal Cards */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      PROJECT HOST & ENVIRONMENT CONFIGURATION
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>BASE REST / AUTH GATEWAY</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ color: '#fff', fontSize: '0.88rem' }}>{supabaseUrl}</code>
                          <button onClick={() => handleCopy(supabaseUrl, 'cfg_url')} style={{ background: 'none', border: 'none', color: copiedKey === 'cfg_url' ? '#39ff14' : 'var(--neon-cyan, #00f0ff)', cursor: 'pointer' }}>
                            {copiedKey === 'cfg_url' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>ANON CLIENT PUBLIC KEY</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.84rem' }}>{anonKey.substring(0, 34)}...</code>
                          <button onClick={() => handleCopy(anonKey, 'cfg_key')} style={{ background: 'none', border: 'none', color: copiedKey === 'cfg_key' ? '#39ff14' : 'var(--neon-gold, #ffe600)', cursor: 'pointer' }}>
                            {copiedKey === 'cfg_key' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Headers & RLS Minimal Table */}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      MANDATORY HTTP HEADERS & ROW LEVEL SECURITY (RLS)
                    </div>
                    <ParamTable
                      headers={['HEADER', 'EXPECTED VALUE', 'REQUIRED FOR', 'SECURITY CONTEXT']}
                      rows={[
                        ['apikey', 'ANON_PUBLIC_KEY', 'All Requests', 'Routes through Supabase API gateway safely from any client.'],
                        ['Authorization', 'Bearer <USER_JWT_TOKEN>', 'Authenticated Writes', 'Used by Postgres RLS to verify the user only edits their own profile/crystals.'],
                        ['Content-Type', 'application/json', 'POST / PATCH', 'Required for sending JSON request bodies.']
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 2: WARRIOR IDENTITY & AUTH
              ========================================================================= */}
              {activePage === 'auth' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      WARRIOR IDENTITY & AUTHENTICATION API
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      Endpoints for registering warrior accounts, authenticating duels, managing sessions, and recovering credentials.
                    </p>
                  </div>

                  {/* 1. Register Warrior */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('POST')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/auth/v1/signup</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Register New Warrior Account</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                      Creates the warrior identity and triggers Postgres row generation in <code>profiles</code> with verified callsign, 0 crystals, and default stats.
                    </p>

                    <ParamTable
                      rows={[
                        ['email', 'string', 'Required', 'Valid email address for warrior identity.'],
                        ['password', 'string', 'Required', 'Account password (minimum 6 characters).'],
                        ['data.username', 'string', 'Required', 'Unique warrior callsign (case-insensitive enforced in database).'],
                        ['data.registered_app', 'string', 'Optional', 'Name of the TCG client (e.g. "tcg_unity_arena").']
                      ]}
                    />

                    <CodeBlock
                      label="POST /auth/v1/signup"
                      copyId="auth_signup_curl"
                      code={`POST ${supabaseUrl}/auth/v1/signup
apikey: ${anonKey}
Content-Type: application/json

{
  "email": "warrior@example.com",
  "password": "Password123!",
  "data": {
    "username": "ShadowNinja",
    "registered_app": "tcg_tournament_client"
  }
}`}
                    />
                  </div>

                  {/* 2. Warrior Login */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('POST')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/auth/v1/token?grant_type=password</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Warrior Login (Fetch Session JWT)</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                      Authenticates credentials and returns the warrior's JWT <code>access_token</code> required for saving match outcomes.
                    </p>

                    <ParamTable
                      rows={[
                        ['email', 'string', 'Required', 'Registered warrior email.'],
                        ['password', 'string', 'Required', 'Warrior account password.']
                      ]}
                    />

                    <CodeBlock
                      label="RESPONSE (200 OK)"
                      copyId="auth_login_resp"
                      code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "u4Q...",
  "user": {
    "id": "782fc912-3490-48e2-...",
    "email": "warrior@example.com",
    "user_metadata": { "username": "ShadowNinja" }
  }
}`}
                    />
                  </div>

                  {/* 3. Session Refresh & Recovery */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                    <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        {methodBadge('POST')}
                        <code style={{ fontSize: '0.88rem', color: '#fff' }}>/auth/v1/token?grant_type=refresh_token</code>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Refresh Access Token</div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 10px 0' }}>
                        Pass <code>refresh_token</code> to obtain a fresh 1-hour access token without prompting player for password.
                      </p>
                    </div>

                    <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        {methodBadge('POST')}
                        <code style={{ fontSize: '0.88rem', color: '#fff' }}>/auth/v1/recover</code>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Password Recovery Email</div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 10px 0' }}>
                        Pass <code>email</code> to send a secure password reset link to the warrior.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 3: PLAYER STATS & MATCH SAVE
              ========================================================================= */}
              {activePage === 'player' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      PLAYER DATA & MATCH OUTCOME API
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      Sync Stability Crystals, log match outcomes from TCG tabletop arenas, and query global rankings.
                    </p>
                  </div>

                  {/* 1. Get Player Profile */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('GET')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/profiles?id=eq.YOUR_USER_UUID</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Anon or User Bearer</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Fetch Warrior Profile & Stability Crystals</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                      Returns the current warrior record containing callsign, crystals balance, total duels, and account status.
                    </p>

                    <CodeBlock
                      label="RESPONSE (200 OK)"
                      copyId="profile_get_resp"
                      code={`[
  {
    "id": "782fc912-3490-48e2-...",
    "username": "ShadowNinja",
    "crystals_collected": 12,
    "matches_played": 15,
    "matches_won": 11,
    "avatar_id": "chynaman",
    "is_banned": false,
    "last_active_app": "tcg_unity_arena"
  }
]`}
                    />
                  </div>

                  {/* 2. Save Match Outcome */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(255, 230, 0, 0.25)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('PATCH')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/profiles?id=eq.YOUR_USER_UUID</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255, 230, 0, 0.15)', color: 'var(--neon-gold, #ffe600)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Requires User JWT Bearer
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Update Stats & Award Stability Crystals</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                      Called by TCG apps upon match conclusion. Enforced by Postgres RLS so players can only update their own record.
                    </p>

                    <ParamTable
                      rows={[
                        ['crystals_collected', 'integer', 'Optional', 'New total crystal balance after duel award.'],
                        ['matches_played', 'integer', 'Optional', 'Incremented match count.'],
                        ['matches_won', 'integer', 'Optional', 'Incremented victory count if player won.'],
                        ['last_active_app', 'string', 'Optional', 'TCG app identifier (e.g. "tcg_unity_arena").']
                      ]}
                    />

                    <CodeBlock
                      label="PATCH /rest/v1/profiles?id=eq.YOUR_USER_UUID"
                      copyId="profile_patch_curl"
                      code={`PATCH ${supabaseUrl}/rest/v1/profiles?id=eq.YOUR_USER_UUID
apikey: ${anonKey}
Authorization: Bearer YOUR_WARRIOR_JWT_TOKEN
Content-Type: application/json

{
  "crystals_collected": 13,
  "matches_played": 16,
  "matches_won": 12,
  "last_active_app": "tcg_unity_arena"
}`}
                    />
                  </div>

                  {/* 3. Leaderboard */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('GET')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/profiles?order=crystals_collected.desc&limit=10</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Global Hall of Fame Leaderboard</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                      Queries the top 10 warriors across the Attention TCG ecosystem ranked by Stability Crystals collected.
                    </p>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 4: RULES KNOWLEDGE ENGINE
              ========================================================================= */}
              {activePage === 'rules' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      RULES KNOWLEDGE ENGINE API
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      The live rules database queried by the AI Rulekeeper and all Attention TCG companion applications.
                    </p>
                  </div>

                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('GET')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/rules_knowledge?is_active=eq.true&order=order_index.asc</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Fetch Active Rules Knowledge Base</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                      Returns all active, approved game rules sorted by display priority for offline caching or in-game rule popups.
                    </p>

                    <CodeBlock
                      label="RESPONSE (200 OK)"
                      copyId="rules_get_resp"
                      code={`[
  {
    "id": "rule-1",
    "topic": "Official Attention TCG Rules & Overview",
    "category": "Setup",
    "keywords": ["rules", "core rules", "overview", "setup"],
    "short_answer": "In Attention TCG, players roll 2 dice for turn order, start with 5 Energy Tokens...",
    "details": "1. Game Objective: Defeat opponents to claim their Stability Crystals...",
    "order_index": 1,
    "is_active": true
  }
]`}
                    />
                  </div>

                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('GET')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/rules_knowledge?category=eq.Combat&topic=ilike.*dice*</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Filter Rules by Category & Keyword</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                      Supports Postgres Full-Text and ILIKE filters for instant contextual search inside TCG client search bars.
                    </p>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 5: AI CHAT & FEEDBACK LOOP
              ========================================================================= */}
              {activePage === 'questions' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                      AI CHAT & CONTINUOUS LEARNING LOOP
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      Log in-game questions from players and submit feedback so Game Masters can review answers and promote them into official rules.
                    </p>
                  </div>

                  {/* 1. Log In-Game Question */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('POST')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/user_questions</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Log In-Game Player Query</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                      Stores the player's query and the AI assistant's generated response in the Command Deck inbox.
                    </p>

                    <ParamTable
                      rows={[
                        ['question_text', 'string', 'Required', 'The raw question asked by the combatant.'],
                        ['ai_answer', 'string', 'Optional', 'The answer provided by the in-game chatbot.'],
                        ['app_source', 'string', 'Optional', 'Client identifier (e.g. "tcg_tournament_client").']
                      ]}
                    />

                    <CodeBlock
                      label="POST /rest/v1/user_questions"
                      copyId="questions_post_curl"
                      code={`POST ${supabaseUrl}/rest/v1/user_questions
apikey: ${anonKey}
Content-Type: application/json

{
  "question_text": "Can I counter a Special Attack with a Barrier?",
  "ai_answer": "Yes, Barrier counters all physical and special strikes unless specified Unblockable.",
  "app_source": "tcg_tournament_client"
}`}
                    />
                  </div>

                  {/* 2. Submit Rating & Correction */}
                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {methodBadge('PATCH')}
                        <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>/rest/v1/user_questions?id=eq.QUESTION_UUID</code>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '4px' }}>Public (Anon Key)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Submit Rating & Player Suggested Answer</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                      Allows players to thumbs-down inaccurate answers and propose corrections for admin review.
                    </p>

                    <ParamTable
                      rows={[
                        ['is_helpful', 'boolean', 'Optional', 'True for thumbs-up, false for thumbs-down.'],
                        ['user_suggested_answer', 'string', 'Optional', 'Warrior-submitted clarification or rulebook correction.']
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PAGE 6: CLIENT SDK LIBRARIES
              ========================================================================= */}
              {activePage === 'sdks' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                        TCG APP CLIENT SDKs
                      </h1>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                        Production-ready integration modules in JavaScript, Unity C#, iOS Swift, Flutter Dart, and cURL.
                      </p>
                    </div>

                    {/* SDK Language Switcher Tabs */}
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(5, 10, 24, 0.85)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                      {[
                        { id: 'js', label: 'JavaScript' },
                        { id: 'unity', label: 'Unity (C#)' },
                        { id: 'swift', label: 'Swift (iOS)' },
                        { id: 'flutter', label: 'Flutter' },
                        { id: 'curl', label: 'cURL / HTTP' }
                      ].map((sdk) => (
                        <button
                          key={sdk.id}
                          onClick={() => setActiveSdk(sdk.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: activeSdk === sdk.id ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid transparent',
                            background: activeSdk === sdk.id ? 'rgba(0, 240, 255, 0.18)' : 'transparent',
                            color: activeSdk === sdk.id ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255, 255, 255, 0.65)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
                          }}
                        >
                          {sdk.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="endpoint-card" style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileCode size={18} color="var(--neon-cyan, #00f0ff)" />
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '0.5px' }}>
                          {activeSdk === 'js' && 'JavaScript / TypeScript (@supabase/supabase-js)'}
                          {activeSdk === 'unity' && 'Unity C# (UnityEngine.Networking)'}
                          {activeSdk === 'swift' && 'Swift iOS (Supabase-Swift SPM)'}
                          {activeSdk === 'flutter' && 'Flutter Dart (supabase_flutter)'}
                          {activeSdk === 'curl' && 'cURL & Raw HTTP Specification'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(sdkCode[activeSdk], `sdk_${activeSdk}`)}
                        style={{
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: '1px solid rgba(0, 240, 255, 0.35)',
                          color: 'var(--neon-cyan, #00f0ff)',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {copiedKey === `sdk_${activeSdk}` ? <Check size={13} color="#39ff14" /> : <Copy size={13} />}
                        <span>{copiedKey === `sdk_${activeSdk}` ? 'COPIED TO CLIPBOARD' : 'COPY SDK CODE'}</span>
                      </button>
                    </div>

                    <CodeBlock
                      label="COMPLETE CLIENT IMPLEMENTATION"
                      code={sdkCode[activeSdk]}
                    />
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
