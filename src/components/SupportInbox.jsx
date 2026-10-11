import React, { useState, useEffect, useRef } from 'react';
import { supportService } from '../services/supportService';
import { supabase } from '../services/supabaseClient';
import { X, Send, Plus, ChevronLeft, Image, Loader } from 'lucide-react';

// ── Upload screenshot ────────────────────────────────────────────────────────
async function uploadScreenshot(file, userId) {
  try {
    const ext  = (file.name.split('.').pop()) || 'png';
    const name = `support-${Date.now()}-${userId}.${ext}`;
    const { error } = await supabase.storage
      .from('bug-screenshots')
      .upload(name, file, { contentType: file.type || 'image/png', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('bug-screenshots').getPublicUrl(name);
    return data?.publicUrl || null;
  } catch (err) {
    console.error('[SupportInbox] upload failed:', err);
    return null;
  }
}

const STATUS_COLORS = {
  open:        '#FBC80D',
  in_progress: '#00c8ff',
  resolved:    '#39ff14',
  closed:      'rgba(255,255,255,0.35)',
};

export default function SupportInbox({ userId, isOpen, onClose }) {
  const [view,          setView]          = useState('list');   // 'list' | 'chat' | 'new'
  const [tickets,       setTickets]       = useState([]);
  const [active,        setActive]        = useState(null);
  const [reply,         setReply]         = useState('');
  const [newSubject,    setNewSubject]     = useState('');
  const [newMessage,    setNewMessage]     = useState('');
  const [screenshot,    setScreenshot]    = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [sending,       setSending]       = useState(false);
  const [uploadingImg,  setUploadingImg]  = useState(false);
  const [error,         setError]         = useState('');
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);

  useEffect(() => { if (isOpen && userId) load(); }, [isOpen, userId]);

  // poll active ticket every 5 s
  useEffect(() => {
    if (!isOpen || !active) return;
    const t = setInterval(async () => {
      const u = await supportService.getSupportTicketWithReplies(active.id).catch(() => null);
      if (u) { setActive(u); setTickets(p => p.map(x => x.id === u.id ? u : x)); }
    }, 5000);
    return () => clearInterval(t);
  }, [isOpen, active?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    [active?.support_replies?.length]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await supportService.getPlayerSupportTickets(userId);
      setTickets(data);
      if (data.length > 0 && !active) { setActive(data[0]); setView('chat'); }
      else if (data.length === 0)      setView('new');
    } catch {/* ignore */} finally { setLoading(false); }
  };

  const pickFile = e => {
    const f = e.target.files?.[0]; if (!f) return;
    setScreenshot(f);
    const r = new FileReader();
    r.onload = ev => setPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const clearFile = () => { setScreenshot(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const submitTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setError(''); setSending(true);
    try {
      let imgUrl = null;
      if (screenshot) { setUploadingImg(true); imgUrl = await uploadScreenshot(screenshot, userId); setUploadingImg(false); }
      const t = await supportService.createSupportTicket(userId, newSubject.trim(), newMessage.trim(), imgUrl);
      if (!t) { setError('Failed to submit. Please try again.'); return; }
      setNewSubject(''); setNewMessage(''); clearFile();
      await load();
      setActive(t); setView('chat');
    } catch { setError('An error occurred.'); }
    finally { setSending(false); setUploadingImg(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await supportService.addSupportReply(active.id, reply.trim(), 'player', null, null);
      setReply('');
      const u = await supportService.getSupportTicketWithReplies(active.id);
      if (u) { setActive(u); setTickets(p => p.map(x => x.id === u.id ? u : x)); }
    } catch {/* ignore */} finally { setSending(false); }
  };

  if (!isOpen) return null;

  /* ── Panel wrapper ── */
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 420, maxWidth: '95vw',
        height: 580, maxHeight: '90vh',
        background: '#0d1b3e',
        border: '1px solid rgba(251,200,13,0.25)',
        borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.65)'
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {view !== 'list' && (
            <button onClick={() => setView('list')} style={iconBtn}>
              <ChevronLeft size={18} />
            </button>
          )}
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>
            {view === 'new'  ? 'New Ticket' :
             view === 'chat' ? (active?.subject || 'Support Chat') :
             'Support'}
          </span>
          {view === 'list' && (
            <button onClick={() => setView('new')} style={{ ...iconBtn, color: '#FBC80D', border: '1px solid rgba(251,200,13,0.3)' }}>
              <Plus size={16} />
            </button>
          )}
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        {/* ══ LIST VIEW ══ */}
        {view === 'list' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
            {loading ? (
              <Centered><Loader size={20} style={spin} /></Centered>
            ) : tickets.length === 0 ? (
              <Centered>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center' }}>
                  No tickets yet.<br />
                  <button onClick={() => setView('new')} style={{ background: 'none', border: 'none', color: '#FBC80D', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginTop: 6 }}>
                    Create one →
                  </button>
                </p>
              </Centered>
            ) : tickets.map(t => (
              <div key={t.id} onClick={() => { setActive(t); setView('chat'); }} style={{
                padding: '11px 13px', marginBottom: 6, borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                transition: 'background 0.15s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
                  <span style={{ fontSize: '0.65rem', color: STATUS_COLORS[t.status] || '#FBC80D', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{t.status?.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                  {new Date(t.created_at).toLocaleDateString()} · {t.support_replies?.length || 0} {t.support_replies?.length === 1 ? 'reply' : 'replies'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ CHAT VIEW ══ */}
        {view === 'chat' && active && (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* original message */}
              <Bubble isMe text={active.message} time={active.created_at} imgUrl={active.screenshot_url} label="You" />
              {/* replies sorted oldest→newest */}
              {[...(active.support_replies || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => (
                <Bubble key={r.id} isMe={r.sender_type === 'player'} text={r.message} time={r.created_at}
                  label={r.sender_type === 'admin' ? (r.admin_name || 'Support') : 'You'} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* reply box */}
            {active.status !== 'closed' && active.status !== 'resolved' ? (
              <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, flexShrink: 0 }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                  placeholder="Reply… (Enter to send)"
                  rows={2}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.88rem', padding: '9px 12px', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={sendReply} disabled={sending || !reply.trim()} style={{
                  background: reply.trim() ? 'linear-gradient(135deg,#FBC80D,#FFD700)' : 'rgba(255,255,255,0.07)',
                  border: 'none', borderRadius: 10, width: 42, flexShrink: 0, cursor: reply.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}>
                  {sending ? <Loader size={16} color="#FBC80D" style={spin} /> : <Send size={16} color={reply.trim() ? '#000' : 'rgba(255,255,255,0.3)'} />}
                </button>
              </div>
            ) : (
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', textAlign: 'center', flexShrink: 0 }}>
                Ticket {active.status} — create a new ticket for further help
              </div>
            )}
          </>
        )}

        {/* ══ NEW TICKET FORM ══ */}
        {view === 'new' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Subject</label>
              <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
                placeholder="Brief description…"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.88rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={lbl}>Message</label>
              <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Describe your issue…" rows={5}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.88rem', padding: '9px 12px', fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
            </div>

            {/* Screenshot attach */}
            <div>
              <label style={lbl}>Screenshot <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></label>
              {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 110, borderRadius: 8, border: '1px solid rgba(251,200,13,0.3)', display: 'block' }} />
                  <button onClick={clearFile} style={{ position: 'absolute', top: -7, right: -7, background: '#e53e3e', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px', background: 'rgba(255,255,255,0.04)',
                  border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10,
                  color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', cursor: 'pointer', justifyContent: 'center'
                }}>
                  <Image size={15} color="#FBC80D" /> Attach screenshot
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            </div>

            {error && <div style={{ color: '#fc8181', fontSize: '0.8rem', padding: '8px 10px', background: 'rgba(229,62,62,0.1)', borderRadius: 8 }}>{error}</div>}

            <button onClick={submitTicket} disabled={sending || !newSubject.trim() || !newMessage.trim()} style={{
              padding: '12px', borderRadius: 10, border: 'none', cursor: !newSubject.trim() || !newMessage.trim() ? 'not-allowed' : 'pointer',
              background: !newSubject.trim() || !newMessage.trim() ? 'rgba(255,255,255,0.07)' : 'linear-gradient(90deg,#FBC80D,#FFD700)',
              color: !newSubject.trim() || !newMessage.trim() ? 'rgba(255,255,255,0.3)' : '#000',
              fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s'
            }}>
              {sending ? <><Loader size={15} style={spin} />{uploadingImg ? 'Uploading…' : 'Submitting…'}</> : <><Send size={15} />Submit Ticket</>}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Chat bubble ── */
function Bubble({ isMe, text, time, imgUrl, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
      <span style={{ fontSize: '0.67rem', color: isMe ? 'rgba(251,200,13,0.7)' : 'rgba(0,200,255,0.7)', marginBottom: 3, fontWeight: 600 }}>{label}</span>
      <div style={{
        maxWidth: '80%', padding: '9px 13px', borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
        background: isMe ? 'rgba(251,200,13,0.1)' : 'rgba(0,200,255,0.09)',
        border: isMe ? '1px solid rgba(251,200,13,0.2)' : '1px solid rgba(0,200,255,0.18)',
        fontSize: '0.88rem', color: '#f0f0f0', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
      }}>
        {text}
        {imgUrl && (
          <a href={imgUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8 }}>
            <img src={imgUrl} alt="screenshot" style={{ maxWidth: '100%', maxHeight: 130, borderRadius: 7, border: '1px solid rgba(255,255,255,0.15)', display: 'block' }} />
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 3, display: 'block' }}>📎 view full</span>
          </a>
        )}
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', marginTop: 5, textAlign: isMe ? 'right' : 'left' }}>
          {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Centered({ children }) {
  return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>{children}</div>;
}
const iconBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' };
const lbl    = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' };
const spin   = { animation: 'spin 1s linear infinite' };
