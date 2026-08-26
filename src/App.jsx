import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Send, X } from 'lucide-react';
import axios from 'axios';
import './App.css';
import './pages/GamePage.css';
import { presetQuestions } from './questions.js';
import GamePage from './pages/GamePage.jsx';
import { ScaleWrapper } from './components/ScaleWrapper.jsx';

const Avatar = ({ isSpeaking }) => {
  const [index, setIndex] = useState(0);

  const idleSequence = [
    { folder: 'Idle', frame: 1 },
    { folder: 'Idle', frame: 2 }
  ];

  const talkSequence = [
    { folder: 'Talk', frame: 2 },
    { folder: 'Talk', frame: 3 },
    { folder: 'Talk', frame: 1 },
    { folder: 'Talk', frame: 4 },
    { folder: 'Idle', frame: 3 },
    { folder: 'Idle', frame: 4 }
  ];

  const sequence = isSpeaking ? talkSequence : idleSequence;

  useEffect(() => {
    setIndex(0);
  }, [isSpeaking]);

  useEffect(() => {
    const speed = isSpeaking ? 300 : 600;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % sequence.length);
    }, speed);

    return () => clearInterval(interval);
  }, [isSpeaking, sequence.length]);

  const current = sequence[index] || sequence[0];
  const imagePath = `${import.meta.env.BASE_URL}Character/${current.folder}/${current.frame}.png`;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <img 
        src={imagePath} 
        alt="Avatar" 
        style={{ 
          maxWidth: '80%', 
          maxHeight: '80%', 
          objectFit: 'contain', 
          filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))',
          transition: 'all 0.2s ease'
        }} 
      />
    </div>
  );
};

