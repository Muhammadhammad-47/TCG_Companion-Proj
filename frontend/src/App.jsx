import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
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

function Chat({ onBack }) {
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
      const firstSentence = cleanMatch.split('.')[0] + '.';
      return firstSentence.length > 10 ? firstSentence : cleanMatch.substring(0, 100) + '...';
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
    <div className="App">
      <header className="top-nav">
        <div className="nav-left">
          <button className="burger-button" onClick={toggleSidebar}>☰</button>
          <button className="back-button" onClick={onBack}>⮌ EXIT TO HUB</button>
          <div className="nav-logo">
            <h2>注意 RULES BOT</h2>
          </div>
        </div>
      </header>

      <div className="chatgpt-layout">
        
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

        <div className="canvas-wrapper">
          <div style={{ flex: answer ? '0 0 40%' : 'none', display: 'flex', justifyContent: 'center', transition: 'all 0.5s ease', height: answer ? '50%' : '60%' }}>
            <Avatar isSpeaking={isAnimatingTalk} />
          </div>

          {answer && (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', animation: 'fadeIn 0.5s ease' }}>
              <div className="chat-bubble bot">
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askQuestion();
              }
            }}
            placeholder="Ask a rule question (e.g. What is Kiko's weakness?)"
          />
          <button className="send-button" onClick={() => askQuestion()}>➤</button>
          {isSpeaking && (
            <button 
              className="send-button" 
              onClick={stopSpeaking} 
              style={{ background: 'var(--accent-red)' }}
              title="Stop Speaking"
            >
              ⏹
            </button>
          )}
        </div>
        {status && <div className="status-indicator">{status}</div>}
      </div>
    </div>
  );
}

function Hub() {
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
    <>
      <div className="force-orientation-overlay force-portrait-overlay">
        <div className="icon">📱</div>
        <h2>Please Rotate Your Device</h2>
        <p>The Chat Companion is designed for Portrait mode.</p>
      </div>
      <div className="App hub-container">
        <div className="hub-brand">
          <div className="hub-badge">注意!</div>
          <h1 className="hub-title">DANCE WITH MII!</h1>
          <div className="hub-subtitle">TCG COMPANION HUB</div>
        </div>
        
        <div className="hub-grid">
          <div className="hub-btn" onClick={() => navigate('/chat')}>
            <div className="icon">🤖</div>
            <div>
              <h3>RULES BOT</h3>
              <p>Chat Companion & Card Knowledge</p>
            </div>
          </div>

          <div className="hub-btn" onClick={() => navigate('/game')}>
            <div className="icon">⚔️</div>
            <div>
              <h3>BATTLE ARENA</h3>
              <p>Interactive Tabletop Simulator</p>
            </div>
          </div>
        </div>
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
