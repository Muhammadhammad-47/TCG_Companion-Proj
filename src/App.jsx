import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './pages/GamePage.css';
import { presetQuestions } from './questions.js';
import GamePage from './pages/GamePage.jsx';

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
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(ans);
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsAnimatingTalk(true);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsAnimatingTalk(false);
          setDisplayedAnswer(ans);
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsAnimatingTalk(false);
        };
        
        let pauseTimeout;
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const nextSpace = ans.indexOf(' ', event.charIndex);
            const endIndex = nextSpace !== -1 ? nextSpace : ans.length;
            setDisplayedAnswer(ans.substring(0, endIndex));
            
            setIsAnimatingTalk(true);
            
            const charBefore = ans.substring(event.charIndex - 1, event.charIndex);
            if (['.', ',', '!', '?', ';'].includes(charBefore)) {
              setIsAnimatingTalk(false);
              clearTimeout(pauseTimeout);
              pauseTimeout = setTimeout(() => {
                setIsAnimatingTalk(true);
              }, 400);
            }
          }
        };
        
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

  return (
    <div className="webgl-canvas-frame">
      <div className="webgl-screen menu-screen" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="menu-bg-elements" style={{ zIndex: 0 }}>
          <div className="neon-streak-red"></div>
          <div className="neon-streak-blue"></div>
          <div className="subtle-watermark-card left-wm"></div>
          <div className="subtle-watermark-card right-wm"></div>
        </div>

        <header className="top-nav" style={{ position: 'relative', zIndex: 10, background: 'rgba(5, 10, 24, 0.8)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        <div className="chatgpt-layout" style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
        
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

        <div className="canvas-wrapper" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '0 50px' }}>
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', transition: 'all 0.5s ease' }}>
            <Avatar isSpeaking={isAnimatingTalk} />
          </div>

          {answer && (
            <div style={{ flex: '0 1 600px', animation: 'fadeIn 0.5s ease' }}>
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

      <div className="bottom-input-area">
        <div className="input-container">
          <textarea 
            className="chat-textarea"
            rows={1}
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isSpeaking) {
                e.preventDefault();
                askQuestion();
              }
            }}
            placeholder="Ask a rule question (e.g. What is Kiko's weakness?)"
            disabled={isSpeaking}
          />
          {!isSpeaking ? (
            <button className="send-button" onClick={() => askQuestion()}>➤</button>
          ) : (
            <button 
              className="send-button" 
              onClick={stopSpeaking} 
              style={{ background: '#ff3366', color: '#fff', boxShadow: '0 0 15px rgba(255, 51, 102, 0.6)' }}
              title="Stop Speaking"
            >
              ⏹
            </button>
          )}
        </div>
        {status && <div className="status-indicator">{status}</div>}
      </div>
    </div>
    </div>
  );
}

export function Hub() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch((e) => console.log('Orientation lock failed:', e));
      }
    } catch (e) {
      console.log('Orientation API not supported');
    }
  }, []);

  return (
    <div className="webgl-canvas-frame">
      <div className="webgl-screen menu-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="menu-bg-elements">
          <div className="neon-streak-red"></div>
          <div className="neon-streak-blue"></div>
          <div className="subtle-watermark-card left-wm"></div>
          <div className="subtle-watermark-card right-wm"></div>
        </div>
        
        <div className="game-brand-block" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div className="brand-pill-badge" style={{ margin: '0 auto 15px auto' }}>注意!</div>
          <h1 className="game-main-title">
            <span className="title-dance">注意 TCG</span>
          </h1>
          <div className="brand-sub-row" style={{ justifyContent: 'center' }}>
            <span className="brand-tcg-text">TCG COMPANION HUB</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', width: '100%', maxWidth: '400px', zIndex: 10 }}>
          <button className="btn-enter-game-cta" onClick={() => navigate('/chat')} style={{ width: '100%', padding: '20px' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🤖</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>RULES BOT</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>Chat Companion & Card Knowledge</div>
            </div>
          </button>

          <button className="btn-enter-game-cta" onClick={() => navigate('/game')} style={{ width: '100%', padding: '20px', background: 'linear-gradient(90deg, #0d1a38 0%, #050a18 100%)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>⚔️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>BATTLE ARENA</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>Interactive Tabletop Simulator</div>
            </div>
          </button>
        </div>
      </div>
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
