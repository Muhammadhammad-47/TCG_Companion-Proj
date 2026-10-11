import React, { useState, useEffect } from 'react';
import { supportService } from '../services/supportService';
import { MessageSquare, X, Send, Plus, Archive, Clock, CheckCircle2 } from 'lucide-react';
import { soundFX } from '../game/utils/audio';

export default function SupportInbox({ userId, isOpen, onClose }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    message: ''
  });

  // Load player's support tickets
  useEffect(() => {
    if (isOpen && userId) {
      loadTickets();
    }
  }, [isOpen, userId]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await supportService.getPlayerSupportTickets(userId);
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNewTicket = async () => {
    if (!newTicketData.subject.trim() || !newTicketData.message.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const ticket = await supportService.createSupportTicket(
        userId,
        newTicketData.subject,
        newTicketData.message
      );

      if (ticket) {
        setNewTicketData({ subject: '', message: '' });
        setShowNewTicket(false);
        await loadTickets();
        setSelectedTicket(ticket);
        if (soundFX?.playMenuSelect) soundFX.playMenuSelect();
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) {
      return;
    }

    setIsSending(true);
    try {
      await supportService.addSupportReply(
        selectedTicket.id,
        replyText,
        'player',
        null,
        null
      );

      setReplyText('');
      const updatedTicket = await supportService.getSupportTicketWithReplies(selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      }
      if (soundFX?.playMenuSelect) soundFX.playMenuSelect();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: 'rgba(0,200,255,0.15)', text: '#FBC80D', icon: Clock },
      in_progress: { bg: 'rgba(251,200,13,0.15)', text: '#FBC80D', icon: MessageSquare },
      resolved: { bg: 'rgba(57,255,20,0.15)', text: '#39ff14', icon: CheckCircle2 },
      closed: { bg: 'rgba(100,100,100,0.15)', text: 'rgba(255,255,255,0.6)', icon: Archive }
    };
    return colors[status] || colors.open;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50000
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '900px',
          height: '80%',
          maxHeight: '700px',
          background: 'linear-gradient(135deg, rgba(13, 26, 56, 0.95) 0%, rgba(20, 35, 75, 0.95) 100%)',
          border: '1px solid rgba(251, 200, 13, 0.3)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(251, 200, 13, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={28} color="#FBC80D" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', margin: 0 }}>
              Support Inbox
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Tickets List */}
          <div
            style={{
              width: '35%',
              borderRight: '1px solid rgba(251, 200, 13, 0.2)',
              overflow: 'auto',
              background: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ padding: '12px' }}>
              <button
                onClick={() => setShowNewTicket(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(251,200,13,0.2)',
                  border: '1px solid rgba(251,200,13,0.4)',
                  color: '#FBC80D',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={18} /> New Ticket
              </button>

              {isLoading ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
                  Loading...
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
                  No support tickets yet
                </div>
              ) : (
                tickets.map((ticket) => {
                  const statusColor = getStatusColor(ticket.status);
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: selectedTicket?.id === ticket.id
                          ? 'rgba(251,200,13,0.15)'
                          : 'rgba(0,0,0,0.3)',
                        border: selectedTicket?.id === ticket.id
                          ? '1px solid rgba(251,200,13,0.4)'
                          : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>
                            {ticket.subject}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            background: statusColor.bg,
                            color: statusColor.text,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ticket.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Conversation View */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {showNewTicket ? (
              // New Ticket Form
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                  Create Support Ticket
                </h3>

                <div>
                  <label style={{ display: 'block', color: '#FBC80D', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newTicketData.subject}
                    onChange={(e) => setNewTicketData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(251,200,13,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#FBC80D', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    Message
                  </label>
                  <textarea
                    value={newTicketData.message}
                    onChange={(e) => setNewTicketData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    style={{
                      width: '100%',
                      height: '100%',
                      boxSizing: 'border-box',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(251,200,13,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleSubmitNewTicket}
                    disabled={isSending || !newTicketData.subject.trim() || !newTicketData.message.trim()}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(251,200,13,0.2)',
                      border: '1px solid rgba(251,200,13,0.4)',
                      color: '#FBC80D',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      opacity: isSending ? 0.5 : 1
                    }}
                  >
                    {isSending ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTicket(false);
                      setNewTicketData({ subject: '', message: '' });
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedTicket ? (
              // Conversation Thread
              <>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(251, 200, 13, 0.2)' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                    {selectedTicket.subject}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    Created: {new Date(selectedTicket.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Original ticket message */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(251,200,13,0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#FBC80D', fontWeight: 'bold', marginBottom: '6px' }}>
                      You (Original Ticket)
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.4' }}>
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Replies */}
                  {selectedTicket.support_replies && selectedTicket.support_replies.map((reply) => (
                    <div
                      key={reply.id}
                      style={{
                        background: reply.sender_type === 'admin'
                          ? 'rgba(0,200,255,0.1)'
                          : 'rgba(100,100,100,0.1)',
                        border: reply.sender_type === 'admin'
                          ? '1px solid rgba(0,200,255,0.3)'
                          : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{
                        fontSize: '0.8rem',
                        color: reply.sender_type === 'admin' ? '#00c8ff' : 'rgba(255,255,255,0.7)',
                        fontWeight: 'bold',
                        marginBottom: '6px'
                      }}>
                        {reply.sender_type === 'admin' ? `Admin - ${reply.admin_name || 'Support Team'}` : 'You'}
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.4' }}>
                        {reply.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                        {new Date(reply.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(251, 200, 13, 0.2)' }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(251,200,13,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      minHeight: '60px',
                      resize: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button
                      onClick={handleSendReply}
                      disabled={isSending || !replyText.trim()}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(251,200,13,0.2)',
                        border: '1px solid rgba(251,200,13,0.4)',
                        color: '#FBC80D',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: isSending || !replyText.trim() ? 0.5 : 1
                      }}
                    >
                      <Send size={18} /> {isSending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                Select a ticket or create a new one to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
