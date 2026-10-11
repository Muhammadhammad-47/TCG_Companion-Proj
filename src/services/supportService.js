// Support Messaging Service
// Handles two-way communication between players and admins
import { supabase } from './supabaseClient';

export const supportService = {
  // Create a support ticket (player submits issue)
  async createSupportTicket(userId, subject, message, screenshotUrl = null) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: userId,
            subject,
            message,
            screenshot_url: screenshotUrl,
            status: 'open', // 'open' | 'in_progress' | 'resolved' | 'closed'
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to create support ticket:', err);
      return null;
    }
  },

  // Get all support tickets for admin
  async getAllSupportTickets(status = null, limit = 100) {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*, support_replies(count)')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
      return [];
    }
  },

  // Get support tickets for a specific player
  async getPlayerSupportTickets(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_replies(
            id,
            message,
            sender_type,
            created_at,
            admin_id
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch player support tickets:', err);
      return [];
    }
  },

  // Get single support ticket with full conversation
  async getSupportTicketWithReplies(ticketId) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_replies(
            id,
            message,
            sender_type,
            created_at,
            admin_id,
            admin_name
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch support ticket:', err);
      return null;
    }
  },

  // Add reply to support ticket
  async addSupportReply(ticketId, message, senderType, adminId = null, adminName = null) {
    if (!supabase) throw new Error('Supabase not configured');

    // FIX 5: Check auth session — admin inserts require an authenticated session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error('Not authenticated. Please log in as admin before sending replies.');
    }

    try {
      // Add reply
      const { data: reply, error: replyError } = await supabase
        .from('support_replies')
        .insert([
          {
            ticket_id: ticketId,
            message,
            sender_type: senderType, // 'admin' | 'player'
            admin_id: adminId,
            admin_name: adminName,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (replyError) {
        // FIX 5: Log the full replyError object, not just the message
        console.error('Full replyError object:', replyError);
        throw replyError;
      }

      // Update ticket updated_at timestamp
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (updateError) {
        // Non-fatal: reply was inserted; log but don't throw
        console.error('Ticket timestamp update error:', updateError);
      }

      return reply;
    } catch (err) {
      console.error('Failed to add support reply:', err);
      throw err; // Re-throw so AdminSupportPanel can catch and display it
    }
  },

  // Update ticket status
  async updateTicketStatus(ticketId, status) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      return null;
    }
  },

  // Delete support ticket (admin only)
  async deleteTicket(ticketId) {
    try {
      // Delete all replies first
      const { error: repliesError } = await supabase
        .from('support_replies')
        .delete()
        .eq('ticket_id', ticketId);

      if (repliesError) throw repliesError;

      // Delete ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (ticketError) throw ticketError;
      return true;
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      return false;
    }
  },

  // Get unread ticket count for admin
  async getUnreadTicketCount() {
    try {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Failed to get unread count:', err);
      return 0;
    }
  },

  // Get unread tickets for player
  async getPlayerUnreadTickets(userId) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, status')
        .eq('user_id', userId)
        .neq('status', 'closed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch player unread tickets:', err);
      return [];
    }
  }
};
