import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Send, X, Bot, Swords, ArrowLeft, ThumbsUp, ThumbsDown, User, Shield, LogOut, Check, Trophy, Settings, Music, Lock } from 'lucide-react';
import axios from 'axios';
import { Groq } from 'groq-sdk';
import './App.css';
import './pages/GamePage.css';
import { presetQuestions } from './questions.js';
import GamePage from './pages/GamePage.jsx';
import { ScaleWrapper } from './components/ScaleWrapper.jsx';
import { DynamicScaleWrapper } from './components/DynamicScaleWrapper.jsx';
import { CHAT_AVATARS, getViseme, getVisemeFileForChar, preloadCharacterVisemes } from './chatAvatars';
import { AvatarDropdown } from './components/AvatarDropdown.jsx';
import { RULES_KNOWLEDGE } from './game/data/rulesKnowledge.js';
import KontrolaArena from './game/kontrola/KontrolaArena.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import DocsPage from './pages/DocsPage.jsx';
import { authService } from './services/authService.js';
import { knowledgeService } from './services/knowledgeService.js';
import { economyService } from './services/economyService.js';
import { musicService } from './services/musicService.js';
import { setupGlobalErrorHandlers } from './services/bugReportService.js';
import BugReportButton from './components/BugReportButton.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { StoreModal } from './components/StoreModal.jsx';
import MusicUploadProgress from './components/MusicUploadProgress.jsx';
import { LeaderboardModal } from './components/LeaderboardModal.jsx';

// ============================================================================
// HELPER FUNCTIONS FOR MODULE ACCESS & BADGES
// These are defined at module level so both Hub and App can use them
// ============================================================================

// Determine if user can access a module based on pro status and crystals
const canAccessModule = (moduleName, moduleSettings, userProfile) => {
  const isProModule = moduleSettings?.premium_modules?.includes(moduleName);
  const hasCost = moduleSettings?.module_costs?.[moduleName];
  const userIsPro = userProfile?.is_premium === true;
  const userCrystals = userProfile?.crystals_collected || 0;
  const cost = moduleSettings?.module_costs?.[moduleName] ?? 0;

  // User can access if:
  // 1. Not pro module AND (no cost OR has enough crystals), OR
  // 2. Is pro module AND (user has PRO status OR has enough crystals)
  if (!isProModule) {
    // Free module - only check crystal cost if it exists
    if (hasCost) return userCrystals >= cost;
    return true; // Free, no cost
  } else {
    // Pro module - needs PRO or crystals
    if (userIsPro) return true;
    if (hasCost) return userCrystals >= cost;
    return false; // Pro module but user is not PRO and no crystals to bypass
  }
};

