import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { presetQuestions } from './questions.js';

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
  const imagePath = `/Character/${current.folder}/${current.frame}.png`;

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

function App() {
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
    fetch('document.txt')
      .then(res => res.text())
      .then(text => setDocumentText(text))
      .catch(err => console.error("Could not load document.txt", err));
  }, []);

  const localSearch = (query) => {
    const qLower = query.toLowerCase();
    
    // Conversational rules
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

  const handleDocumentUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('document', selectedFile);

    setStatus('Uploading document...');
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      setStatus('Document uploaded successfully!');
    } catch (err) {
      console.error(err);
      setStatus('Error uploading document.');
    }
  };

  const askQuestion = async (q) => {
    const query = q || question;
    if (!query) return;
    setStatus('Asking question...');
    setQuestion(''); // Clear input
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
          setDisplayedAnswer(ans); // Ensure full text is shown at the end
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsAnimatingTalk(false);
        };
        
        let pauseTimeout;
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            // Display text up to the current word boundary + the word length
            // charLength isn't strictly standard, but if it exists we use it, else we find the next space.
            const nextSpace = ans.indexOf(' ', event.charIndex);
            const endIndex = nextSpace !== -1 ? nextSpace : ans.length;
            setDisplayedAnswer(ans.substring(0, endIndex));
            
            // Resume talking animation if it was paused
            setIsAnimatingTalk(true);
            
            // If there's punctuation, temporarily pause the animation for a fraction of a second
            const charBefore = ans.substring(event.charIndex - 1, event.charIndex);
            if (['.', ',', '!', '?', ';'].includes(charBefore)) {
              setIsAnimatingTalk(false);
              clearTimeout(pauseTimeout);
              pauseTimeout = setTimeout(() => {
                setIsAnimatingTalk(true);
              }, 400); // Resume after 400ms
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
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="burger-button" onClick={toggleSidebar}>☰</button>
          <div className="nav-logo">
            <h2>注意 TCG Companion</h2>
          </div>
        </div>
      </header>

      <div className="main-content chatgpt-layout" style={{ flexDirection: 'row' }}>
        
        {/* Overlay for Sidebar */}
        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar Menu */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0' }}>Common Questions</h3>
            <button className="close-sidebar" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ul className="preset-list" style={{ maxHeight: 'none' }}>
              {presetQuestions.map((q, idx) => (
                <li key={idx} onClick={() => handlePresetClick(q)} className="preset-item">
                  {q}
                </li>
              ))}
            </ul>

            {chatHistory.length > 0 && (
              <div className="chat-history" style={{ marginTop: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px', marginBottom: '15px', color: '#58a6ff' }}>Chat History</h3>
                <ul className="preset-list" style={{ maxHeight: 'none' }}>
                  {chatHistory.map((item, idx) => (
                    <li key={idx} className="preset-item" style={{ cursor: 'default', background: 'transparent', border: 'none', padding: '0 0 15px 0' }}>
                      <strong style={{ color: '#ffd700', display: 'block', marginBottom: '5px' }}>Q: {item.q}</strong>
                      <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>A: {item.a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 2D Canvas Area */}
        <div className="canvas-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: isSpeaking ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', padding: '0 40px' }}>
          
          <div className="avatar-side" style={{ flex: isSpeaking ? '0 0 40%' : 'none', display: 'flex', justifyContent: isSpeaking ? 'flex-end' : 'center', transition: 'all 0.5s ease', paddingRight: isSpeaking ? '40px' : '0' }}>
            <Avatar isSpeaking={isAnimatingTalk} />
          </div>

          {/* Right Side Text Area when speaking */}
          {isSpeaking && (
            <div className="text-side" style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', maxWidth: '60%', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ background: 'rgba(22, 27, 34, 0.95)', border: '1px solid #ffd700', borderRadius: '12px', padding: '25px', boxShadow: '0 8px 25px rgba(0,0,0,0.6), 0 0 15px rgba(255, 215, 0, 0.15)', color: '#fff', fontSize: '1.4rem', lineHeight: '1.6', wordWrap: 'break-word', width: '100%' }}>
                {displayedAnswer}
                <span className="cursor-blink">|</span>
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
              className="stop-button" 
              onClick={stopSpeaking} 
              style={{ background: '#d73a49', color: '#fff', border: 'none', borderRadius: '50%', width: '45px', height: '45px', marginLeft: '10px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(215, 58, 73, 0.4)' }}
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

export default App;
