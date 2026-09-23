import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Copy, Check, UserCheck, Code2,
  Trophy, BookOpen, HelpCircle, ChevronRight, Search, 
  Zap, FileCode
} from 'lucide-react';

export default function DocsPage() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('overview');
  const [activeSdk, setActiveSdk] = useState('js');
  const [copiedKey, setCopiedKey] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

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

  const apiUrl = 'https://muhammadhammad-47.github.io/TCG_Companion-Proj/api';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const CodeBlock = ({ code, label, copyId }) => (
    <div style={{ background: '#020510', border: '1px solid rgba(255, 255, 255, 0.09)', borderRadius: '10px', padding: '14px', position: 'relative', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--neon-cyan, #00f0ff)', letterSpacing: '1px', fontWeight: 'bold', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
          {label || 'HTTP / JSON PAYLOAD'}
        </span>
        {copyId && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(code, copyId); }}
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

  const getMethodColor = (method, alpha = 1) => {
    switch (method) {
      case 'GET': return `rgba(0, 240, 255, ${alpha})`;
      case 'POST': return `rgba(57, 255, 20, ${alpha})`;
      case 'PATCH': return `rgba(255, 230, 0, ${alpha})`;
      case 'DELETE': return `rgba(255, 51, 102, ${alpha})`;
      default: return `rgba(255, 255, 255, ${alpha})`;
    }
  };

  const EndpointAccordion = ({ method, path, title, description, parameters, bodyCode, responseCode, copyId }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ marginBottom: '16px', borderRadius: '8px', border: '1px solid ' + getMethodColor(method, 0.3), overflow: 'hidden', background: isOpen ? 'rgba(10, 16, 30, 0.95)' : 'rgba(14, 22, 42, 0.7)', transition: 'all 0.3s ease' }}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: getMethodColor(method, 0.1) }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ 
              background: getMethodColor(method, 0.15), 
              color: getMethodColor(method, 1), 
              border: '1px solid ' + getMethodColor(method, 0.4),
              fontWeight: '900', 
              padding: '4px 12px', 
              borderRadius: '6px', 
              fontSize: '0.8rem',
              minWidth: '60px',
              textAlign: 'center',
              boxShadow: `0 0 10px ${getMethodColor(method, 0.15)}`
            }}>
              {method}
            </span>
            <code style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>{path}</code>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginLeft: '8px' }}>{title}</span>
          </div>
          <div>
             <ChevronRight size={18} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>
        
        {isOpen && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>{description}</p>
            {parameters && parameters.length > 0 && (
               <>
                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Parameters</div>
                 <ParamTable rows={parameters} />
               </>
            )}
            {bodyCode && (
               <>
                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px', marginTop: '16px' }}>Request Body</div>
                 <CodeBlock label="JSON" code={bodyCode} copyId={copyId + '_req'} />
               </>
            )}
            {responseCode && (
               <>
                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px', marginTop: '16px' }}>Responses</div>
                 <div style={{ borderLeft: '3px solid #39ff14', paddingLeft: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#39ff14' }}>200 OK</span>
                 </div>
                 <CodeBlock label="JSON" code={responseCode} copyId={copyId + '_resp'} />
               </>
            )}
          </div>
        )}
      </div>
    );
  };

  const docPages = [
    { id: 'overview', title: 'Architecture & Security', icon: Shield, badge: 'Core' },
    { id: 'auth', title: 'Player Identity & Auth', icon: UserCheck, badge: '4 Endpoints' },
    { id: 'player', title: 'Player Stats & Match Save', icon: Trophy, badge: '3 Endpoints' },
    { id: 'rules', title: 'Rules Knowledge Engine', icon: BookOpen, badge: '2 Endpoints' },
    { id: 'questions', title: 'AI Chat & Feedback Loop', icon: HelpCircle, badge: '2 Endpoints' },
    { id: 'sdks', title: 'Client SDK Libraries', icon: Code2, badge: '5 SDKs' }
  ];

  const allEndpoints = [
    { page: 'auth', method: 'POST', path: '/api/auth/signup', title: 'Register New Player Account', 
      desc: 'Creates the player identity and generates profile with verified callsign, 0 crystals, and default stats.',
      params: [['email', 'string', 'Required', 'Valid email address for player account.'], ['password', 'string', 'Required', 'Account password.'], ['data.username', 'string', 'Required', 'Unique player username.'], ['data.registered_app', 'string', 'Optional', 'Name of the TCG client.']],
      reqBody: '{\n  "email": "player@example.com",\n  "password": "Password123!",\n  "data": {\n    "username": "ShadowNinja",\n    "registered_app": "tcg_tournament_client"\n  }\n}',
      resBody: '{\n  "id": "782fc...",\n  "role": "player",\n  "email": "player@example.com"\n}', copyId: 'auth_signup' },
      
    { page: 'auth', method: 'POST', path: '/api/auth/login', title: 'Player Login', 
      desc: 'Authenticates credentials and returns the player JWT access_token.',
      params: [['email', 'string', 'Required', 'Registered player email.'], ['password', 'string', 'Required', 'Player account password.']],
      reqBody: '{\n  "email": "player@example.com",\n  "password": "Password123!"\n}',
      resBody: '{\n  "access_token": "eyJhbG...",\n  "token_type": "bearer",\n  "expires_in": 3600,\n  "refresh_token": "u4Q..."\n}', copyId: 'auth_login' },
      
    { page: 'auth', method: 'POST', path: '/api/auth/refresh', title: 'Refresh Access Token', 
      desc: 'Obtain a fresh 1-hour access token without prompting player for password.',
      params: [['refresh_token', 'string', 'Required', 'Refresh token from previous login.']],
      reqBody: '{\n  "refresh_token": "YOUR_REFRESH_TOKEN"\n}',
      resBody: '{\n  "access_token": "eyJhbG...",\n  "token_type": "bearer",\n  "expires_in": 3600,\n  "refresh_token": "NEW_REFRESH_TOKEN"\n}', copyId: 'auth_refresh' },
      
    { page: 'auth', method: 'POST', path: '/api/auth/recover', title: 'Password Recovery Email', 
      desc: 'Send a secure password reset link to the player.',
      params: [['email', 'string', 'Required', 'Registered player email.']],
      reqBody: '{\n  "email": "player@example.com"\n}',
      resBody: '{}', copyId: 'auth_recover' },
      
    { page: 'player', method: 'GET', path: '/api/profiles/{id}', title: 'Fetch Player Profile', 
      desc: 'Returns the current player record containing callsign, crystals balance, total duels, and account status.',
      params: [['id', 'string', 'Required', 'UUID of the user (in path).']],
      resBody: '{\n  "id": "782fc912-...",\n  "username": "ShadowNinja",\n  "crystals_collected": 12,\n  "matches_played": 15,\n  "matches_won": 11,\n  "avatar_id": "chynaman"\n}', copyId: 'player_get' },
      
    { page: 'player', method: 'PATCH', path: '/api/profiles/{id}', title: 'Update Stats & Award Crystals', 
      desc: 'Called by TCG apps upon match conclusion.',
      params: [['id', 'string', 'Required', 'UUID of the user (in path).']],
      reqBody: '{\n  "crystals_collected": 13,\n  "matches_played": 16,\n  "matches_won": 12,\n  "last_active_app": "tcg_unity_arena"\n}',
      resBody: '{\n  "id": "782fc912-...",\n  "username": "ShadowNinja",\n  "crystals_collected": 13\n}', copyId: 'player_patch' },
      
    { page: 'player', method: 'GET', path: '/api/profiles/leaderboard', title: 'Global Leaderboard', 
      desc: 'Queries the top 10 players across the Attention TCG ecosystem ranked by Crystals.',
      params: [], resBody: '[\n  { "username": "ProGamer", "crystals_collected": 9500 },\n  { "username": "ShadowNinja", "crystals_collected": 13 }\n]', copyId: 'player_leaderboard' },
      
    { page: 'rules', method: 'GET', path: '/api/rules', title: 'Fetch Active Rules Knowledge', 
      desc: 'Returns all active, approved game rules sorted by display priority.',
      params: [], resBody: '[\n  {\n    "id": "rule-1",\n    "topic": "Official TCG Rules",\n    "category": "Setup",\n    "short_answer": "Players roll 2 dice for turn order..."\n  }\n]', copyId: 'rules_get' },
      
    { page: 'rules', method: 'GET', path: '/api/rules?category=Combat', title: 'Filter Rules by Category & Keyword', 
      desc: 'Supports Full-Text filters for instant contextual search.',
      params: [['category', 'string', 'Optional', 'Category filter'], ['topic', 'string', 'Optional', 'Topic filter']], 
      resBody: '[\n  {\n    "id": "rule-2",\n    "topic": "Combat Rules",\n    "category": "Combat",\n    "short_answer": "Clashes are resolved..."\n  }\n]', copyId: 'rules_filter' },
      
    { page: 'questions', method: 'POST', path: '/api/questions', title: 'Log In-Game Player Query', 
      desc: 'Stores the player query and AI generated response in the Command Deck inbox.',
      params: [['question_text', 'string', 'Required', 'The raw question asked.'], ['ai_answer', 'string', 'Optional', 'The AI answer.'], ['app_source', 'string', 'Optional', 'Client identifier.']],
      reqBody: '{\n  "question_text": "Can I counter a Special Attack?",\n  "ai_answer": "Yes, Barrier counters all strikes...",\n  "app_source": "tcg_client"\n}',
      resBody: '{}\n', copyId: 'questions_post' },
      
    { page: 'questions', method: 'PATCH', path: '/api/questions/{id}', title: 'Submit Rating & Suggested Answer', 
      desc: 'Allows players to thumbs-down inaccurate answers and propose corrections.',
      params: [['id', 'string', 'Required', 'UUID of the question (in path).']],
      reqBody: '{\n  "is_helpful": false,\n  "user_suggested_answer": "The rulebook says Special Attacks bypass barrier."\n}',
      resBody: '{}\n', copyId: 'questions_patch' }
  ];

  const searchResults = searchFilter.trim()
    ? allEndpoints.filter(e => e.title.toLowerCase().includes(searchFilter.toLowerCase()) || e.path.toLowerCase().includes(searchFilter.toLowerCase()))
    : [];

  const sdkCode = {
    js: `// npm install axios\nimport axios from 'axios';\n\nexport const tcgClient = axios.create({\n  baseURL: '${apiUrl}',\n  headers: { 'Content-Type': 'application/json' }\n});`,
    unity: `// Unity C# Networking\nusing UnityEngine.Networking;\n\nstring RestUrl = "${apiUrl}";`,
    swift: `// Swift URLSession\nimport Foundation\n\nlet url = URL(string: "${apiUrl}")!`,
    flutter: `// pubspec.yaml: http: ^1.1.0\nimport 'package:http/http.dart' as http;\n\nfinal String apiUrl = '${apiUrl}';`,
    curl: `curl -X GET '${apiUrl}/rules' \\\n  -H 'Authorization: Bearer YOUR_TOKEN'`
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
            .sidebar-page-btn { transition: all 0.2s ease; }
            .sidebar-page-btn:hover { background: rgba(0, 240, 255, 0.1) !important; color: var(--neon-cyan, #00f0ff) !important; }
          `}</style>

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
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} /> HUB
              </button>
              <div className="brand-pill-badge" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>注意!</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '1.5px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', color: '#fff' }}>
                OPENAPI PORTAL <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontSize: '0.85rem', fontWeight: 'normal', letterSpacing: '1px' }}>// TCG APIS</span>
              </div>
            </div>

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

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
            <aside
              style={{
                width: '280px',
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
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder="Search endpoints..."
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
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)' }}>{sr.title}</span>
                            <span style={{ fontSize: '0.68rem', background: getMethodColor(sr.method, 0.15), color: getMethodColor(sr.method, 1), padding: '1px 5px', borderRadius: '4px' }}>{sr.method}</span>
                          </div>
                          <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sr.path}</code>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.72rem', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', padding: '0 8px 10px 8px', textTransform: 'uppercase' }}>
                      API RESOURCES
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
                              <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '0.5px' }}>
                                {page.title}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(5, 10, 24, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 8px #39ff14' }}></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#39ff14' }}>REST API ONLINE</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                  Swagger OpenAPI 3.0
                </div>
              </div>
            </aside>

            <main
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px 48px 60px 48px',
                boxSizing: 'border-box'
              }}
            >
              {activePage === 'overview' && (
                <div>
                  <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', margin: '0 0 8px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                    API REFERENCE <span style={{ color: 'var(--neon-cyan, #00f0ff)' }}>OVERVIEW</span>
                  </h1>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 32px 0', maxWidth: '850px', lineHeight: '1.6' }}>
                    Welcome to the Attention TCG Swagger/OpenAPI portal. Explore all interactive endpoints, view parameter schemas, and access full JSON payloads for testing and implementation.
                  </p>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)' }}>
                      GLOBAL SERVER CONFIGURATION
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                      <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>BASE REST URL</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ color: '#fff', fontSize: '0.9rem' }}>{supabaseUrl}</code>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(14, 22, 42, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>API KEY (ANON)</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ color: 'var(--neon-gold, #ffe600)', fontSize: '0.84rem' }}>{anonKey.substring(0, 24)}...</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePage !== 'overview' && activePage !== 'sdks' && (
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {docPages.find(p => p.id === activePage)?.title}
                  </h1>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0' }}>
                    Expand an endpoint below to view its complete Swagger schema, requirements, and examples.
                  </p>
                  
                  {allEndpoints.filter(e => e.page === activePage).map((ep, idx) => (
                     <EndpointAccordion 
                       key={idx}
                       method={ep.method}
                       path={ep.path}
                       title={ep.title}
                       description={ep.desc}
                       parameters={ep.params}
                       bodyCode={ep.reqBody}
                       responseCode={ep.resBody}
                       copyId={ep.copyId}
                     />
                  ))}
                </div>
              )}
              
              {activePage === 'sdks' && (
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0 0 24px 0', fontFamily: 'var(--font-display, "Rajdhani", sans-serif)', letterSpacing: '1px' }}>
                    SDK LIBRARIES
                  </h1>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                      {['js', 'unity', 'swift', 'flutter', 'curl'].map(s => (
                         <button key={s} onClick={() => setActiveSdk(s)} style={{
                           padding: '8px 16px', borderRadius: '8px', 
                           border: activeSdk === s ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid transparent',
                           background: activeSdk === s ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                           color: activeSdk === s ? 'var(--neon-cyan, #00f0ff)' : '#fff', cursor: 'pointer', fontWeight: 'bold'
                         }}>
                           {s.toUpperCase()}
                         </button>
                      ))}
                  </div>
                  <CodeBlock label={activeSdk.toUpperCase() + " IMPLEMENTATION"} code={sdkCode[activeSdk]} copyId="sdk_code" />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
