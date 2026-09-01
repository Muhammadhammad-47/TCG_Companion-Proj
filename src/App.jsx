import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Send, X, Bot, Swords } from 'lucide-react';
import axios from 'axios';
import './App.css';
import './pages/GamePage.css';
import { presetQuestions } from './questions.js';
import GamePage from './pages/GamePage.jsx';
import { ScaleWrapper } from './components/ScaleWrapper.jsx';
import { DynamicScaleWrapper } from './components/DynamicScaleWrapper.jsx';

import { RULES_KNOWLEDGE } from './game/data/rulesKnowledge.js';

const getViseme = (text, index) => {
  if (!text || index < 0 || index >= text.length) return 'CLOSED (BLINK).png';
  const char = text[index].toLowerCase();
  const nextChar = index + 1 < text.length ? text[index + 1].toLowerCase() : '';
  const digraph = char + nextChar;

  // Digraphs
  if (['ch', 'sh'].includes(digraph)) return 'CH, J, SH.png';
  if (digraph === 'ee') return 'EE.png';
  if (digraph === 'oo') return 'OO.png';
  if (digraph === 'th') return 'TH.png';
  if (digraph === 'ay') return 'AY.png';
  if (digraph === 'ai') return 'AI.png';
  if (digraph === 'ow') return 'OW.png';
  if (digraph === 'oh') return 'OH.png';

  // Single characters
  if (['b', 'p'].includes(char)) return 'B, P.png';
  if (char === 'm') return 'M.png';
  if (['d', 't', 'n', 'k', 'g', 'c'].includes(char)) return 'D, T, N, K, G.png';
  if (['f', 'v'].includes(char)) return 'F, V.png';
  if (char === 'l') return 'L.png';
  if (char === 'r') return 'R.png';
  if (['s', 'z', 'x'].includes(char)) return 'S, Z.png';
  if (['w', 'q'].includes(char)) return 'W, Q.png';
  if (char === 'j') return 'CH, J, SH.png';
  if (char === 'y') return 'Y.png';
  if (['a', 'i'].includes(char)) return 'A, I.png';
  if (char === 'e') return 'E.png';
  if (char === 'o') return 'O.png';
  if (char === 'u') return 'U.png';

  // Punctuation / Spacing
  if ([' ', '.', ',', '!', '?'].includes(char)) return 'CLOSED (BLINK).png';

  return 'CLOSED (BLINK).png';
};

