import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Terminal, Shield, Copy, Check, ExternalLink, Code2,
  Smartphone, Database, Key, Server, Cpu, BookOpen, Layers
} from 'lucide-react';

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeLang, setActiveLang] = useState('js');
  const [copiedKey, setCopiedKey] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyraulajgkonsukrtcvq.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const codeSnippets = {
    js: `// =========================================================================
// ATTENTION TCG ECOSYSTEM: SISTER APP INTEGRATION (JavaScript / React / Node)
// =========================================================================
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${supabaseUrl}',
  '${anonKey}'
);

// 1. Warrior Sign In
export async function authenticateWarrior(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

// 2. Fetch Player Stats & Crystals
export async function getPlayerStats(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, crystals_collected, matches_played, matches_won')
    .eq('id', userId)
    .single();
  return data;
}

// 3. Query Active Rules Knowledge (for AI or in-game rules lookup)
export async function fetchGameRules() {
  const { data, error } = await supabase
    .from('rules_knowledge')
    .select('topic, category, short_answer, details')
    .eq('is_active', true)
    .order('order_index');
  return data;
}

// 4. Log User Question & Rating
export async function logQuestionFeedback(question, aiAnswer, rating = 'helpful') {
  await supabase.from('user_questions').insert({
    question_text: question,
    ai_answer: aiAnswer,
    user_rating: rating,
    app_source: 'sister_web_app'
  });
}`,
    flutter: `// =========================================================================
// ATTENTION TCG ECOSYSTEM: FLUTTER / DART SISTER APP INTEGRATION
// pubspec.yaml: supabase_flutter: ^2.8.0
// =========================================================================
import 'package:supabase_flutter/supabase_flutter.dart';

class TcgSisterClient {
  static Future<void> init() async {
    await Supabase.initialize(
      url: '${supabaseUrl}',
      anonKey: '${anonKey}',
    );
  }

  static SupabaseClient get client => Supabase.instance.client;

  // Warrior Sign In
  static Future<User?> loginWarrior(String email, String password) async {
    final res = await client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
    return res.user;
  }

  // Fetch Player Stability Crystals & Record
  static Future<Map<String, dynamic>?> getPlayerRecord(String userId) async {
    final data = await client
        .from('profiles')
        .select('username, crystals_collected, matches_played, matches_won')
        .eq('id', userId)
        .maybeSingle();
    return data;
  }

  // Get Live Knowledge Base Rules
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
// ATTENTION TCG ECOSYSTEM: SWIFT / IOS SISTER APP INTEGRATION
// SPM: https://github.com/supabase/supabase-swift
// =========================================================================
import Foundation
import Supabase

class TcgEcosystemClient {
    static let shared = TcgEcosystemClient()
    let client: SupabaseClient

    private init() {
        self.client = SupabaseClient(
            supabaseURL: URL(string: "${supabaseUrl}")!,
            supabaseKey: "${anonKey}"
        )
    }

    // Warrior Sign In
    func signIn(email: String, pass: String) async throws -> User {
        let session = try await client.auth.signIn(email: email, password: pass)
        return session.user
    }

    // Fetch Active Game Rules
    func fetchRules() async throws -> [RuleItem] {
        return try await client
            .from("rules_knowledge")
            .select()
            .eq("is_active", value: true)
            .order("order_index")
            .execute()
            .value
    }
}`,
    unity: `// =========================================================================
// ATTENTION TCG ECOSYSTEM: UNITY (C#) SISTER APP INTEGRATION
// =========================================================================
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class AttentionTcgClient : MonoBehaviour
{
    private const string BaseUrl = "${supabaseUrl}/rest/v1";
    private const string AnonKey = "${anonKey}";

    public IEnumerator FetchActiveRules(System.Action<string> onComplete)
    {
        string endpoint = BaseUrl + "/rules_knowledge?is_active=eq.true&order=order_index.asc";
        using (UnityWebRequest req = UnityWebRequest.Get(endpoint))
        {
            req.SetRequestHeader("apikey", AnonKey);
            req.SetRequestHeader("Authorization", "Bearer " + AnonKey);
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                onComplete?.Invoke(req.downloadHandler.text);
            }
            else
            {
                Debug.LogError("Attention TCG Rules fetch failed: " + req.error);
            }
        }
    }
}`,
    curl: `# =========================================================================
# ATTENTION TCG ECOSYSTEM: RAW HTTP / REST / cURL EXAMPLES
# =========================================================================

# 1. WARRIOR LOGIN (Get JWT Auth Token)
curl -X POST '${supabaseUrl}/auth/v1/token?grant_type=password' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "warrior@example.com",
    "password": "Password123!"
  }'

# 2. FETCH ACTIVE KNOWLEDGE BASE RULES
curl -X GET '${supabaseUrl}/rest/v1/rules_knowledge?is_active=eq.true&order=order_index.asc' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# 3. GET PLAYER STATS & STABILITY CRYSTALS
curl -X GET '${supabaseUrl}/rest/v1/profiles?id=eq.YOUR_USER_UUID' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}'

# 4. SUBMIT A USER QUESTION & RATING (Feedback Loop)
curl -X POST '${supabaseUrl}/rest/v1/user_questions' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Authorization: Bearer ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "question_text": "How many cards do I start with?",
    "ai_answer": "Each player starts with 10 Action Cards and 10 Character Cards.",
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
        paddingBottom: '60px'
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
              ATTENTION TCG <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>DEVELOPER API & DOCS</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Central Shared Backend for Companion, Tournament & Sister Mobile Apps
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

      {/* Content Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', position: 'relative', zIndex: 1 }}>

        {/* Hero Section */}
        <div
          style={{
            background: 'rgba(14, 22, 42, 0.85)',
            border: '1.5px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '18px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 0 35px rgba(0, 240, 255, 0.08)',
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
              <span style={{ fontSize: '0.9rem', color: '#39ff14', fontWeight: 'bold', letterSpacing: '2px' }}>ECOSYSTEM API ONLINE</span>
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: '900', letterSpacing: '1.5px', color: '#fff' }}>
              Sister Applications & Shared API
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', maxWidth: '750px', fontSize: '1rem', fontFamily: 'var(--font-sub, "Outfit", sans-serif)', lineHeight: '1.6' }}>
              The Attention TCG Companion backend powers our unified player identity, shared Stability Crystals balance, live Knowledge Base rules, and AI question continuous learning across all web, mobile, and Unity game clients.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(5, 10, 24, 0.7)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ color: 'var(--neon-cyan, #00f0ff)', fontSize: '1.4rem', fontWeight: '900' }}>Postgres + RLS</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '1px' }}>SECURITY LAYER</div>
            </div>
            <div style={{ background: 'rgba(5, 10, 24, 0.7)', border: '1px solid rgba(255, 230, 0, 0.2)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '1.4rem', fontWeight: '900' }}>Realtime</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '1px' }}>KNOWLEDGE SYNC</div>
            </div>
          </div>
        </div>

        {/* Credentials / Config Box */}
        <div
          style={{
            background: 'rgba(14, 22, 42, 0.75)',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', fontSize: '1.1rem' }}>
            <Key size={18} /> API CREDENTIALS & HOST CONFIGURATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(5, 10, 24, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', letterSpacing: '1px' }}>BASE REST / AUTH URL</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{supabaseUrl}</code>
                <button
                  onClick={() => handleCopy(supabaseUrl, 'url')}
                  style={{ background: 'none', border: 'none', color: copiedKey === 'url' ? '#39ff14' : 'var(--neon-cyan, #00f0ff)', cursor: 'pointer', padding: '4px' }}
                  title="Copy URL"
                >
                  {copiedKey === 'url' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(5, 10, 24, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', letterSpacing: '1px' }}>ANON PUBLIC CLIENT KEY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {anonKey.substring(0, 32)}...
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

        {/* REST API Endpoints Table */}
        <div
          style={{
            background: 'rgba(14, 22, 42, 0.85)',
            border: '1.5px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '18px',
            padding: '24px',
            marginBottom: '36px'
          }}
        >
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={20} color="var(--neon-cyan, #00f0ff)" /> Core Ecosystem Endpoints
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(0, 240, 255, 0.3)', color: 'var(--neon-cyan, #00f0ff)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', width: '100px' }}>METHOD</th>
                  <th style={{ padding: '12px', width: '320px' }}>ENDPOINT</th>
                  <th style={{ padding: '12px' }}>PURPOSE</th>
                  <th style={{ padding: '12px', width: '140px' }}>ACCESS</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px' }}><span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>POST</span></td>
                  <td style={{ padding: '12px' }}><code>/auth/v1/signup</code></td>
                  <td style={{ padding: '12px' }}>Register a warrior account from any sister app</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>Public Anon</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px' }}><span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>POST</span></td>
                  <td style={{ padding: '12px' }}><code>/auth/v1/token?grant_type=password</code></td>
                  <td style={{ padding: '12px' }}>Sign in warrior & return JWT Auth Token</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>Public Anon</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px' }}><span style={{ background: 'rgba(0, 240, 255, 0.15)', color: 'var(--neon-cyan, #00f0ff)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>GET</span></td>
                  <td style={{ padding: '12px' }}><code>/rest/v1/profiles?id=eq.&#123;uuid&#125;</code></td>
                  <td style={{ padding: '12px' }}>Retrieve player record, crystals, and wins</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>Public / Authenticated</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px' }}><span style={{ background: 'rgba(255, 230, 0, 0.15)', color: 'var(--neon-gold, #ffe600)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>PATCH</span></td>
                  <td style={{ padding: '12px' }}><code>/rest/v1/profiles?id=eq.&#123;uuid&#125;</code></td>
                  <td style={{ padding: '12px' }}>Update match stats & crystals collected</td>
                  <td style={{ padding: '12px', color: 'var(--neon-gold, #ffe600)' }}>Owner JWT</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px' }}><span style={{ background: 'rgba(0, 240, 255, 0.15)', color: 'var(--neon-cyan, #00f0ff)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>GET</span></td>
                  <td style={{ padding: '12px' }}><code>/rest/v1/rules_knowledge?is_active=eq.true</code></td>
                  <td style={{ padding: '12px' }}>Query dynamic rules database for cards & mechanics</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>Public Anon</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px' }}><span style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>POST</span></td>
                  <td style={{ padding: '12px' }}><code>/rest/v1/user_questions</code></td>
                  <td style={{ padding: '12px' }}>Log user question & rating into continuous learning pipeline</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>Public / Authenticated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Snippets Section */}
        <div
          style={{
            background: 'rgba(14, 22, 42, 0.85)',
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
                { id: 'js', label: 'JavaScript / React' },
                { id: 'flutter', label: 'Flutter / Dart' },
                { id: 'swift', label: 'iOS / Swift' },
                { id: 'unity', label: 'Unity / C#' },
                { id: 'curl', label: 'cURL / REST' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLang(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: activeLang === tab.id ? '1.5px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                    background: activeLang === tab.id ? 'rgba(0, 240, 255, 0.18)' : 'rgba(0,0,0,0.3)',
                    color: activeLang === tab.id ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.7)',
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
              onClick={() => handleCopy(codeSnippets[activeLang], 'code')}
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
              {copiedKey === 'code' ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedKey === 'code' ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}</span>
            </button>
          </div>

          {/* Code Block Display */}
          <div style={{ padding: '20px', background: '#030610', overflowX: 'auto' }}>
            <pre
              style={{
                margin: 0,
                color: '#e2e8f0',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.88rem',
                lineHeight: '1.6'
              }}
            >
              {codeSnippets[activeLang]}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
