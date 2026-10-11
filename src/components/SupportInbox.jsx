import React, { useState, useEffect, useRef } from 'react';
import { supportService } from '../services/supportService';
import { supabase } from '../services/supabaseClient';
import { MessageSquare, X, Send, Plus, Archive, Clock, CheckCircle2, Image, Loader, AlertCircle, ChevronLeft } from 'lucide-react';

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  open:        { label: 'OPEN',        color: '#FBC80D', bg: 'rgba(251,200,13,0.15)',   icon: Clock        },
  in_progress: { label: 'IN PROGRESS', color: '#00c8ff', bg: 'rgba(0,200,255,0.12)',    icon: MessageSquare},
  resolved:    { label: 'RESOLVED',    color: '#39ff14', bg: 'rgba(57,255,20,0.12)',    icon: CheckCircle2 },
  closed:      { label: 'CLOSED',      color: 'rgba(255,255,255,0.4)', bg: 'rgba(100,100,100,0.15)', icon: Archive }
};

// ─── Upload screenshot to Supabase storage ──────────────────────────────────
async function uploadScreenshot(file, userId) {
  try {
    const ext  = file.name.split('.').pop() || 'png';
    const name = `support-${Date.now()}-${userId}.${ext}`;
    const { error } = await supabase.storage
      .from('bug-screenshots')
      .upload(name, file, { contentType: file.type || 'image/png', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('bug-screenshots').getPublicUrl(name);
    return data?.publicUrl || null;
  } catch (err) {
    console.error('[SupportInbox] Screenshot upload failed:', err);
    return null;
  }
}

// ─── Shared input style ──────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(251,200,13,0.25)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s',
};

// ─── Main component ──────────────────────────────────────────────────────────
export default function SupportInbox({ userId, isOpen, onClose }) {
  const [tickets,         setTickets]         = useState([]);
  const [selectedTicket,  setSelectedTicket]  = useState(null);
  const [replyText,       setReplyText]       = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [isSending,       setIsSending]       = useState(false);
  const [showNewTicket,   setShowNewTicket]   = useState(false);
  const [newSubject,      setNewSubject]      = useState('');
  const [newMessage,      setNewMessage]      = useState('');
  const [screenshot,      setScreenshot]      = useState(null);   // File object
  const [screenshotPreview, setScreenshotPreview] = useState(null); // Data URL preview
  const [uploadingShot,   setUploadingShot]   = useState(false);
  const [submitError,     setSubmitError]     = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  // ── Load tickets when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && userId) loadTickets();
  }, [isOpen, userId]);

  // ── Poll selected ticket every 5 s for admin replies ──────────────────────
  useEffect(() => {
    if (!isOpen || !selectedTicket) return;
    const interval = setInterval(async () => {
      try {
        const updated = await supportService.getSupportTicketWithReplies(selectedTicket.id);
        if (updated) {
          setSelectedTicket(updated);
          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
      } catch { /* silently ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, selectedTicket?.id]);

  // ── Scroll to bottom when replies change ──────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.support_replies?.length]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await supportService.getPlayerSupportTickets(userId);
      setTickets(data);
      if (data.length > 0 && !selectedTicket) setSelectedTicket(data[0]);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  // ── Handle screenshot file pick ───────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit new ticket ─────────────────────────────────────────────────────
  const handleSubmitNewTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setSubmitError('');
    setIsSending(true);

    try {
      let screenshotUrl = null;
      if (screenshot) {
        setUploadingShot(true);
        screenshotUrl = await uploadScreenshot(screenshot, userId);
        setUploadingShot(false);
      }

      const ticket = await supportService.createSupportTicket(
        userId,
        newSubject.trim(),
        newMessage.trim(),
        screenshotUrl
      );

      if (ticket) {
        setNewSubject('');
        setNewMessage('');
        clearScreenshot();
        setShowNewTicket(false);
        await loadTickets();
        setSelectedTicket(ticket);
      } else {
        setSubmitError('Failed to submit ticket. Please try again.');
      }
    } catch (err) {
      console.error('[SupportInbox] Submit error:', err);
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSending(false);
      setUploadingShot(false);
    }
  };

  // ── Send reply in conversation ────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      await supportService.addSupportReply(
        selectedTicket.id,
        replyText.trim(),
        'player',
        null,
        null
      );
      setReplyText('');
      const updated = await supportService.getSupportTicketWithReplies(selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
    } catch (err) {
      console.error('[SupportInbox] Reply error:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const statusCfg = selectedTicket ? (STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open) : null;

  return (
    /* ── Backdrop ── */
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50000
      }}
      onClick={onClose}
    >
      {/* ── Panel ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92%', maxWidth: '920px',
          height: '86vh', maxHeight: '740px',
          background: 'linear-gradient(150deg, #0b1a3a 0%, #0d2050 60%, #0a1535 100%)',
          border: '1.5px solid rgba(251,200,13,0.35)',
          borderRadius: '18px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0,0,0,0.7), 0 0 30px rgba(251,200,13,0.08)'
        }}
      >
        {/* ════ HEADER ════ */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(251,200,13,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.25)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'rgba(251,200,13,0.15)',
              border: '1.5px solid rgba(251,200,13,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MessageSquare size={20} color="#FBC80D" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.15rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}>
                SUPPORT INBOX
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} • replies every 5 s
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              padding: '8px', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
            }}
          ><X size={20} /></button>
        </div>

        {/* ════ BODY ════ */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── Sidebar: ticket list ── */}
          <div style={{
            width: '280px', flexShrink: 0,
            borderRight: '1px solid rgba(251,200,13,0.15)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* New Ticket button */}
            <div style={{ padding: '14px 12px 8px' }}>
              <button
                onClick={() => { setShowNewTicket(true); setSelectedTicket(null); }}
                style={{
                  width: '100%', padding: '11px',
                  background: 'linear-gradient(90deg, rgba(251,200,13,0.22) 0%, rgba(251,200,13,0.12) 100%)',
                  border: '1.5px solid rgba(251,200,13,0.45)',
                  color: '#FBC80D', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '0.9rem',
                  fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 14px rgba(251,200,13,0.1)'
                }}
              >
                <Plus size={17} /> NEW TICKET
              </button>
            </div>

            {/* Ticket list */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.8rem' }}>Loading tickets…</span>
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '40px 12px', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  No tickets yet.<br />Click <strong style={{ color: '#FBC80D' }}>New Ticket</strong> to get help.
                </div>
              ) : tickets.map(ticket => {
                const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const isActive = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => { setSelectedTicket(ticket); setShowNewTicket(false); }}
                    style={{
                      padding: '11px 12px', marginBottom: '6px',
                      background: isActive ? 'rgba(251,200,13,0.13)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${isActive ? 'rgba(251,200,13,0.45)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      transition: 'all 0.18s',
                      boxShadow: isActive ? '0 0 12px rgba(251,200,13,0.08)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, flex: 1 }}>
                        {ticket.subject}
                      </div>
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        background: cfg.bg, color: cfg.color,
                        padding: '3px 7px', borderRadius: '5px',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                        letterSpacing: '0.3px', flexShrink: 0
                      }}>
                        {cfg.label}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>
                      {new Date(ticket.created_at).toLocaleDateString()} ·&nbsp;
                      {ticket.support_replies?.length || 0} repl{ticket.support_replies?.length !== 1 ? 'ies' : 'y'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Main pane ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ═══ NEW TICKET FORM ═══ */}
            {showNewTicket && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                {/* Form header */}
                <div style={{
                  padding: '16px 24px', borderBottom: '1px solid rgba(251,200,13,0.15)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(0,0,0,0.2)', flexShrink: 0
                }}>
                  <button
                    onClick={() => setShowNewTicket(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, display: 'flex' }}
                  ><ChevronLeft size={20} /></button>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px', fontSize: '1.05rem' }}>
                      CREATE NEW TICKET
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>
                      Our support team will reply as soon as possible
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' }}>

                  {/* Subject */}
                  <div>
                    <label style={{ display: 'block', color: '#FBC80D', fontSize: '0.8rem', fontWeight: 700, marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder="Brief description of your issue…"
                      style={inputStyle}
                    />
                  </div>

                  {/* Message */}
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#FBC80D', fontSize: '0.8rem', fontWeight: 700, marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Message
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Describe your issue in detail…"
                      style={{ ...inputStyle, minHeight: '130px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label style={{ display: 'block', color: '#FBC80D', fontSize: '0.8rem', fontWeight: 700, marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Screenshot&nbsp;<span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400, textTransform: 'none', fontSize: '0.75rem' }}>(optional)</span>
                    </label>

                    {screenshotPreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={screenshotPreview}
                          alt="screenshot preview"
                          style={{
                            maxWidth: '100%', maxHeight: '160px',
                            borderRadius: '10px', border: '1.5px solid rgba(251,200,13,0.35)',
                            display: 'block'
                          }}
                        />
                        <button
                          onClick={clearScreenshot}
                          style={{
                            position: 'absolute', top: '-8px', right: '-8px',
                            background: '#e53e3e', border: 'none', borderRadius: '50%',
                            width: 24, height: 24, cursor: 'pointer', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                          }}
                        ><X size={13} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '11px 18px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1.5px dashed rgba(251,200,13,0.3)',
                          borderRadius: '10px', color: 'rgba(255,255,255,0.6)',
                          cursor: 'pointer', fontSize: '0.88rem',
                          transition: 'all 0.2s', width: '100%', justifyContent: 'center',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Image size={18} color="#FBC80D" />
                        Click to attach a screenshot
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(229,62,62,0.15)',
                      border: '1px solid rgba(229,62,62,0.35)',
                      borderRadius: '8px', padding: '10px 14px',
                      color: '#fc8181', fontSize: '0.85rem'
                    }}>
                      <AlertCircle size={16} /> {submitError}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                    <button
                      onClick={handleSubmitNewTicket}
                      disabled={isSending || !newSubject.trim() || !newMessage.trim()}
                      style={{
                        flex: 1, padding: '13px',
                        background: isSending ? 'rgba(251,200,13,0.15)' : 'linear-gradient(90deg, #FBC80D 0%, #FFD700 100%)',
                        border: 'none', borderRadius: '10px',
                        color: isSending ? '#FBC80D' : '#000',
                        fontWeight: 900, fontSize: '0.95rem',
                        fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px',
                        cursor: isSending || !newSubject.trim() || !newMessage.trim() ? 'not-allowed' : 'pointer',
                        opacity: !newSubject.trim() || !newMessage.trim() ? 0.45 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: isSending ? 'none' : '0 0 20px rgba(251,200,13,0.3)'
                      }}
                    >
                      {isSending ? (
                        <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {uploadingShot ? 'UPLOADING SCREENSHOT…' : 'SUBMITTING…'}</>
                      ) : (
                        <><Send size={16} /> SUBMIT TICKET</>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowNewTicket(false); setNewSubject(''); setNewMessage(''); clearScreenshot(); setSubmitError(''); }}
                      style={{
                        padding: '13px 22px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.7)', borderRadius: '10px',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                        fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px'
                      }}
                    >CANCEL</button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CONVERSATION VIEW ═══ */}
            {!showNewTicket && selectedTicket && (
              <>
                {/* Ticket header */}
                <div style={{
                  padding: '14px 22px', borderBottom: '1px solid rgba(251,200,13,0.15)',
                  background: 'rgba(0,0,0,0.2)', flexShrink: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.3 }}>
                        {selectedTicket.subject}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.74rem', marginTop: '3px' }}>
                        Opened {new Date(selectedTicket.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      background: statusCfg.bg, color: statusCfg.color,
                      fontSize: '0.7rem', fontWeight: 800,
                      padding: '5px 10px', borderRadius: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      {statusCfg.label}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1, overflow: 'auto',
                  padding: '18px 22px',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  {/* Original message */}
                  <MessageBubble
                    sender="You"
                    senderType="player"
                    message={selectedTicket.message}
                    time={selectedTicket.created_at}
                    screenshotUrl={selectedTicket.screenshot_url}
                    isFirst
                  />

                  {/* Replies */}
                  {(selectedTicket.support_replies || [])
                    .slice()
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(reply => (
                      <MessageBubble
                        key={reply.id}
                        sender={reply.sender_type === 'admin' ? `${reply.admin_name || 'Support Team'}` : 'You'}
                        senderType={reply.sender_type}
                        message={reply.message}
                        time={reply.created_at}
                      />
                    ))
                  }
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply input */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
                  <div style={{
                    padding: '14px 22px', borderTop: '1px solid rgba(251,200,13,0.15)',
                    background: 'rgba(0,0,0,0.2)', flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }}}
                        placeholder="Type your reply… (Enter to send)"
                        rows={2}
                        style={{
                          ...inputStyle,
                          flex: 1, resize: 'none',
                          minHeight: '52px', maxHeight: '100px'
                        }}
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={isSending || !replyText.trim()}
                        style={{
                          padding: '14px 20px',
                          background: isSending || !replyText.trim()
                            ? 'rgba(251,200,13,0.2)'
                            : 'linear-gradient(90deg, #FBC80D 0%, #FFD700 100%)',
                          border: 'none', borderRadius: '10px',
                          color: isSending || !replyText.trim() ? '#FBC80D' : '#000',
                          cursor: isSending || !replyText.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '7px',
                          fontWeight: 900, fontFamily: 'Bebas Neue, sans-serif',
                          letterSpacing: '0.5px', flexShrink: 0,
                          boxShadow: !replyText.trim() ? 'none' : '0 0 16px rgba(251,200,13,0.25)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isSending ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                        {isSending ? 'SENDING' : 'SEND'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '14px 22px', borderTop: '1px solid rgba(251,200,13,0.15)',
                    background: 'rgba(0,0,0,0.2)', flexShrink: 0,
                    textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem'
                  }}>
                    This ticket is {selectedTicket.status}. Create a new ticket if you need further assistance.
                  </div>
                )}
              </>
            )}

            {/* ═══ EMPTY STATE ═══ */}
            {!showNewTicket && !selectedTicket && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', gap: '14px', padding: '40px'
              }}>
                <MessageSquare size={48} style={{ opacity: 0.25 }} />
                <div style={{ textAlign: 'center', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>No ticket selected</div>
                  <div style={{ fontSize: '0.85rem' }}>Choose a ticket from the left or create a new one</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spin keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── MessageBubble sub-component ─────────────────────────────────────────────
function MessageBubble({ sender, senderType, message, time, screenshotUrl, isFirst }) {
  const isAdmin  = senderType === 'admin';
  const isPlayer = senderType === 'player';

  const bubbleStyle = {
    padding: '12px 15px',
    borderRadius: isAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
    maxWidth: '85%',
    background: isAdmin
      ? 'linear-gradient(135deg, rgba(0,180,255,0.12) 0%, rgba(0,120,200,0.08) 100%)'
      : 'linear-gradient(135deg, rgba(251,200,13,0.1) 0%, rgba(200,160,0,0.07) 100%)',
    border: isAdmin
      ? '1px solid rgba(0,200,255,0.25)'
      : '1px solid rgba(251,200,13,0.22)',
    alignSelf: isAdmin ? 'flex-start' : 'flex-end',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end' }}>
      {/* Sender label */}
      <div style={{
        fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px',
        color: isAdmin ? '#00c8ff' : '#FBC80D',
        paddingLeft: isAdmin ? '4px' : 0,
        paddingRight: isAdmin ? 0 : '4px',
        display: 'flex', alignItems: 'center', gap: '5px'
      }}>
        {isAdmin && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c8ff', boxShadow: '0 0 6px #00c8ff' }} />}
        {sender}
        {isFirst && <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(original)</span>}
        {!isAdmin && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FBC80D', boxShadow: '0 0 6px #FBC80D' }} />}
      </div>

      {/* Bubble */}
      <div style={bubbleStyle}>
        <div style={{ color: '#fff', fontSize: '0.93rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {message}
        </div>
        {/* Screenshot thumbnail */}
        {screenshotUrl && (
          <a href={screenshotUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '10px' }}>
            <img
              src={screenshotUrl}
              alt="Attached screenshot"
              style={{
                maxWidth: '100%', maxHeight: '180px', borderRadius: '8px',
                border: '1px solid rgba(251,200,13,0.3)', display: 'block',
                cursor: 'pointer'
              }}
            />
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              📎 Click to view full screenshot
            </div>
          </a>
        )}
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: '7px', textAlign: isAdmin ? 'left' : 'right' }}>
          {new Date(time).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
