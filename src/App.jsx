import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Send, X, Bot, Swords } from 'lucide-react';
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
  const imagePath = isSpeaking && currentVisemeFile
    ? `${import.meta.env.BASE_URL}${avatarConfig.talkDir}/${currentVisemeFile}`
    : isBlinking
      ? `${import.meta.env.BASE_URL}${avatarConfig.talkDir}/${closedViseme}`
      : `${import.meta.env.BASE_URL}${avatarConfig.idlePath}`;

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
    try {
      const cached = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (cached && CHAT_AVATARS[cached]) return cached;
    } catch (e) {
      console.warn('Failed reading avatar from localStorage:', e);
    }
    return 'chyna';
  });
  const [currentVisemeFile, setCurrentVisemeFile] = useState(() => {
    try {
      const cached = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (cached && CHAT_AVATARS[cached]) {
        return getVisemeFileForChar(cached, 'CLOSED');
      }
    } catch (e) { }
    return getVisemeFileForChar('chyna', 'CLOSED');
  });

  const handleSelectAvatar = (newAvatarId) => {
    if (newAvatarId === selectedAvatarId) return;
    stopSpeaking();
    setSelectedAvatarId(newAvatarId);
    setChatHistory([]);
    setDisplayedAnswer('');
    setAnswer('');
    setStatus('');

    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, newAvatarId);
    } catch (e) {
      console.warn('Failed saving avatar to localStorage:', e);
    }
    setCurrentVisemeFile(getVisemeFileForChar(newAvatarId, 'CLOSED'));

    // Automatically switch voice based on character gender
    if (availableVoices.length > 0) {
      let voice;
      if (newAvatarId === 'chyna') {
        // Chyna is male
        voice = availableVoices.find(v => v.name.toLowerCase().includes('male') || ['Daniel', 'Alex', 'Fred', 'David'].some(n => v.name.includes(n)));
      } else {
        // Others are female
        voice = availableVoices.find(v => v.name.toLowerCase().includes('female') || ['Samantha', 'Victoria', 'Karen', 'Zira'].some(n => v.name.includes(n)));
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
        // Prefer English voices with localService, fallback to all English voices
        let voices = allVoices.filter(v => v.lang.startsWith('en') && v.localService);
        if (voices.length === 0) {
          voices = allVoices.filter(v => v.lang.startsWith('en'));
        }
        if (voices.length === 0) {
          voices = allVoices;
        }
        setAvailableVoices(voices);
        // Set a smart default if none selected yet
        if (voices.length > 0 && !selectedVoiceURI) {
          let defaultVoice;
          if (selectedAvatarId === 'chyna') {
            defaultVoice = voices.find(v => v.name.toLowerCase().includes('male') || ['Daniel', 'Alex', 'Fred', 'David'].some(n => v.name.includes(n)));
          } else {
            defaultVoice = voices.find(v => v.name.toLowerCase().includes('female') || ['Samantha', 'Victoria', 'Karen', 'Zira'].some(n => v.name.includes(n)));
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
    fetch(`${import.meta.env.BASE_URL}Knowledge Base/AI_Breakdowns.txt`)
      .then(res => res.text())
      .then(text => setDocumentText(text))
      .catch(err => console.error("Could not load Knowledge Base/AI_Breakdowns.txt", err));
  }, []);
  const streamTimer = useRef(null);

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
      return "Hello warrior! I am your Attention TCG Companion AI. I'm ready for battle and here to help you navigate rules, character abilities, combat clashes, and Zombie Mode. What would you like to know?";
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

    for (const item of RULES_KNOWLEDGE) {
      let score = 0;
      for (const k of item.keywords) {
        if (qLower.includes(k)) {
          // Exact phrase or multi-word keyword gets much higher weight
          score += k.includes(' ') ? 5 : (k.length >= 5 ? 3 : 2);
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestKnowledge = item;
      }
    }

    if (bestKnowledge && highestScore >= 2) {
      return `${bestKnowledge.shortAnswer}\n\n${bestKnowledge.details}`;
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
            content: "You are the TCG Companion AI, a helpful, conversational, and enthusiastic game guide. Answer questions about the game rules naturally, as if chatting with a friend. DO NOT sound like a programmed bot and AVOID using long bulleted lists or formatting when possible. Keep it short, punchy, and conversational (1-3 sentences max). NEVER add new rules."
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
      // DO NOT setStatus('Answer received.') here, we want the dots to stay until speech actually starts.

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
          // Option A: Single Utterance with onboundary (exact sync from commit 36b89af)
          const utterance = new SpeechSynthesisUtterance(cleanAns);
          window.currentUtterance = utterance;
          applyVoiceToUtterance(utterance);

          let vInterval = null;
          let onboundaryFired = false;

          utterance.onstart = () => {
            usedTTS = true;
            setStatus('Answer received.'); // Remove dots and show text box
            setIsSpeaking(true);
            setIsAnimatingTalk(true);

            // Fallback for voices that don't support onboundary
            setTimeout(() => {
              if (!onboundaryFired) {
                startTextStream();
              }
            }, 500);
          };

          utterance.onboundary = (event) => {
            onboundaryFired = true;
            if (event.name === 'word') {
              if (vInterval) clearInterval(vInterval);

              let nextSpace = cleanAns.indexOf(' ', event.charIndex);
              if (nextSpace === -1) nextSpace = cleanAns.length;

              const wordStr = cleanAns.substring(event.charIndex, nextSpace);

              // Show text up to this word (using cleanAns to match index lengths)
              setDisplayedAnswer(cleanAns.substring(0, nextSpace));

              // Start visemes for this word
              let wordClean = wordStr.trim();
              // If it's just punctuation, close mouth immediately and wait
              if (/^[.,!?]+$/.test(wordClean)) {
                setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'CLOSED'));
                return;
              }

              setCurrentVisemeFile(getViseme(wordClean, 0, selectedAvatarId));

              // Limit to max 3 frames per word so it doesn't animate after the voice stops
              const maxFrames = Math.min(wordClean.length, 3);

              let vIdx = 0;
              vInterval = setInterval(() => {
                vIdx++;
                if (vIdx < maxFrames) {
                  const nextViseme = getViseme(wordClean, vIdx, selectedAvatarId);
                  // Forcing update on every letter to allow mid-word bouncing/blinking
                  setCurrentVisemeFile(nextViseme);
                } else {
                  // If the word ends with punctuation, close the mouth during the TTS pause
                  if (/[.,!?]$/.test(wordClean)) {
                    setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'CLOSED'));
                  }
                  clearInterval(vInterval);
                }
              }, 150);
            }
          };

          utterance.onend = () => {
            if (vInterval) clearInterval(vInterval);
            setIsSpeaking(false);
            setIsAnimatingTalk(false);
            setCurrentVisemeFile(getVisemeFileForChar(selectedAvatarId, 'SMILE'));
            setDisplayedAnswer(finalAns);
            window.currentUtterance = null;
          };

          utterance.onerror = () => {
            if (vInterval) clearInterval(vInterval);
            setIsSpeaking(false);
            setIsAnimatingTalk(false);
            setDisplayedAnswer(finalAns);
            window.currentUtterance = null;
          };

          if (window.speechSynthesis.getVoices().length > 0) {
            window.speechSynthesis.speak(utterance);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              window.speechSynthesis.speak(utterance);
              window.speechSynthesis.onvoiceschanged = null;
            };
          }

          // Fallback if TTS fails to start within 500ms
          setTimeout(() => {
            if (!usedTTS) startTextStream();
          }, 500);

        } else {
          // Option C: Hybrid Typewriter (current logic)
          const utterance = new SpeechSynthesisUtterance(cleanAns);
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
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="brand-pill-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>注意!</span> RULES BOT</h2>
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
          <button onClick={() => { stopSpeaking(); onBack(); }} style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', fontSize: '2rem', cursor: 'pointer', padding: '0 10px', lineHeight: '1' }}>×</button>
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
              <div className="thinking-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
          </div>

          {answer && (
            <div className="chat-response-container">
              <div className="chat-bubble bot" style={{ margin: 0, position: 'relative' }}>
                <div className="bot-avatar-icon" style={{ overflow: 'hidden' }}>
                  <img
                    src={`${(import.meta.env.BASE_URL || '/').endsWith('/') ? (import.meta.env.BASE_URL || '/') : (import.meta.env.BASE_URL + '/')}${CHAT_AVATARS[selectedAvatarId]?.idlePath || CHAT_AVATARS.chyna?.idlePath || 'Chatbot Characters/Chyna/Idle/SILENCE.png'}`}
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
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {isSpeaking ? displayedAnswer : answer}
                  {isSpeaking && <span className="cursor-blink">|</span>}
                </div>
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
                style={{ background: '#ff3366', color: '#fff', boxShadow: '0 0 15px rgba(255, 51, 102, 0.6)', flexShrink: 0 }}
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

  React.useLayoutEffect(() => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => { });
      }
    } catch (e) { }
  }, []);

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
          <div className="webgl-screen menu-screen" style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', padding: '0 40px', boxSizing: 'border-box' }}>
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
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>RULES BOT</div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Chat Companion & Card Knowledge</div>
                </div>
              </button>

              <button
                className="btn-enter-game-cta"
                onClick={() => {
                  try {
                    if (screen.orientation && screen.orientation.lock) {
                      screen.orientation.lock('landscape').catch(() => { });
                    }
                  } catch (e) { }
                  navigate('/game');
                }}
                style={{ width: '100%', padding: '30px 40px', borderRadius: '24px', background: 'linear-gradient(90deg, #0d1a38 0%, #050a18 100%)', border: '2px solid var(--neon-cyan)', color: 'var(--neon-cyan)' }}
              >
                <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}><Swords size={48} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>BATTLE ARENA</div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Interactive Tabletop Simulator</div>
                </div>
              </button>
            </div>
          </div>
        </DynamicScaleWrapper>
      </div>
    </>
  );
}

function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/chat" element={<Chat onBack={() => navigate('/')} />} />
      <Route path="/game" element={<GamePage />} />
    </Routes>
  );
}

export default App;