const Avatar = ({ isSpeaking, currentVisemeFile }) => {
  const imagePath = isSpeaking && currentVisemeFile
    ? `${import.meta.env.BASE_URL}Chatbot Characters/Chyna/MouthShapes/${currentVisemeFile}`
    : `${import.meta.env.BASE_URL}Chatbot Characters/Chyna/Idle/SILENCE.png`;

  // Dynamically calculate ring scale based on how open the mouth is
  let ringScale = 1.0;
  if (isSpeaking && currentVisemeFile) {
    const v = currentVisemeFile.toUpperCase();
    if (v.includes('A.PNG') || v.includes('E.PNG') || v.includes('O.PNG') || v.includes('WQ.PNG')) {
      ringScale = 1.25; // wide open
    } else if (v.includes('U.PNG') || v.includes('I.PNG') || v.includes('L.PNG') || v.includes('MBP.PNG')) {
      ringScale = 1.15; // partially open
    } else if (v.includes('CLOSED')) {
      ringScale = 1.0;  // closed
    } else {
      ringScale = 1.08; // other consonants
    }
  }

  return (
    <div className={`avatar-gemini-container ${isSpeaking ? 'is-speaking' : ''}`}>
      <div 
        className="avatar-gemini-ring-wrapper" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          transform: `scale(${ringScale})`, 
          transition: 'transform 0.1s ease-out' 
        }}
      >
        <div className="avatar-gemini-ring"></div>
      </div>
      <div className="avatar-gemini-mask">
        <img 
          src={imagePath} 
          alt="Avatar" 
          className="avatar-gemini-image"
        />
      </div>
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
  const [currentVisemeFile, setCurrentVisemeFile] = useState('CLOSED (BLINK).png');

  // Load available system voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        // Filter to English voices AND ensure they are locally processed (network voices often don't support boundary events)
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en') && v.localService);
        setAvailableVoices(voices);
        // Set a smart default if none selected yet
        if (voices.length > 0 && !selectedVoiceURI) {
          const defaultVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Zira')) || voices[0];
          if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}document.txt`)
      .then(res => res.text())
      .then(text => setDocumentText(text))
      .catch(err => console.error("Could not load document.txt", err));
  }, []);
  const localSearch = (query) => {
    const qLower = query.toLowerCase().trim();
    if (!qLower) return "Please ask a question about Attention TCG rules, combat dice, character moves, or Zombie mode!";

    if (qLower.match(/^(hi|hello|hey|greetings|start)/)) return "Hello warrior! I am your Attention TCG Rules & Strategy Assistant. Ask me anything about character moves, 2-dice combat, Energy Tokens, Zombie mode, or card effects!";
    if (qLower.match(/(how are you|how do you do)/)) return "I am running at peak combat readiness and ready to clarify any Attention TCG tournament rules or match rulings!";
    if (qLower.match(/(who are you|introduce yourself|what are you)/)) return "I am the official Attention TCG Companion AI. I have the entire GDD rulebook, character stats, DP defense math, and Zombie mode mechanics in my memory to assist your duels!";

    // 1. Scored Knowledge Pack Matching
    let bestKnowledge = null;
    let highestScore = 0;

    for (const item of RULES_KNOWLEDGE) {
      let score = 0;
      for (const k of item.keywords) {
        if (qLower.includes(k)) {
          score += k.length >= 5 ? 3 : 2;
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

    // 2. Fallback rulebook document paragraph search
    if (documentText) {
      const paragraphs = documentText.split(/\n\s*\n/).filter(p => p.trim() !== '');
      const queryTokens = qLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);

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

    // Default guidance
    return "I couldn't find an exact rule match for that query. You can ask me about:\n• 2-Stage Clash & DP Defense (rolling 6+ on Gold dice)\n• Zombie Mode (transformation, 40 HP, +10 regen, revival tiers)\n• Energy Tokens & Claims (5 starting ET, Use It or Lose It rule)\n• Saigo No Blitz (200 AP, HP < 50 condition)\n• Mind Strength & Kontrol Card rules\n• Character Move Sets & Elemental Weaknesses";
  };
  const streamTimer = useRef(null);

  const askQuestion = async (q) => {
    const query = q || question;
    if (!query) return;
    setStatus('Asking question...');
    setQuestion('');
    setDisplayedAnswer('');

    try {
      const ans = localSearch(query);
      setAnswer(ans);
      setChatHistory(prev => [...prev, { q: query, a: ans }]);
      setStatus('Answer received.');

      // Clean answer for TTS — use equal-length replacements so charIndex maps perfectly 1:1
      const cleanForTTS = (text) => text
        .replace(/[【】•·*]/g, ' ')        // remove special brackets, bullets, and asterisks
        .replace(/\n\n/g, '. ')           // double newlines (2 chars) → '. ' (2 chars) for pause
        .replace(/\n/g, ' ');             // single newlines → space

      const cleanAns = cleanForTTS(ans);

      // Visual prep, but don't start typing until the voice starts!
      setIsSpeaking(true);
      setIsAnimatingTalk(true);

      if (streamTimer.current) clearInterval(streamTimer.current);

      let usedTTS = false;
      const startTextStream = () => {
        let i = 0;
        const msPerChar = 65; // Matches rate 0.9
        streamTimer.current = setInterval(() => {
          i++;
          setDisplayedAnswer(ans.substring(0, i));
          setCurrentVisemeFile(getViseme(ans, i - 1));

          if (i % 20 === 0 || ['.', ',', '!'].includes(ans[i - 1])) {
            setIsAnimatingTalk(false);
            setCurrentVisemeFile('CLOSED (BLINK).png');
            setTimeout(() => { if (i < ans.length) setIsAnimatingTalk(true); }, 150);
          }

          if (i >= ans.length) {
            clearInterval(streamTimer.current);
            setIsSpeaking(false);
            setIsAnimatingTalk(false);
            setCurrentVisemeFile('SMILE.png');
          }
        }, msPerChar);
      };

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const applyVoiceToUtterance = (utt) => {
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || voices[0];
          if (voice) {
            utt.voice = voice;
            const isMale = voice.name.toLowerCase().includes('male') || ['Daniel', 'Alex', 'Fred', 'David'].some(n => voice.name.includes(n));
            utt.pitch = isMale ? 1.0 : 1.2;
          }
          utt.rate = 0.9;
          utt.volume = 1.0;
        };

        if (useExactSync) {
          // Option A: Single Utterance with onboundary
          const utterance = new SpeechSynthesisUtterance(cleanAns);
          applyVoiceToUtterance(utterance);

          let vInterval = null;
          let onboundaryFired = false;

          utterance.onstart = () => {
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

              // Show text up to this word
              setDisplayedAnswer(ans.substring(0, nextSpace));

              // Start visemes for this word
              let wordClean = wordStr.trim();
              // If it's just punctuation, close mouth immediately and wait
              if (/^[.,!?]+$/.test(wordClean)) {
                 setCurrentVisemeFile('CLOSED (BLINK).png');
                 return;
              }

              setCurrentVisemeFile(getViseme(wordClean, 0));

              // Limit to max 3 frames per word so it doesn't animate after the voice stops
              const maxFrames = Math.min(wordClean.length, 3);

              let vIdx = 0;
              vInterval = setInterval(() => {
                vIdx++;
                if (vIdx < maxFrames) {
                  const nextViseme = getViseme(wordClean, vIdx);
                  // Forcing update on every letter to allow mid-word bouncing/blinking
                  setCurrentVisemeFile(nextViseme);
                } else {
                  // If the word ends with punctuation, close the mouth during the TTS pause
                  if (/[.,!?]$/.test(wordClean)) {
                     setCurrentVisemeFile('CLOSED (BLINK).png');
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
            setCurrentVisemeFile('SMILE.png');
            setDisplayedAnswer(ans);
          };

          utterance.onerror = () => {
            if (vInterval) clearInterval(vInterval);
            setIsSpeaking(false);
            setIsAnimatingTalk(false);
            setDisplayedAnswer(ans);
          };

          if (window.speechSynthesis.getVoices().length > 0) {
            window.speechSynthesis.speak(utterance);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              window.speechSynthesis.speak(utterance);
              window.speechSynthesis.onvoiceschanged = null;
            };
          }

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
    setIsSpeaking(false);
    setIsAnimatingTalk(false);
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

      <header className="top-nav" style={{ width: layoutWidth, boxSizing: 'border-box' }}>
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="burger-button" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
          <div className="nav-logo" style={{ color: 'var(--text-light)', fontFamily: 'Orbitron, sans-serif' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="brand-pill-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>注意!</span> RULES BOT</h2>
          </div>
        </div>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <select
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--text-light)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              fontFamily: 'Orbitron, sans-serif',
              outline: 'none',
              maxWidth: '180px',
              textOverflow: 'ellipsis'
            }}
          >
            {availableVoices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </option>
            ))}
          </select>
          <button onClick={() => { stopSpeaking(); onBack(); }} style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', fontSize: '2rem', cursor: 'pointer', padding: '0 15px', lineHeight: '1' }}>×</button>
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
            <Avatar isSpeaking={isAnimatingTalk} currentVisemeFile={currentVisemeFile} />
          </div>

          {answer && (
            <div className="chat-response-container">
              <div className="chat-bubble bot" style={{ margin: 0, position: 'relative' }}>
                <div className="bot-avatar-icon"><Bot size={24} color="var(--neon-cyan)" /></div>
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
