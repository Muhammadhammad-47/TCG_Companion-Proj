import React, { useState, useEffect } from 'react';
import { supportService } from '../services/supportService';
import { MessageSquare, RefreshCw, Send, Trash2, Archive } from 'lucide-react';

export default function AdminSupportPanel({ onRefresh }) {
  const [supportMessages, setSupportMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supportFilter, setSupportFilter] = useState('open');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [modNotice, setModNotice] = useState('');
  const [replyError, setReplyError] = useState(''); // FIX 5: Track reply errors separately

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async (filter = supportFilter) => {
    setIsLoading(true);
    try {
      const tickets = await supportService.getAllSupportTickets(
        filter === 'all' ? null : filter,
        150
      );
      setSupportMessages(tickets);
      if (tickets.length > 0 && !selectedTicket) {
        const detailed = await supportService.getSupportTicketWithReplies(tickets[0].id);
        setSelectedTicket(detailed);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setSupportFilter(filter);
    loadMessages(filter);
  };

  const handleSelectTicket = async (ticket) => {
    const detailed = await supportService.getSupportTicketWithReplies(ticket.id);
    setSelectedTicket(detailed);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    // FIX 5: Guard against no ticket selected
    if (!selectedTicket) {
      setReplyError('No ticket selected. Please select a ticket first.');
      return;
    }

    setIsSendingReply(true);
    setReplyError('');
    setModNotice('');
    try {
      const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      await supportService.addSupportReply(
        selectedTicket.id,
        replyText,
        'admin',
        currentUser.id,
        currentUser.email || 'Support Team'
      );

      setReplyText('');
      const updated = await supportService.getSupportTicketWithReplies(selectedTicket.id);
      setSelectedTicket(updated);
      setModNotice('✓ Reply sent');
      setTimeout(() => setModNotice(''), 3000);
    } catch (err) {
      console.error('Reply send error:', err);
      // FIX 5: Display error prominently
      setReplyError(err.message || 'Failed to send reply. Check admin login status.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicket) return;

    try {
      await supportService.updateTicketStatus(selectedTicket.id, status);
      setModNotice(`✓ Marked as ${status}`);
      setTimeout(() => setModNotice(''), 3000);
      await loadMessages();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Permanently delete this ticket and all replies?')) {
      try {
        await supportService.deleteTicket(ticketId);
        setModNotice('✓ Ticket deleted');
        setTimeout(() => setModNotice(''), 3000);
        setSelectedTicket(null);
        await loadMessages();
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: 'rgba(0,200,255,0.15)', text: '#FBC80D', border: 'rgba(0,200,255,0.3)' },
      in_progress: { bg: 'rgba(251,200,13,0.15)', text: '#FBC80D', border: 'rgba(251,200,13,0.3)' },
      resolved: { bg: 'rgba(57,255,20,0.15)', text: '#39ff14', border: 'rgba(57,255,20,0.3)' },
      closed: { bg: 'rgba(100,100,100,0.15)', text: 'rgba(255,255,255,0.6)', border: 'rgba(100,100,100,0.3)' }
    };
    return colors[status] || colors.open;
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      {/* Tickets List */}
      <div
        style={{
          width: '30%',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 200, 13, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(251, 200, 13, 0.2)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {['open', 'in_progress', 'resolved', 'closed', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                style={{
                  background: supportFilter === f ? 'rgba(251,200,13,0.2)' : 'rgba(255,255,255,0.05)',
                  border: supportFilter === f ? '1px solid rgba(251,200,13,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  color: supportFilter === f ? '#FBC80D' : 'rgba(255,255,255,0.6)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadMessages()}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
              Loading...
            </div>
          ) : supportMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
              No tickets found
            </div>
          ) : (
            supportMessages.map((ticket) => {
              const statusColor = getStatusColor(ticket.status);
              const replyCount = ticket.support_replies?.[0]?.count || 0;
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
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
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                        {ticket.subject}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
                        {ticket.username || 'Guest'} • {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ticket.status}
                    </div>
                  </div>
                  {replyCount > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(0,200,255,0.7)' }}>
                      {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ticket Details & Conversation */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(13, 26, 56, 0.8) 0%, rgba(20, 35, 75, 0.8) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 200, 13, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {selectedTicket ? (
          <>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(251, 200, 13, 0.2)' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {selectedTicket.subject}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                From: <strong>{selectedTicket.username || 'Guest'}</strong> • Created: {new Date(selectedTicket.created_at).toLocaleString()}
              </div>

              {/* Status Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedTicket.status !== 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(251,200,13,0.2)',
                      border: '1px solid rgba(251,200,13,0.4)',
                      color: '#FBC80D',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    In Progress
                  </button>
                )}
                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(57,255,20,0.15)',
                      border: '1px solid rgba(57,255,20,0.3)',
                      color: '#39ff14',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTicket(selectedTicket.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,42,85,0.15)',
                    border: '1px solid rgba(255,42,85,0.3)',
                    color: '#ff2a55',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  <Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Delete
                </button>
              </div>
            </div>

            {/* FIX 5: modNotice at top of conversation as sticky overlay */}
            {modNotice && (
              <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: modNotice.startsWith('✓') ? 'rgba(57,255,20,0.15)' : 'rgba(237,30,36,0.15)',
                border: `1px solid ${modNotice.startsWith('✓') ? '#39ff14' : '#ED1E24'}`,
                color: modNotice.startsWith('✓') ? '#39ff14' : '#ED1E24',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                margin: '0 0 12px 0'
              }}>
                {modNotice}
              </div>
            )}

            {/* Conversation */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Original Message */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(251,200,13,0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#FBC80D', fontWeight: 'bold', marginBottom: '6px' }}>
                  {selectedTicket.username || 'Guest'} (Ticket)
                </div>
                <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.5' }}>
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
                    padding: '12px'
                  }}
                >
                  <div style={{
                    fontSize: '0.8rem',
                    color: reply.sender_type === 'admin' ? '#00c8ff' : 'rgba(255,255,255,0.7)',
                    fontWeight: 'bold',
                    marginBottom: '6px'
                  }}>
                    {reply.sender_type === 'admin' ? `Admin - ${reply.admin_name}` : selectedTicket.username || 'Guest'}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.5' }}>
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
              {/* FIX 5: Display reply error prominently above textarea */}
              {replyError && (
                <div style={{
                  marginBottom: '8px',
                  padding: '8px 12px',
                  background: 'rgba(237,30,36,0.15)',
                  border: '1px solid #ED1E24',
                  color: '#ED1E24',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 'bold'
                }}>
                  ✗ {replyError}
                </div>
              )}
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
              <button
                onClick={handleSendReply}
                disabled={isSendingReply || !replyText.trim()}
                style={{
                  marginTop: '12px',
                  width: '100%',
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
                  opacity: isSendingReply || !replyText.trim() ? 0.5 : 1
                }}
              >
                <Send size={18} /> {isSendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)'
          }}>
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  );
}