export function Chat({ onBack }) {
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

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}document.txt`)
      .then(res => res.text())
      .then(text => setDocumentText(text))
      .catch(err => console.error("Could not load document.txt", err));
  }, []);

  const localSearch = (query) => {
    const qLower = query.toLowerCase();
    
    if (qLower.match(/^(hi|hello|hey|greetings)/)) return "Hello! I am your Attention TCG Companion. How can I help you with the rules today?";
    if (qLower.match(/(how are you|how do you do)/)) return "I am functioning optimally and ready to assist you with the game rules!";
    if (qLower.match(/(who are you|introduce yourself|what are you)/)) return "I am the official Attention TCG Companion bot. I know all the rules and character stats to help you play the game smoothly.";
    
    if (!documentText) return "I am still loading the rulebook. Please wait a moment.";
    
    const paragraphs = documentText.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const words = qLower.split(' ').filter(w => w.length > 2);
    
    let bestMatch = "";
    let maxScore = 0;
    
    for (let p of paragraphs) {
      let score = 0;
      const pLower = p.toLowerCase();
      for (let w of words) {
        if (pLower.includes(w)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = p;
      }
    }
    
    if (maxScore > 0) {
      const cleanMatch = bestMatch.trim().replace(/\n/g, ' ');
      // Return the full matched rule without any truncation
      return cleanMatch;
    }
    
    return "I couldn't find a specific answer in the rulebook.";
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
      
      // Start text streaming & visual animation
      setIsSpeaking(true);
      setIsAnimatingTalk(true);
      let i = 0;
      
      if (streamTimer.current) clearInterval(streamTimer.current);
      
      streamTimer.current = setInterval(() => {
        i++;
        setDisplayedAnswer(ans.substring(0, i));
        
        // Randomly pause animation to look natural
        if (i % 15 === 0) {
          setIsAnimatingTalk(false);
          setTimeout(() => { if (isSpeaking) setIsAnimatingTalk(true); }, 200);
        }
        
        if (i >= ans.length) {
          clearInterval(streamTimer.current);
          setIsSpeaking(false);
          setIsAnimatingTalk(false);
        }
      }, 35); // 35ms per char

      // Fire off TTS (Best effort, won't block visuals if it fails on mobile)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(ans);
        window.speechSynthesis.speak(utterance);
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
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch(e) {}
  }, []);

  return (
    <div className="webgl-canvas-frame portrait-mode">
      <ScaleWrapper targetWidth={1080} targetHeight={1920}>
      <div className="webgl-screen menu-screen" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', alignItems: 'stretch' }}>
        <div className="menu-bg-elements" style={{ zIndex: 0 }}>
          <div className="neon-streak-red"></div>
          <div className="neon-streak-blue"></div>
          <div className="subtle-watermark-card left-wm"></div>
          <div className="subtle-watermark-card right-wm"></div>
        </div>

        <header className="top-nav" style={{ width: '100%', boxSizing: 'border-box' }}>
          <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="burger-button" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
            <div className="nav-logo" style={{ color: 'var(--text-light)', fontFamily: 'Orbitron, sans-serif' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="brand-pill-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>注意!</span> RULES BOT</h2>
            </div>
          </div>
          <div className="nav-right" style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => { stopSpeaking(); onBack(); }} style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', fontSize: '2rem', cursor: 'pointer', padding: '0 15px', lineHeight: '1' }}>×</button>
          </div>
        </header>

        <div className="chatgpt-layout" style={{ position: 'relative', zIndex: 10, background: 'transparent', width: '100%', alignItems: 'stretch' }}>
        
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

        <div className="canvas-wrapper chat-canvas-layout" style={{ width: '100%', alignItems: 'stretch', padding: '0' }}>
          <div className="chat-avatar-container">
            <Avatar isSpeaking={isAnimatingTalk} />
          </div>

          {answer && (
            <div className="chat-response-container">
              <div className="chat-bubble bot" style={{ margin: 0, position: 'relative' }}>
                <div className="bot-avatar-icon">🤖</div>
                <div>
                  {isSpeaking ? displayedAnswer : answer}
                  {isSpeaking && <span className="cursor-blink">|</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-input-area" style={{ width: '100%' }}>
        <div className="input-container" style={{ width: '95%', maxWidth: 'none' }}>
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
              style={{ background: '#ff3366', color: '#fff', boxShadow: '0 0 15px rgba(255, 51, 102, 0.6)' }}
              title="Stop Speaking"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {status && <div className="status-indicator">{status}</div>}
      </div>
      </div>
      </ScaleWrapper>
    </div>
  );
}

export function Hub() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) {}
  }, []);

  return (
    <div className="webgl-canvas-frame portrait-mode">
      <ScaleWrapper targetWidth={1080} targetHeight={1920}>
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
              <span className="title-dance" style={{ fontSize: '4.5rem' }}>✨ TCG</span>
            </h1>
            <div className="brand-sub-row" style={{ justifyContent: 'center', marginTop: '10px' }}>
              <span className="brand-tcg-text" style={{ fontSize: '1.5rem', letterSpacing: '4px' }}>TCG COMPANION HUB</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '30px', flexDirection: 'column', width: '100%', maxWidth: '800px', zIndex: 10 }}>
            <button className="btn-enter-game-cta" onClick={() => navigate('/chat')} style={{ width: '100%', padding: '30px 40px', borderRadius: '24px' }}>
              <span style={{ fontSize: '3rem', marginRight: '20px' }}>🤖</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>RULES BOT</div>
                <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Chat Companion & Card Knowledge</div>
              </div>
            </button>

            <button className="btn-enter-game-cta" onClick={() => navigate('/game')} style={{ width: '100%', padding: '30px 40px', borderRadius: '24px', background: 'linear-gradient(90deg, #0d1a38 0%, #050a18 100%)', border: '2px solid var(--neon-cyan)', color: 'var(--neon-cyan)' }}>
              <span style={{ fontSize: '3rem', marginRight: '20px' }}>⚔️</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>BATTLE ARENA</div>
                <div style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 'normal' }}>Interactive Tabletop Simulator</div>
              </div>
            </button>
          </div>
        </div>
      </ScaleWrapper>
    </div>
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