// Render module access badge (pro icon, cost, lock icon)
const renderModuleBadge = (moduleName, moduleSettings, userProfile) => {
  const isProModule = moduleSettings?.premium_modules?.includes(moduleName);
  const hasCost = moduleSettings?.module_costs?.[moduleName];
  const cost = hasCost ?? 0;
  const canAccess = canAccessModule(moduleName, moduleSettings, userProfile);
  const userIsPro = userProfile?.is_premium === true;

  return (
    <>
      {/* Pro Badge (👑) - Only if module is pro-exclusive */}
      {isProModule && (
        <div style={{
          position: 'absolute', top: '-14px', right: '24px',
          background: 'linear-gradient(135deg, #1a0a00, #2d1500)',
          padding: '5px 14px',
          borderRadius: '20px',
          border: '2px solid var(--neon-gold)',
          color: 'var(--neon-gold)',
          fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '0.82rem',
          fontFamily: 'Bebas Neue, sans-serif',
          letterSpacing: '0.5px',
          boxShadow: '0 0 12px rgba(251, 200, 13,0.25)',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.95rem' }}>👑</span>
          <span>PRO</span>
        </div>
      )}

      {/* Cost Badge (💎) - Only if module has cost */}
      {hasCost && (
        <div style={{
          position: 'absolute', top: isProModule ? '-14px' : '-14px', right: isProModule ? 'calc(24px + 80px)' : '24px',
          background: 'linear-gradient(135deg, #1a0a00, #2d1500)',
          padding: '5px 14px',
          borderRadius: '20px',
          border: '2px solid var(--neon-gold)',
          color: 'var(--neon-gold)',
          fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '0.82rem',
          fontFamily: 'Bebas Neue, sans-serif',
          letterSpacing: '0.5px',
          boxShadow: '0 0 12px rgba(251, 200, 13,0.25)',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.95rem' }}>💎</span>
          <span>{cost}</span>
          <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>/ MATCH</span>
        </div>
      )}

      {/* Lock Icon - for non-pro users who can't access */}
      {!userIsPro && !canAccess && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '30px',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid var(--neon-gold)',
          boxShadow: '0 0 16px rgba(251, 200, 13,0.3)',
          pointerEvents: 'none'
        }}>
          <Lock size={24} style={{ color: 'var(--neon-gold)' }} />
        </div>
      )}
    </>
  );
};

const Avatar = ({ characterId, isSpeaking, currentVisemeFile }) => {
  const avatarConfig = CHAT_AVATARS[characterId] || CHAT_AVATARS.chyna;
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural idle eye blinking every 3-5 seconds
  useEffect(() => {
    if (isSpeaking) {
      setIsBlinking(false);
      return;
    }
    let blinkTimer;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 2800;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };
    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, [isSpeaking, characterId]);

  const closedViseme = getVisemeFileForChar(characterId, 'CLOSED');
  const imagePath = encodeURI(isSpeaking && currentVisemeFile
    ? `${import.meta.env.BASE_URL}${avatarConfig.talkDir}/${currentVisemeFile}`
    : isBlinking
      ? `${import.meta.env.BASE_URL}${avatarConfig.talkDir}/${closedViseme}`
      : `${import.meta.env.BASE_URL}${avatarConfig.idlePath}`);

  const visuals = avatarConfig.visuals || {
    enableWaves: true,
    enableOutline: true,
    enableCircleBg: true,
    pumpScaleWide: 1.25,
    pumpScalePartial: 1.15,
    pumpScaleConsonant: 1.08,
    pumpScaleClosed: 1.0
  };

  // Dynamically calculate ring scale based on how open the mouth is
  let ringScale = visuals.pumpScaleClosed;
  if (isSpeaking && currentVisemeFile) {
    const v = currentVisemeFile.toUpperCase();
    if (v.includes('A') || v.includes('E') || v.includes('O') || v.includes('W')) {
      ringScale = visuals.pumpScaleWide;
    } else if (v.includes('U') || v.includes('I') || v.includes('L') || v.includes('M') || v.includes('B')) {
      ringScale = visuals.pumpScalePartial;
    } else if (v.includes('CLOSED') || v.includes('SILENCE')) {
      ringScale = visuals.pumpScaleClosed;
    } else {
      ringScale = visuals.pumpScaleConsonant;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`avatar-gemini-container ${isSpeaking ? 'is-speaking' : ''}`}>
        {/* Ambient Character Aura (only if outline is enabled) */}
        {visuals.enableOutline && (
          <div
            className="avatar-aura-glow"
            style={{
              background: avatarConfig.ringGradient || avatarConfig.themeColor || 'var(--neon-cyan)',
            }}
          />
        )}

        {/* Dynamic Glowing Ring (only if outline is enabled) */}
        {visuals.enableOutline && (
          <div
            className="avatar-gemini-ring-wrapper"
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${ringScale})`,
              transition: isSpeaking ? 'transform 0.1s ease-out' : 'transform 1.5s ease-out'
            }}
          >
            <div
              className="avatar-gemini-ring"
              style={{
                background: avatarConfig.ringGradient || undefined
              }}
            ></div>
          </div>
        )}

        {/* Masked Portrait with Scale/Offset */}
        <div className="avatar-gemini-mask" style={{ background: visuals.enableCircleBg ? 'var(--bg-card-solid)' : 'transparent' }}>
          <img
            src={imagePath}
            alt={avatarConfig.name}
            className="avatar-gemini-image"
            style={{
              transform: `scale(${avatarConfig.scale || 0.6}) translateY(${avatarConfig.offsetY || '0px'})`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>

      {/* Audio Reactive Waveform Indicator (only if enabled) */}
      {visuals.enableWaves && (
        <div className={`avatar-audio-waves ${isSpeaking ? 'is-active' : ''}`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="soundwave-bar"
              style={{
                background: avatarConfig.themeColor || 'var(--neon-cyan)',
                height: isSpeaking ? undefined : '3px',
                opacity: isSpeaking ? 0.95 : 0.25,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function Chat({ onBack, isOverlay = false }) {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnimatingTalk, setIsAnimatingTalk] = useState(false);
  const [status, setStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [useExactSync, setUseExactSync] = useState(true);
  const AVATAR_STORAGE_KEY = 'tcg_companion_chat_avatar';
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => {
    // Start with localStorage as instant cache, DB will override on auth load
    try {
      const cached = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (cached && CHAT_AVATARS[cached]) return cached;
    } catch (e) {}
    return 'chyna';
  });
  const [currentVisemeFile, setCurrentVisemeFile] = useState(() => {
    try {
      const cached = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (cached && CHAT_AVATARS[cached]) return getVisemeFileForChar(cached, 'CLOSED');
    } catch (e) {}
    return getVisemeFileForChar('chyna', 'CLOSED');
  });
  const [activeRules, setActiveRules] = useState(RULES_KNOWLEDGE);
  const [lastQuestionId, setLastQuestionId] = useState(null);
  const [userFeedback, setUserFeedback] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Load knowledge base from Supabase
    knowledgeService.fetchRulesKnowledge().then((loaded) => {
      if (loaded && loaded.length > 0) setActiveRules(loaded);
    });

    // Load user session and sync avatar from DB profile
    authService.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        authService.getProfile(user.id).then((prof) => {
          if (prof) {
            setUserProfile(prof);
            // Sync avatar from DB — DB is authoritative
            if (prof.avatar_id && CHAT_AVATARS[prof.avatar_id]) {
              setSelectedAvatarId(prof.avatar_id);
              setCurrentVisemeFile(getVisemeFileForChar(prof.avatar_id, 'CLOSED'));
              try { localStorage.setItem(AVATAR_STORAGE_KEY, prof.avatar_id); } catch (e) {}
            }
          }
        });
      }
    });
  }, []);

  const handleRateAnswer = async (rating) => {
    setUserFeedback(rating);
    if (lastQuestionId) {
      await knowledgeService.submitFeedback(lastQuestionId, rating);
      setFeedbackSuccessMsg('Thank you for rating!');
      setTimeout(() => setFeedbackSuccessMsg(''), 2500);
    }
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!suggestedAnswer.trim()) return;
    setIsSubmittingCorrection(true);
    setUserFeedback('unhelpful');
    try {
      await knowledgeService.submitRuleCorrection({
        questionId: lastQuestionId,
        questionText: query || 'Official Rule Correction',
        aiAnswer: answer,
        suggestedAnswer: suggestedAnswer.trim(),
        userId: currentUser?.id,
        userName: userProfile?.display_name || currentUser?.email || 'Guest Player'
      });
    } catch (err) {
      console.error('Error submitting correction:', err);
    } finally {
      setIsSubmittingCorrection(false);
      setShowCorrectionModal(false);
      setSuggestedAnswer('');
      setFeedbackSuccessMsg('Correction submitted to Game Masters for review!');
      setTimeout(() => setFeedbackSuccessMsg(''), 4000);
    }
  };

  const handleSelectAvatar = (newAvatarId) => {
    if (newAvatarId === selectedAvatarId) return;
    stopSpeaking();
    setSelectedAvatarId(newAvatarId);
    setChatHistory([]);
    setDisplayedAnswer('');
    setAnswer('');
    setStatus('');

    // Write to localStorage as instant cache
    try { localStorage.setItem(AVATAR_STORAGE_KEY, newAvatarId); } catch (e) {}

    // Write to DB profile as authoritative source
    if (currentUser?.id) {
      authService.updateProfile(currentUser.id, { avatar_id: newAvatarId }).catch(e =>
        console.warn('Failed to save avatar to DB:', e)
      );
    }

    setCurrentVisemeFile(getVisemeFileForChar(newAvatarId, 'CLOSED'));

    // Disallowed and preferred voice filters per client specification
    const DISALLOWED_VOICES = ['fred', 'junior', 'superstar'];
    const isVoiceAllowed = (v) => !DISALLOWED_VOICES.some(bad => v.name.toLowerCase().includes(bad));

    // Automatically switch voice based on character gender
    if (availableVoices.length > 0) {
      let voice;
      if (newAvatarId === 'chyna') {
        // Chyna is male (exclude Fred/Junior/Superstar, prefer Daniel/Alex/David)
        voice = availableVoices.find(v => isVoiceAllowed(v) && (v.name.toLowerCase().includes('male') || ['Daniel', 'Alex', 'David'].some(n => v.name.includes(n))));
      } else {
        // Others are female (prefer Samantha / Moira)
        voice = availableVoices.find(v => isVoiceAllowed(v) && ['Samantha', 'Moira'].some(n => v.name.includes(n))) ||
                availableVoices.find(v => isVoiceAllowed(v) && (v.name.toLowerCase().includes('female') || ['Victoria', 'Karen', 'Zira'].some(n => v.name.includes(n))));
      }
      if (voice) {
        setSelectedVoiceURI(voice.voiceURI);
      }
    }
  };

  // Load available system voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        const DISALLOWED_VOICES = ['fred', 'junior', 'superstar'];
        const isVoiceAllowed = (v) => !DISALLOWED_VOICES.some(bad => v.name.toLowerCase().includes(bad));

        // Prefer English voices with localService, fallback to all English voices
        let voices = allVoices.filter(v => v.lang.startsWith('en') && v.localService && isVoiceAllowed(v));
        if (voices.length === 0) {
          voices = allVoices.filter(v => v.lang.startsWith('en') && isVoiceAllowed(v));
        }
        if (voices.length === 0) {
          voices = allVoices.filter(isVoiceAllowed);
        }
        if (voices.length === 0) {
          voices = allVoices; // Final safety fallback
        }
        setAvailableVoices(voices);

        // Set a smart default if none selected yet
        if (voices.length > 0 && !selectedVoiceURI) {
          let defaultVoice;
          if (selectedAvatarId === 'chyna') {
            defaultVoice = voices.find(v => isVoiceAllowed(v) && (v.name.toLowerCase().includes('male') || ['Daniel', 'Alex', 'David'].some(n => v.name.includes(n))));
          } else {
            defaultVoice = voices.find(v => isVoiceAllowed(v) && ['Samantha', 'Moira'].some(n => v.name.includes(n))) ||
                           voices.find(v => isVoiceAllowed(v) && (v.name.toLowerCase().includes('female') || ['Victoria', 'Karen', 'Zira'].some(n => v.name.includes(n))));
          }
          if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
          else setSelectedVoiceURI(voices[0].voiceURI);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedAvatarId]);

  useEffect(() => {
    knowledgeService.loadActiveKnowledgeText()
      .then(text => {
        if (text) setDocumentText(text);
      })
      .catch(err => {
        console.warn("Could not load knowledge text via knowledgeService, falling back to disk:", err);
        fetch(`${import.meta.env.BASE_URL}Knowledge Base/AI_Breakdowns.txt`)
          .then(res => res.text())
          .then(text => setDocumentText(text))
          .catch(e => console.error("Could not load Knowledge Base/AI_Breakdowns.txt", e));
      });
  }, []);
  const streamTimer = useRef(null);
  const isCancelledRef = useRef(false);

  const parseDocumentQA = (text) => {
    if (!text) return [];
    const blocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 10);
    const qaPairs = [];

    for (let b of blocks) {
      const lines = b.trim().split('\n');
      if (lines[0].trim().endsWith('?')) {
        const question = lines[0].trim();
        const answer = lines.slice(1).join('\n').trim();
        qaPairs.push({ question, answer, block: b });
      }
    }
    return qaPairs;
  };

  const checkSecurityOrTechQuery = (query) => {
    const q = query.toLowerCase();
    const forbiddenKeywords = [
      'system prompt', 'system instruction', 'api key', 'groq key', 'api_key', 'secret',
      'source code', 'write code', 'show code', 'javascript', 'python', 'sql', 'github',
      'ignore previous', 'disregard previous', 'jailbreak', 'dan mode', 'prompt injection',
      'backend', 'database', 'server architecture', 'bypass', 'eval('
    ];
    return forbiddenKeywords.some(kw => q.includes(kw));
  };

  const handleConversationalLocal = (query) => {
    const qClean = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (!qClean) return null;

    // 1. Greetings
    if (/^(hi|hello|hey|greetings|howdy|yo|good morning|good afternoon|good evening)\b/i.test(qClean)) {
      return "Hello! I am your Attention TCG Companion AI. I'm here to help you navigate rules, character abilities, combat clashes, and Zombie Mode. What would you like to know?";
    }

    // 2. How are you / status
    if (qClean.includes('how are you') || qClean.includes('how are u') || qClean.includes('hows it going') || qClean.includes('whats up') || qClean.includes('what up') || qClean.includes('how do you do')) {
      return "I'm doing great and fully charged for battle! How are you doing today? Ready to test your strategies or need clarification on a move?";
    }

    // 3. Who are you / Identity
    if (qClean.includes('who are you') || qClean.includes('what are you') || qClean.includes('who made you') || qClean.includes('what can you do') || qClean === 'help') {
      return "I am the official Attention TCG Companion AI, inspired by the Attention Anime Series! I can guide you through game setup, card rules, character stats, combat dice rolls, energy tokens, and Zombie Mode. Ask me any rule question!";
    }

    // 4. Gratitude
    if (qClean.includes('thank you') || qClean.includes('thanks') || qClean.includes('thx') || qClean.includes('appreciate it')) {
      return "You're very welcome! May the stability crystals align in your favor. Let me know if you need anything else during your duel!";
    }

    // 5. Farewell
    if (/^(bye|goodbye|cya|see you|farewell)\b/i.test(qClean)) {
      return "Farewell for now! Step into the arena with confidence, and return anytime you need rule guidance!";
    }

    return null;
  };

  const localSearch = (query) => {
    const qRaw = (query || '').trim();
    if (!qRaw) return "Please ask a question about Attention TCG rules, combat dice, character moves, or Zombie mode!";

    // 1. Security & Guardrails
    if (checkSecurityOrTechQuery(qRaw)) {
      return "I am dedicated exclusively to Attention TCG gameplay and official rules. I cannot provide system configurations, source code, or technical architecture details. Let's focus on the duel—ask me about characters, combat dice, or rules!";
    }

    // 2. Conversational
    const conv = handleConversationalLocal(qRaw);
    if (conv) return conv;

    const qLower = qRaw.toLowerCase();
    const qClean = qLower.replace(/[^a-z0-9\s]/g, ' ').trim();

    // 3. Direct Match for Core Rules / How to play
    if (
      /^(what(s|'s| is| are)? (the )?rules?(\s*of the game)?|how (do you|to) play(\s*the game)?|rule(s)? of the game|tell me the rules|game rules)$/i.test(qClean) ||
      qClean.includes('rule of the game') ||
      qClean.includes('rules of the game') ||
      qClean === 'rules' ||
      qClean === 'rule' ||
      qClean === 'how to play'
    ) {
      const coreRules = RULES_KNOWLEDGE.find(r => r.topic.includes('Official Attention TCG Rules') || r.topic.includes('Rules & Overview'));
      if (coreRules) {
        return `${coreRules.shortAnswer}\n\n${coreRules.details}`;
      }
    }

    // 4. Exact Q&A Document Matching (from AI_Breakdowns.txt)
    const qaPairs = parseDocumentQA(documentText);
    for (const qa of qaPairs) {
      const qaClean = qa.question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      if (qaClean === qClean) return qa.answer;
      if (qClean.length > 15 && qaClean.includes(qClean)) return qa.answer;

      // Word overlap check
      const qWords = qClean.split(/\s+/).filter(w => w.length > 2);
      const qaWords = qaClean.split(/\s+/).filter(w => w.length > 2);
      if (qWords.length > 0) {
        let matchCount = 0;
        for (let w of qWords) {
          if (qaWords.includes(w)) matchCount++;
        }
        if (matchCount >= qWords.length * 0.85 && matchCount >= 3) {
          return qa.answer;
        }
      }
    }

    // 5. Scored Knowledge Pack Matching
    let bestKnowledge = null;
    let highestScore = 0;

    for (const item of activeRules) {
      let score = 0;
      const kwList = Array.isArray(item.keywords) ? item.keywords : [];
      for (const k of kwList) {
        const kStr = String(k || '').toLowerCase();
        if (kStr && qLower.includes(kStr)) {
          // Exact phrase or multi-word keyword gets much higher weight
          score += kStr.includes(' ') ? 5 : (kStr.length >= 5 ? 3 : 2);
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestKnowledge = item;
      }
    }

    if (bestKnowledge && highestScore >= 2) {
      const shortAns = bestKnowledge.shortAnswer || bestKnowledge.short_answer || '';
      return `${shortAns}\n\n${bestKnowledge.details}`;
    }

    // 6. Fallback Rulebook / AI_Breakdowns Paragraph Search (with Stopword filtering)
    if (documentText) {
      const STOP_WORDS = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of', 'with',
        'what', 'whats', 'what\'s', 'how', 'who', 'when', 'where', 'why', 'can', 'you', 'tell', 'me',
        'about', 'does', 'do', 'are', 'i', 'my', 'your', 'it', 'this', 'that'
      ]);
      const paragraphs = documentText.split(/\n\s*\n/).filter(p => p.trim() !== '');
      const queryTokens = qClean.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

      if (queryTokens.length > 0) {
        let bestMatch = "";
        let maxDocScore = 0;

        for (let p of paragraphs) {
          let pScore = 0;
          const pLower = p.toLowerCase();
          for (let t of queryTokens) {
            if (pLower.includes(t)) pScore += 1;
          }
          if (pScore > maxDocScore) {
            maxDocScore = pScore;
            bestMatch = p;
          }
        }

        if (maxDocScore >= 2) {
          return bestMatch.trim();
        }
      }
    }

    // Default guidance
    return "I couldn't find an exact rule match for that query. You can ask me about:\n• Official Rules & Game Setup (10 Action / 10 Character cards, 5 ET, 3 Crystals to win)\n• 2-Stage Clash & DP Defense (rolling 6+ on Gold dice)\n• Zombie Mode (transformation, 40 HP, +10 regen, revival tiers)\n• Energy Tokens & Claims (5 starting ET, Use It or Lose It rule)\n• Saigo No Blitz (200 AP, HP < 50 condition)\n• Mind Strength & Kontrol Card rules\n• Character Move Sets & Elemental Weaknesses";
  };

  const summarizeWithGroq = async (questionText, fullRuleText, history = []) => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      console.log("Sending request to Groq API with model: openai/gpt-oss-120b");
      
      const recentHistory = history.slice(-5).map(h => [
        { role: 'user', content: h.q },
        { role: 'assistant', content: h.a }
      ]).flat();

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b", // User-requested model
        messages: [
          {
            role: "system",
            content: "You are the TCG Companion AI, a helpful, conversational, and enthusiastic game guide. Answer questions about the game rules naturally, as if chatting with a friend. In Attention TCG, 'HP' strictly stands for 'Health Points' (NEVER call it 'Horse Power'). 'ET' stands for 'Energy Tokens', 'DP' stands for 'Defense Points', and 'AP' stands for 'Attack Power'. DO NOT sound like a programmed bot and AVOID using long bulleted lists or formatting when possible. Keep it short, punchy, and conversational (1-3 sentences max). NEVER add new rules."
          },
          ...recentHistory,
          {
            role: "user",
            content: `Question: ${questionText}\n\nReference Rule Text: ${fullRuleText}\n\nPlease provide a very natural, conversational answer based ONLY on the reference text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      });
      console.log("Groq API Response received:", response);

      return response.choices[0]?.message?.content?.trim() || fullRuleText;

    } catch (error) {
      console.error("================ GROQ API ERROR ================");
      console.error("Error Object:", error);
      console.error("Error Message:", error.message);
      if (error.status) console.error("Status Code:", error.status);
      if (error.error) console.error("Groq Error Details:", error.error);
      console.error("================================================");
      console.warn("Groq SDK failed or timed out. Falling back to local text.");
      return fullRuleText;
    }
  };

  const askQuestion = async (q) => {
    const query = q || question;
    if (!query) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    }

    setStatus('Processing message...');
    setQuestion('');
    setDisplayedAnswer('');
    setIsSpeaking(false);
    setIsAnimatingTalk(false);
    isCancelledRef.current = false;
    
    // Minimum 2 second processing delay
    const waitPromise = new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const rawAns = localSearch(query);
      let finalAns = rawAns;

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (apiKey && apiKey !== 'undefined' && rawAns && rawAns.length > 280) {
        finalAns = await summarizeWithGroq(query, rawAns, chatHistory);
      }

      await waitPromise; // Wait for at least 2 seconds

      setAnswer(finalAns);
      setChatHistory(prev => [...prev, { q: query, a: finalAns }]);
      setUserFeedback(null);
      setSuggestedAnswer('');
      setStatus(''); // Clear the "Processing message..." status

      // Background question logging to Supabase (fire-and-forget)
      knowledgeService.logUserQuestion({
        userId: currentUser?.id || null,
        userName: userProfile?.username || 'Guest Player',
        questionText: query,
        aiAnswer: finalAns,
        matchedTopic: 'Attention TCG Rules',
        appSource: 'companion_hub'
      }).then((qId) => {
        if (qId) setLastQuestionId(qId);
      });

      const cleanForTTS = (text) => text
        .replace(/[【】•·*]/g, ' ')        // remove special brackets, bullets, and asterisks
        .replace(/\n\n/g, '. ')           // double newlines (2 chars) -> '. ' (2 chars) for pause
        .replace(/\n/g, ' ');             // single newlines -> space

      const cleanAns = cleanForTTS(finalAns);

      // Visual prep, but don't start typing until the voice starts!
      setIsSpeaking(true);
      setIsAnimatingTalk(true);

      if (streamTimer.current) clearInterval(streamTimer.current);

      let usedTTS = false;
      const startTextStream = () => {
        if (streamTimer.current) clearInterval(streamTimer.current);
        const words = finalAns.split(' ');
        let wIdx = 0;
        let charAcc = 0;
        setIsSpeaking(true);
        setIsAnimatingTalk(true);
        streamTimer.current = setInterval(() => {
          if (wIdx < words.length) {
            const currentWord = words[wIdx];
            charAcc += currentWord.length + (wIdx > 0 ? 1 : 0);
            setDisplayedAnswer(cleanAns.substring(0, charAcc));

            let wordClean = currentWord.trim();
            if (/^[.,!?]+$/.test(wordClean)) {
              setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'CLOSED'));
            } else {
              setCurrentVisemeFile(getViseme(wordClean, 0, selectedAvatarId));
            }
            wIdx++;
          } else {
            clearInterval(streamTimer.current);
            setIsSpeaking(false);
            setIsAnimatingTalk(false);
            setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'SMILE'));
          }
        }, 180);
      };

      if ('speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        window.speechSynthesis.resume();

        const applyVoiceToUtterance = (utt) => {
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || voices[0];
          if (voice) {
            utt.voice = voice;
            const isMale = selectedAvatarId === 'chyna' || voice.name.toLowerCase().includes('male') || ['Daniel', 'Alex', 'Fred', 'David'].some(n => voice.name.includes(n));
            utt.pitch = isMale ? 1.0 : 1.2;
          }
          utt.rate = 0.9;
          utt.volume = 1.0;
        };

        if (useExactSync) {
          // Robust sentence splitting (handles trailing text without punctuation and trims spaces)
          const rawSentences = cleanAns.match(/[^.!?]+[.!?]*/g) || [cleanAns];
          const sentences = rawSentences.map(s => s.trim()).filter(Boolean);
          
          let sentenceIndex = 0;
          let globalCharOffset = 0; // offset in cleanAns
          let vInterval = null;

          const playNextSentence = () => {
            if (isCancelledRef.current) {
              window.currentUtterance = null;
              return;
            }

            if (sentenceIndex >= sentences.length) {
              setIsSpeaking(false);
              setIsAnimatingTalk(false);
              setDisplayedAnswer(finalAns);
              setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'SMILE'));
              window.currentUtterance = null;
              return;
            }

            const currentSentence = sentences[sentenceIndex];
            const spokenSentence = currentSentence
              .replace(/\bHP\b/g, 'Health Points')
              .replace(/\bET\b/g, 'Energy Tokens')
              .replace(/\bDP\b/g, 'Defense Points')
              .replace(/\bAP\b/g, 'Attack Power');
            const utterance = new SpeechSynthesisUtterance(spokenSentence);
            window.currentUtterance = utterance; // Prevent GC
            applyVoiceToUtterance(utterance);

            let onboundaryFired = false;
            let fallbackTimeout = null;

            utterance.onstart = () => {
              if (isCancelledRef.current) {
                window.speechSynthesis.cancel();
                return;
              }
              usedTTS = true;
              setStatus('Answer received.');
              setIsSpeaking(true);
              setIsAnimatingTalk(true);

              fallbackTimeout = setTimeout(() => {
                if (!onboundaryFired && !isCancelledRef.current) {
                  // Fallback if onboundary isn't supported at all
                  startTextStream();
                }
              }, 500);
            };

            utterance.onboundary = (event) => {
              if (isCancelledRef.current) return;
              onboundaryFired = true;
              if (fallbackTimeout) {
                clearTimeout(fallbackTimeout);
                fallbackTimeout = null;
              }
              if (event.name === 'word') {
                if (vInterval) clearInterval(vInterval);

                let nextSpace = currentSentence.indexOf(' ', event.charIndex);
                if (nextSpace === -1) nextSpace = currentSentence.length;

                const wordStr = currentSentence.substring(event.charIndex, nextSpace);
                
                // Show text proportionately from finalAns so markdown formatting is visible during typing
                const currentSpokenCleanLength = globalCharOffset + nextSpace;
                const ratio = Math.min(1, currentSpokenCleanLength / cleanAns.length);
                const displayLength = Math.floor(finalAns.length * ratio);
                setDisplayedAnswer(finalAns.substring(0, displayLength));

                // Start visemes for this word
                let wordClean = wordStr.trim();
                if (/^[.,!?]+$/.test(wordClean)) {
                  setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'CLOSED'));
                  return;
                }

                setCurrentVisemeFile(getViseme(wordClean, 0, selectedAvatarId));
                
                let frame = 1;
                vInterval = setInterval(() => {
                  if (isCancelledRef.current) {
                    clearInterval(vInterval);
                    return;
                  }
                  const nextViseme = getViseme(wordClean, frame, selectedAvatarId);
                  if (nextViseme) {
                    setCurrentVisemeFile(nextViseme);
                    frame++;
                  } else {
                    clearInterval(vInterval);
                    setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'CLOSED'));
                  }
                }, 80); // 80ms per frame
              }
            };

            utterance.onend = () => {
              if (isCancelledRef.current) return;
              onboundaryFired = true; // Prevent fallback
              if (fallbackTimeout) {
                clearTimeout(fallbackTimeout);
                fallbackTimeout = null;
              }
              if (vInterval) clearInterval(vInterval);
              globalCharOffset += currentSentence.length;
              // Ensure space is added if there's more text coming
              if (sentenceIndex < sentences.length - 1) globalCharOffset += 1;
              
              const ratio = Math.min(1, globalCharOffset / cleanAns.length);
              setDisplayedAnswer(finalAns.substring(0, Math.floor(finalAns.length * ratio)));
              sentenceIndex++;
              // Delay next speak to prevent Chrome TTS Error loop
              setTimeout(playNextSentence, 20);
            };

            utterance.onerror = (e) => {
              if (isCancelledRef.current) return;
              console.error("SpeechSynthesisUtterance Error:", e);
              if (vInterval) clearInterval(vInterval);
              globalCharOffset += currentSentence.length;
              if (sentenceIndex < sentences.length - 1) globalCharOffset += 1;
              sentenceIndex++;
              // Delay next speak to prevent Chrome TTS Error loop
              setTimeout(playNextSentence, 20);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
              window.speechSynthesis.speak(utterance);
            } else {
              window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.speak(utterance);
                window.speechSynthesis.onvoiceschanged = null;
              };
            }
          };

          playNextSentence();

        } else {
          // Option C: Hybrid Typewriter (current logic)
          const spokenAns = cleanAns
            .replace(/\bHP\b/g, 'Health Points')
            .replace(/\bET\b/g, 'Energy Tokens')
            .replace(/\bDP\b/g, 'Defense Points')
            .replace(/\bAP\b/g, 'Attack Power');
          const utterance = new SpeechSynthesisUtterance(spokenAns);
          window.currentUtterance = utterance; // Prevent Garbage Collection

          const applyVoiceAndSpeak = () => {
            applyVoiceToUtterance(utterance);
            window.speechSynthesis.speak(utterance);
          };

          if (window.speechSynthesis.getVoices().length > 0) {
            applyVoiceAndSpeak();
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              applyVoiceAndSpeak();
              window.speechSynthesis.onvoiceschanged = null;
            };
          }

          utterance.onstart = () => {
            usedTTS = true;
            startTextStream();
          };

          utterance.onend = () => {
            window.currentUtterance = null;
          };

          utterance.onerror = () => {
            window.currentUtterance = null;
            if (!usedTTS) startTextStream();
          };

          // Fallback if TTS fails to start within 500ms
          setTimeout(() => {
            if (!usedTTS) startTextStream();
          }, 500);
        }
      } else {
        startTextStream();
      }
    } catch (err) {
      console.error(err);
      setStatus('Error asking question. Make sure a document is uploaded.');
    }
  };

  const stopSpeaking = () => {
    isCancelledRef.current = true;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (streamTimer.current) clearInterval(streamTimer.current);
    window.currentUtterance = null;
    setIsSpeaking(false);
    setIsAnimatingTalk(false);
    setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'CLOSED'));
  };

  const handlePresetClick = (q) => {
    setQuestion(q);
    setIsSidebarOpen(false);
    setTimeout(() => {
      askQuestion(q);
    }, 100);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    try {
      if (window.screen && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => { });
      }
    } catch (e) { }
  }, []);

  const layoutWidth = '100%';
  const innerInputWidth = isOverlay ? '95%' : '90%';

  const chatContent = (
    <div className="webgl-screen menu-screen" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', width: layoutWidth, alignItems: 'stretch', borderRadius: isOverlay ? '0' : undefined }}>
      <div className="menu-bg-elements" style={{ zIndex: 0 }}>
        <div className="neon-streak-red"></div>
        <div className="neon-streak-blue"></div>
        <div className="subtle-watermark-card left-wm"></div>
        <div className="subtle-watermark-card right-wm"></div>
      </div>

      <header className="top-nav" style={{ width: layoutWidth, boxSizing: 'border-box', position: 'relative', zIndex: 100 }}>
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="burger-button" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
          <div className="nav-logo" style={{ color: 'var(--text-light)', fontFamily: 'Orbitron, sans-serif' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="brand-pill-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>注意!</span>
              <span>TCG Chatbot</span>
              {userProfile?.username && (
                <span style={{ fontSize: '0.78rem', color: 'var(--neon-gold)', fontWeight: 'bold', background: 'rgba(251, 200, 13, 0.12)', border: '1px solid rgba(251, 200, 13, 0.35)', padding: '2px 8px', borderRadius: '6px', fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)' }}>
                  ⚔️ {userProfile.username}
                </span>
              )}
            </h2>
          </div>
        </div>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AvatarDropdown
            selectedAvatarId={selectedAvatarId}
            onSelectAvatar={handleSelectAvatar}
            disabled={isSpeaking || isAnimatingTalk}
          />
          <select
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            disabled={isSpeaking || isAnimatingTalk}
            title={(isSpeaking || isAnimatingTalk) ? "Please wait until the bot stops speaking" : "Select Voice"}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--text-light)',
              fontSize: '0.78rem',
              cursor: (isSpeaking || isAnimatingTalk) ? 'not-allowed' : 'pointer',
              opacity: (isSpeaking || isAnimatingTalk) ? 0.5 : 1,
              padding: '6px 8px',
              borderRadius: '8px',
              fontFamily: 'Orbitron, sans-serif',
              outline: 'none',
              maxWidth: '120px',
              textOverflow: 'ellipsis'
            }}
          >
            {availableVoices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => { stopSpeaking(); onBack(); }}
            style={{
              background: 'rgba(10, 25, 50, 0.85)',
              border: '1.5px solid rgba(0, 240, 255, 0.4)',
              borderRadius: '8px',
              color: 'var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              fontFamily: 'Bebas Neue, sans-serif',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)'
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO HUB</span>
          </button>
        </div>
      </header>

      <div className="chatgpt-layout" style={{ position: 'relative', zIndex: 10, background: 'transparent', width: layoutWidth, flexDirection: 'column', flex: 1, display: 'flex' }}>

        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3>Common Questions</h3>
            <button className="burger-button" onClick={toggleSidebar}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ul className="preset-list">
              {presetQuestions.map((q, idx) => (
                <li key={idx} onClick={() => handlePresetClick(q)} className="preset-item">
                  {q}
                </li>
              ))}
            </ul>

            {chatHistory.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '15px' }}>Chat History</h3>
                <ul className="preset-list">
                  {chatHistory.map((item, idx) => (
                    <li key={idx} className="preset-item" style={{ cursor: 'default' }}>
                      <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: '5px' }}>Q: {item.q}</strong>
                      <span style={{ fontSize: '0.85rem' }}>A: {item.a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="canvas-wrapper chat-canvas-layout" style={{ width: layoutWidth, flex: 1 }}>
          <div className="chat-avatar-container">
            <Avatar characterId={selectedAvatarId} isSpeaking={isAnimatingTalk} currentVisemeFile={currentVisemeFile} />
            {status === 'Processing message...' && (
              <div className="thinking-bubble" style={{ background: 'rgba(0,0,0,0.85)', padding: '8px 16px', borderRadius: '16px', border: '1px solid #00f0ff', position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#00f0ff', fontWeight: 'bold', fontSize: '0.9rem', marginRight: '4px' }}>Thinking</span>
                <span className="dot" style={{ backgroundColor: '#00f0ff', width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}></span>
                <span className="dot" style={{ backgroundColor: '#00f0ff', width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}></span>
                <span className="dot" style={{ backgroundColor: '#00f0ff', width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}></span>
              </div>
            )}
          </div>

          {chatHistory.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {chatHistory.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '16px' }}>
                  {/* User's Question */}
                  <div className="chat-bubble user" style={{ margin: '0 0 8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <User size={16} style={{ color: '#00f0ff' }} />
                      <span style={{ fontSize: '0.85rem', color: '#00f0ff', fontWeight: 'bold' }}>You</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>{item.q}</div>
                  </div>

                  {/* Bot's Answer */}
                  <div className="chat-bubble bot" style={{ margin: '0' }}>
                    <div className="bot-avatar-icon" style={{ overflow: 'hidden' }}>
                      <img
                        src={encodeURI(`${(import.meta.env.BASE_URL || '/').endsWith('/') ? (import.meta.env.BASE_URL || '/') : (import.meta.env.BASE_URL + '/')}${CHAT_AVATARS[selectedAvatarId]?.idlePath || CHAT_AVATARS.chyna?.idlePath || 'Chatbot Characters/Chyna/Idle/SILENCE.png'}`)}
                        alt="avatar"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `scale(${CHAT_AVATARS[selectedAvatarId]?.scale ? CHAT_AVATARS[selectedAvatarId].scale * 1.5 : 1})`,
                          transformOrigin: 'center center'
                        }}
                      />
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{item.a}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {answer && !chatHistory.some((item) => item.a === answer) && (
            <>
              {/* User Message - Separate Container */}
              {question && (
                <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <div className="chat-bubble user" style={{ margin: 0, maxWidth: '55%', marginRight: '60px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <User size={16} style={{ color: '#00f0ff' }} />
                      <span style={{ fontSize: '0.85rem', color: '#00f0ff', fontWeight: 'bold' }}>You</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>{question}</div>
                  </div>
                </div>
              )}

              {/* Bot Response - Separate Container */}
              <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="chat-bubble bot" style={{ margin: 0, maxWidth: '55%', marginLeft: '60px' }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {isSpeaking ? displayedAnswer : answer}
                    {isSpeaking && <span className="cursor-blink">|</span>}
                  </div>
                </div>
              </div>

              {/* Question Feedback Controls */}
              {answer && !isSpeaking && (
                <div style={{
                  width: '100%',
                  maxWidth: '1000px',
                  marginTop: '20px',
                  paddingTop: '16px',
                  paddingLeft: '60px',
                  paddingRight: '0px',
                  paddingBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderTop: '1px solid rgba(0, 240, 255, 0.2)'
                }}>
                  <span style={{ fontSize: '0.85rem', color: feedbackSuccessMsg ? '#39ff14' : 'rgba(255,255,255,0.7)', fontWeight: feedbackSuccessMsg ? 'bold' : 'normal', minWidth: '200px' }}>
                    {feedbackSuccessMsg || '👍 Was this rule accurate?'}
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleRateAnswer('helpful')}
                      disabled={userFeedback === 'helpful'}
                      style={{
                        background: userFeedback === 'helpful' ? 'rgba(57, 255, 20, 0.3)' : 'rgba(0, 240, 255, 0.1)',
                        border: userFeedback === 'helpful' ? '1px solid #39ff14' : '1px solid rgba(0, 240, 255, 0.3)',
                        color: userFeedback === 'helpful' ? '#39ff14' : 'rgba(0, 240, 255, 0.8)',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        cursor: userFeedback === 'helpful' ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => !userFeedback === 'helpful' && (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)')}
                      onMouseOut={(e) => !userFeedback === 'helpful' && (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)')}
                    >
                      <ThumbsUp size={16} /> Helpful
                    </button>
                    <button
                      onClick={() => setShowCorrectionModal(true)}
                      disabled={userFeedback === 'unhelpful'}
                      style={{
                        background: userFeedback === 'unhelpful' ? 'rgba(237, 30, 36, 0.3)' : 'rgba(255, 100, 100, 0.1)',
                        border: userFeedback === 'unhelpful' ? '1px solid #ff6688' : '1px solid rgba(255, 100, 100, 0.3)',
                        color: userFeedback === 'unhelpful' ? '#ff6688' : 'rgba(255, 100, 100, 0.8)',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        cursor: userFeedback === 'unhelpful' ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => !userFeedback === 'unhelpful' && (e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)')}
                      onMouseOut={(e) => !userFeedback === 'unhelpful' && (e.currentTarget.style.background = 'rgba(255, 100, 100, 0.1)')}
                    >
                      <ThumbsDown size={16} /> Suggest Fix
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* User Rule Correction Modal */}
          {showCorrectionModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 18, 0.85)',
                backdropFilter: 'blur(6px)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setShowCorrectionModal(false)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  background: '#0a1428',
                  border: '2px solid var(--neon-gold)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 0 40px rgba(251, 200, 13, 0.25)',
                  fontFamily: 'Bebas Neue, sans-serif'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--neon-gold)', fontSize: '1.4rem' }}>
                  ✍️ SUGGEST OFFICIAL RULE CORRECTION
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: '0 0 14px 0' }}>
                  Help make Attention TCG rules airtight. What should the verified answer be?
                </p>

                <form onSubmit={handleSubmitCorrection}>
                  <textarea
                    rows={4}
                    value={suggestedAnswer}
                    onChange={(e) => setSuggestedAnswer(e.target.value)}
                    placeholder="Enter the official rule explanation..."
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      marginBottom: '14px'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCorrectionModal(false)}
                      style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCorrection || !suggestedAnswer.trim()}
                      style={{
                        padding: '8px 18px',
                        background: isSubmittingCorrection || !suggestedAnswer.trim() ? 'rgba(251, 200, 13, 0.4)' : 'var(--neon-gold)',
                        border: 'none',
                        color: '#050a14',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: isSubmittingCorrection || !suggestedAnswer.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isSubmittingCorrection ? 'Submitting...' : 'Submit to Game Masters'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="bottom-input-area" style={{ width: layoutWidth, padding: '20px 40px 40px 40px', marginTop: 'auto' }}>
          <div className="input-container" style={{ width: innerInputWidth, margin: '0 auto' }}>
            <textarea
              className="chat-textarea"
              rows={2}
              style={{ minWidth: 0, resize: 'none' }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isSpeaking) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="Ask a rule question..."
              disabled={isSpeaking}
            />
            {!isSpeaking ? (
              <button className="send-button" onClick={() => askQuestion()}><Send size={18} /></button>
            ) : (
              <button
                className="send-button"
                onClick={stopSpeaking}
                style={{ background: '#ED1E24', color: '#fff', boxShadow: '0 0 15px rgba(237, 30, 36, 0.6)', flexShrink: 0 }}
                title="Stop Speaking"
              >
                ×
              </button>
            )}
          </div>
          {status && <div className="status-indicator" style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.7, marginTop: '8px' }}>{status}</div>}
        </div>
      </div>
    </div>
  );

  const PortraitOverlay = () => (
    <div className="force-portrait-overlay">
      <div className="icon">📱</div>
      <h2>Please Rotate Your Device</h2>
      <p>This screen is best experienced in portrait mode.</p>
    </div>
  );

  if (isOverlay) {
    return chatContent;
  }

  return (
    <>
      <PortraitOverlay />
      <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <DynamicScaleWrapper>
          {chatContent}
        </DynamicScaleWrapper>
      </div>
    </>
  );
}

export function Hub() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [appSettings, setAppSettings] = useState({ match_cost: 1, premium_modules: ['kontrola'], module_costs: {} });

  // Music submission modal state
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicFile, setMusicFile] = useState(null);
  const [musicSubmitting, setMusicSubmitting] = useState(false);
  const [musicNotice, setMusicNotice] = useState('');
  const [musicUploadProgress, setMusicUploadProgress] = useState(0);
  const [musicUploadStatus, setMusicUploadStatus] = useState('uploading'); // 'uploading', 'success', 'error'
  const [musicUploadMessage, setMusicUploadMessage] = useState('');
  const [isMusicProgressOpen, setIsMusicProgressOpen] = useState(false);

  React.useLayoutEffect(() => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => { });
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    economyService.getAppSettings().then(settings => {
      setAppSettings(settings);
    }).catch(err => console.warn('Failed fetching economy settings', err));

    authService.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        authService.getProfile(user.id).then((prof) => setUserProfile(prof)).catch(err => console.warn('Failed profile fetch', err));
      }
    }).catch(err => console.warn('Failed fetching user', err));

    const { data: { subscription } } = authService.onAuthStateChange((event, session, profile) => {
      // Ignore transient token refresh events that don't change actual auth state
      // Only update on SIGNED_IN, SIGNED_OUT, USER_UPDATED
      if (event === 'TOKEN_REFRESHED' && session?.user && currentUser?.id === session.user.id) {
        // Token refreshed but user didn't change — no-op to prevent flicker
        return;
      }
      setCurrentUser(session?.user || null);
      setUserProfile(profile);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const PortraitOverlay = () => (
    <div className="force-portrait-overlay">
      <div className="icon">📱</div>
      <h2>Please Rotate Your Device</h2>
      <p>This screen is best experienced in portrait mode.</p>
    </div>
  );

  return (
    <>
      <PortraitOverlay />
      <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <DynamicScaleWrapper>
          <div className="webgl-screen menu-screen" style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', padding: '0 40px', boxSizing: 'border-box', position: 'relative' }}>
            
            {/* Top Auth / Profile Bar — full-width top strip */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 28px',
              background: 'rgba(4, 10, 24, 0.75)',
              borderBottom: '1px solid rgba(0, 240, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              boxSizing: 'border-box'
            }}>
              {/* Left: Brand mark */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'Bebas Neue, sans-serif', fontWeight: 'bold',
                fontSize: '1rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px'
              }}>
                <span className="brand-pill-badge" style={{ fontSize: '0.65rem', padding: '2px 7px', margin: 0 }}>注意!</span>
                <span>TCG COMPANION HUB</span>
              </div>

              {/* Right: Auth area */}
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                  {/* Crystal balance chip */}
                  <button
                    onClick={() => setIsStoreOpen(true)}
                    title="Buy more crystals"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(0, 240, 255, 0.08)',
                      border: '1px solid rgba(0, 240, 255, 0.35)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Bebas Neue, sans-serif'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,240,255,0.18)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(0,240,255,0.08)'}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>💎</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--neon-cyan)', fontSize: '0.95rem' }}>
                      {userProfile?.crystals_collected || 0}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(0,240,255,0.55)', letterSpacing: '0.5px' }}>+ ADD</span>
                  </button>

                  {/* Admin button — only if admin */}
                  {userProfile?.is_admin && (
                    <button
                      onClick={() => navigate('/admin')}
                      title="Command Deck"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(251, 200, 13,0.12)',
                        border: '1px solid rgba(251, 200, 13,0.4)',
                        color: 'var(--neon-gold)',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '0.82rem', fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(251, 200, 13,0.22)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(251, 200, 13,0.12)'}
                    >
                      <Settings size={14} /><span>Admin</span>
                    </button>
                  )}

                  {/* Avatar circle — click to open dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(v => !v)}
                      title={userProfile?.username || 'Player'}
                      style={{
                        width: '40px', height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0d1a38, #1a2a50)',
                        border: '2px solid rgba(0,240,255,0.5)',
                        color: 'var(--neon-cyan)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem', fontWeight: 'bold',
                        fontFamily: 'Bebas Neue, sans-serif',
                        transition: 'all 0.2s ease',
                        boxShadow: isProfileDropdownOpen ? '0 0 14px rgba(0,240,255,0.4)' : 'none'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0,240,255,0.4)'; }}
                      onMouseOut={e => { if (!isProfileDropdownOpen) { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.5)'; e.currentTarget.style.boxShadow = 'none'; } }}
                    >
                      {(userProfile?.username || 'P').charAt(0).toUpperCase()}
                    </button>

                    {/* Dropdown menu */}
                    {isProfileDropdownOpen && (
                      <>
                        {/* Click-outside backdrop */}
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                          onClick={() => setIsProfileDropdownOpen(false)}
                        />
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                          minWidth: '200px',
                          background: 'rgba(6, 14, 32, 0.97)',
                          border: '1px solid rgba(0,240,255,0.25)',
                          borderRadius: '14px',
                          padding: '8px',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(16px)',
                          zIndex: 200,
                          fontFamily: 'Bebas Neue, sans-serif'
                        }}>
                          {/* Profile header */}
                          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{userProfile?.username || 'Player'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{currentUser?.email}</div>
                            {userProfile?.is_admin && (
                              <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.62rem', fontWeight: 'bold', background: 'rgba(251, 200, 13,0.15)', color: 'var(--neon-gold)', border: '1px solid rgba(251, 200, 13,0.35)', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.5px' }}>ADMIN</span>
                            )}
                          </div>

                          {/* Menu items */}
                          <button onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#ff8080', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 'bold', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px', transition: 'background 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,60,60,0.12)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <LogOut size={15} /><span>Sign Out</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(0,240,255,0.12)',
                    border: '1px solid rgba(0,240,255,0.4)',
                    color: 'var(--neon-cyan)',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '0.9rem', fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,240,255,0.22)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0,240,255,0.12)'}
                >
                  <User size={15} />Login / Play
                </button>
              )}
            </div>
            
            <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
            <StoreModal 
              isOpen={isStoreOpen} 
              onClose={() => setIsStoreOpen(false)} 
              userProfile={userProfile} 
              onPurchaseComplete={(amount) => {
                setUserProfile(prev => ({ ...prev, crystals_collected: (prev?.crystals_collected || 0) + amount }));
              }} 
            />


            <div className="menu-bg-elements" style={{ width: '100%', height: '100%' }}>
              <div className="neon-streak-red"></div>
              <div className="neon-streak-blue"></div>
              <div className="subtle-watermark-card left-wm"></div>
              <div className="subtle-watermark-card right-wm"></div>
            </div>
            <div className="game-brand-block" style={{ marginBottom: '60px', textAlign: 'center' }}>
              <div className="brand-pill-badge" style={{ margin: '0 auto 15px auto', fontSize: '1.2rem', padding: '6px 16px' }}>注意!</div>
              <h1 className="game-main-title">
                <span className="title-dance" style={{ fontSize: '4.5rem' }}>注意 TCG</span>
              </h1>
              <div className="brand-sub-row" style={{ justifyContent: 'center', marginTop: '10px' }}>
                <span className="brand-tcg-text" style={{ fontSize: '1.5rem', letterSpacing: '4px' }}>TCG COMPANION HUB</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', flexDirection: 'column', width: '100%', maxWidth: '800px', zIndex: 10 }}>
              <button className="btn-enter-game-cta" onClick={() => navigate('/chat')} style={{ width: '100%', padding: '30px 40px', borderRadius: '24px' }}>
                <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}><Bot size={48} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>TCG Chatbot</div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Chat Companion & Card Knowledge</div>
                </div>
              </button>

              <button
                className="btn-enter-game-cta"
                onClick={() => {
                  if (!canAccessModule('game', appSettings, userProfile)) {
                    setIsStoreOpen(true);
                    return;
                  }
                  try {
                    if (screen.orientation && screen.orientation.lock) {
                      screen.orientation.lock('landscape').catch(() => { });
                    }
                  } catch (e) { }
                  navigate('/game');
                }}
                disabled={!canAccessModule('game', appSettings, userProfile)}
                style={{ 
                  width: '100%', 
                  padding: '30px 40px', 
                  borderRadius: '24px', 
                  background: canAccessModule('game', appSettings, userProfile) 
                    ? 'linear-gradient(90deg, #0d1a38 0%, #050a18 100%)' 
                    : 'linear-gradient(90deg, rgba(13, 26, 56, 0.3) 0%, var(--bg-card) 100%)',
                  border: canAccessModule('game', appSettings, userProfile)
                    ? '2px solid var(--neon-cyan)'
                    : '2px solid rgba(0, 240, 255, 0.2)',
                  color: canAccessModule('game', appSettings, userProfile)
                    ? 'var(--neon-cyan)'
                    : 'rgba(0, 240, 255, 0.4)',
                  position: 'relative',
                  cursor: canAccessModule('game', appSettings, userProfile) ? 'pointer' : 'not-allowed',
                  opacity: canAccessModule('game', appSettings, userProfile) ? 1 : 0.6,
                  transition: 'all 0.3s ease'
                }}
              >
                {renderModuleBadge('game', appSettings, userProfile)}
                <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}><Swords size={48} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Score Calculator</div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Interactive Tabletop Simulator</div>
                </div>
              </button>

              <button
                className="btn-enter-game-cta"
                onClick={() => {
                  if (!canAccessModule('kontrola', appSettings, userProfile)) {
                    setIsStoreOpen(true);
                    return;
                  }
                  try {
                    if (screen.orientation && screen.orientation.lock) {
                      screen.orientation.lock('landscape').catch(() => { });
                    }
                  } catch (e) { }
                  navigate('/kontrola');
                }}
                disabled={!canAccessModule('kontrola', appSettings, userProfile)}
                style={{ 
                  width: '100%', 
                  padding: '30px 40px', 
                  borderRadius: '24px', 
                  background: canAccessModule('kontrola', appSettings, userProfile)
                    ? 'linear-gradient(90deg, #2a0845 0%, #6441A5 100%)'
                    : 'linear-gradient(90deg, rgba(42, 8, 69, 0.3) 0%, rgba(100, 65, 165, 0.3) 100%)',
                  border: canAccessModule('kontrola', appSettings, userProfile)
                    ? '2px solid #e0b0ff'
                    : '2px solid rgba(224, 176, 255, 0.2)',
                  color: canAccessModule('kontrola', appSettings, userProfile)
                    ? '#e0b0ff'
                    : 'rgba(224, 176, 255, 0.4)',
                  position: 'relative',
                  cursor: canAccessModule('kontrola', appSettings, userProfile) ? 'pointer' : 'not-allowed',
                  opacity: canAccessModule('kontrola', appSettings, userProfile) ? 1 : 0.6,
                  transition: 'all 0.3s ease'
                }}
              >
                {renderModuleBadge('kontrola', appSettings, userProfile)}
                <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}><Swords size={48} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Kontrola Game</div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Online Multiplayer Card Battles</div>
                </div>
              </button>

              {/* Music Upload Button — Show to all, disabled for non-PRO */}
              <button
                className="btn-enter-game-cta"
                onClick={() => {
                  setIsMusicModalOpen(true);
                }}
                disabled={!userProfile?.is_premium}
                style={{ 
                  width: '100%', 
                  padding: '25px 40px', 
                  borderRadius: '24px', 
                  background: userProfile?.is_premium 
                    ? 'linear-gradient(90deg, #1a0f2e 0%, #0f0820 100%)' 
                    : 'linear-gradient(90deg, rgba(26,15,46,0.3) 0%, rgba(15,8,32,0.3) 100%)', 
                  border: userProfile?.is_premium 
                    ? '2px solid rgba(168, 85, 247, 0.5)' 
                    : '2px solid rgba(168, 85, 247, 0.2)', 
                  color: userProfile?.is_premium ? '#c084fc' : 'rgba(192, 132, 252, 0.4)',
                  cursor: userProfile?.is_premium ? 'pointer' : 'not-allowed',
                  opacity: userProfile?.is_premium ? 1 : 0.6,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: '-14px', right: '24px',
                  background: 'linear-gradient(135deg, #1a0a00, #2d1500)',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: '2px solid var(--neon-gold)',
                  color: 'var(--neon-gold)',
                  fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.75rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '0.5px',
                  boxShadow: '0 0 12px rgba(251, 200, 13,0.25)',
                  pointerEvents: 'none'
                }}>
                  <span>👑 PRO ONLY</span>
                </div>
                {!userProfile?.is_premium && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '30px',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '2px solid var(--neon-gold)',
                    boxShadow: '0 0 16px rgba(251, 200, 13,0.3)'
                  }}>
                    <Lock size={24} style={{ color: 'var(--neon-gold)' }} />
                  </div>
                )}
                <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}><Music size={48} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Submit Music</div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>
                    {userProfile?.is_premium ? 'Share Tracks for Gameplay' : 'Upgrade to PRO to Share'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </DynamicScaleWrapper>
      </div>

      {/* Music Submission Modal */}
      {isMusicModalOpen && userProfile?.is_premium && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', border: '2px solid rgba(168, 85, 247, 0.5)', borderRadius: '20px', padding: '32px', boxShadow: '0 0 40px rgba(168,85,247,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#c084fc', margin: 0, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}>
                <Music size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} />
                Submit Music Track
              </h2>
              <button onClick={() => { setIsMusicModalOpen(false); setMusicTitle(''); setMusicFile(null); setMusicNotice(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
              </button>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '24px', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: '1.5' }}>
              Upload your music track for admin approval. Once approved, players can enjoy it during matches!
            </p>

            {musicNotice && (
              <div style={{ background: musicNotice.startsWith('✅') ? 'rgba(57,255,20,0.1)' : 'rgba(237, 30, 36,0.1)', border: `1px solid ${musicNotice.startsWith('✅') ? '#39ff14' : '#ff6b8f'}`, color: musicNotice.startsWith('✅') ? '#39ff14' : '#ff6b8f', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'Bebas Neue, sans-serif' }}>
                {musicNotice}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#c084fc', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '0.5px', fontFamily: 'Bebas Neue, sans-serif' }}>
                TRACK TITLE *
              </label>
              <input
                type="text"
                value={musicTitle}
                onChange={(e) => setMusicTitle(e.target.value)}
                placeholder="Epic Battle Theme"
                maxLength={100}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--bg-card)', border: '1.5px solid rgba(168,85,247,0.3)', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontFamily: 'Barlow Condensed, sans-serif' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#c084fc', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '0.5px', fontFamily: 'Bebas Neue, sans-serif' }}>
                AUDIO FILE *
              </label>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,.mp3,.wav,.ogg"
                onChange={(e) => setMusicFile(e.target.files[0])}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--bg-card)', border: '1.5px solid rgba(168,85,247,0.3)', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '6px', fontFamily: 'Barlow Condensed, sans-serif' }}>
                MP3, WAV, or OGG format. Maximum 10MB. {musicFile && `Selected: ${musicFile.name} (${(musicFile.size / 1024 / 1024).toFixed(2)} MB)`}
              </div>
            </div>

            <button
              onClick={async () => {
                if (!musicTitle.trim() || !musicFile) {
                  setMusicNotice('⚠️ Please provide both title and audio file.');
                  setTimeout(() => setMusicNotice(''), 3000);
                  return;
                }
                setMusicSubmitting(true);
                setIsMusicProgressOpen(true);
                setMusicUploadStatus('uploading');
                setMusicUploadMessage('');
                
                try {
                  const result = await musicService.uploadAndSubmitMusic(
                    currentUser.id, 
                    userProfile.username, 
                    musicTitle.trim(), 
                    musicFile,
                    () => {
                      // Don't update progress - just keep uploading state
                      // Progress bar was removed, so no need to track it
                    }
                  );
                  
                  if (result.success) {
                    setMusicUploadStatus('success');
                    setMusicUploadMessage('Track uploaded and submitted for approval!');
                    setTimeout(() => {
                      setIsMusicProgressOpen(false);
                      setIsMusicModalOpen(false);
                      setMusicTitle('');
                      setMusicFile(null);
                      setMusicNotice('');
                    }, 2000);
                  } else {
                    setMusicUploadStatus('error');
                    setMusicUploadMessage(result.message || 'Failed to upload.');
                  }
                } catch (e) {
                  console.error('Music upload error:', e);
                  setMusicUploadStatus('error');
                  setMusicUploadMessage(e.message || 'Error uploading track.');
                } finally {
                  setMusicSubmitting(false);
                }
              }}
              disabled={musicSubmitting}
              style={{ width: '100%', padding: '14px', background: musicSubmitting ? 'rgba(168,85,247,0.3)' : 'linear-gradient(90deg, #c084fc 0%, #a855f7 100%)', border: 'none', borderRadius: '12px', color: '#000', fontSize: '1.1rem', fontWeight: 'bold', cursor: musicSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}
            >
              {musicSubmitting ? 'UPLOADING...' : 'UPLOAD & SUBMIT FOR APPROVAL'}
            </button>
          </div>
        </div>
      )}

      {/* Player Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={async (u) => {
          setCurrentUser(u);
          if (u) {
            const prof = await authService.getProfile(u.id);
            setUserProfile(prof);
          }
        }}
      />

      {/* Music Upload Progress Modal */}
      <MusicUploadProgress
        isOpen={isMusicProgressOpen}
        title={musicTitle || 'Uploading Music'}
        progress={musicUploadProgress}
        status={musicUploadStatus}
        message={musicUploadMessage}
        onClose={() => {
          setIsMusicProgressOpen(false);
          if (musicUploadStatus !== 'uploading') {
            setMusicUploadProgress(0);
            setMusicUploadStatus('uploading');
            setMusicUploadMessage('');
          }
        }}
      />

      {/* Fixed Position: Contact Support Button (Bottom Right) - NOT on admin pages */}
      {currentUser && location.pathname !== '/admin' && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 99,
          animation: 'pulse 2s infinite'
        }}>
          <BugReportButton 
            userId={currentUser?.id}
            username={userProfile?.username || 'Guest'}
            style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00ffcc 100%)',
              border: 'none',
              padding: '14px 26px',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              boxShadow: '0 0 30px rgba(0, 255, 136, 0.6)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              color: '#001a33',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      )}
    </>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    authService.getCurrentUser().then(async (u) => {
      if (isMounted) {
        setCurrentUser(u);
        if (u) {
          const prof = await authService.getProfile(u.id);
          setUserProfile(prof);
          
          // Set up global error handlers for authenticated users
          setupGlobalErrorHandlers(u.id, prof?.username || prof?.display_name || 'Player');
        } else {
          // Set up global error handlers for guest users
          setupGlobalErrorHandlers(null, 'Guest Player');
        }
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session, profile) => {
      setCurrentUser(session?.user || null);
      setUserProfile(profile);
      
      // Update global error handlers when auth state changes
      if (session?.user && profile) {
        setupGlobalErrorHandlers(session.user.id, profile?.username || profile?.display_name || 'Player');
      } else {
        setupGlobalErrorHandlers(null, 'Guest Player');
      }
      
      setAuthLoading(false);
    });

    return () => { 
      if (isMounted) isMounted = false; 
      subscription?.unsubscribe(); 
    };
  }, []);

  // Full App Guard: requires authenticated player to access companion features
  const ProtectedRoute = ({ children }) => {
    if (authLoading) {
      return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 20%, #0d1a38 0%, #050a18 70%, #02040c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="brand-pill-badge" style={{ margin: '0 auto 12px auto', fontSize: '0.9rem', padding: '3px 12px' }}>注意!</div>
            <div style={{ fontSize: '1.3rem', letterSpacing: '2px', fontWeight: 'bold' }}>VERIFYING ACCESS...</div>
          </div>
        </div>
      );
    }
    if (userProfile?.is_banned) {
      return (
        <div style={{ minHeight: '100vh', width: '100vw', background: 'radial-gradient(circle at 50% 20%, #20050d 0%, #0d0205 70%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b8f', fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center', background: 'rgba(30, 8, 14, 0.92)', border: '2px solid var(--neon-crimson, #ED1E24)', borderRadius: '20px', padding: '36px 28px', boxShadow: '0 0 40px rgba(255, 42, 85, 0.3)' }}>
            <div className="brand-pill-badge" style={{ margin: '0 auto 12px auto', fontSize: '0.9rem', padding: '3px 12px', background: 'var(--neon-crimson, #ED1E24)', color: '#fff', border: 'none' }}>SUSPENDED</div>
            <div style={{ fontSize: '1.8rem', letterSpacing: '2px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>ACCOUNT SUSPENDED</div>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', fontFamily: 'var(--font-sub, "Barlow Condensed", sans-serif)', marginBottom: '24px' }}>
              Your account (<strong>{userProfile?.username || currentUser?.email}</strong>) has been suspended by the Game Masters due to rule violations or moderation action.
            </p>
            <button
              onClick={() => authService.signOut().then(() => { setCurrentUser(null); setUserProfile(null); })}
              style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid #ED1E24', background: 'rgba(237, 30, 36,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)', fontSize: '1rem' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
    if (!currentUser) {
      return (
        <AuthModal
          isOpen={true}
          preventClose={true}
          onAuthSuccess={async (u) => {
            setCurrentUser(u);
            if (u) {
              const prof = await authService.getProfile(u.id);
              setUserProfile(prof);
            }
          }}
        />
      );
    }
    return children;
  };

  return (
    <ErrorBoundary 
      userId={currentUser?.id || null}
      username={userProfile?.username || userProfile?.display_name || 'Player'}
      gameState={null}
      matchId={null}
    >
      <Routes>
        <Route path="/" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat onBack={() => navigate('/')} /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/kontrola" element={<ProtectedRoute><KontrolaArena /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/*" element={<DocsPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;



