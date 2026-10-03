import { supabase, isSupabaseConfigured } from './supabaseClient';

export const bugReportService = {
  /**
   * Submit a bug report with optional screenshot
   * @param {Object} params
   * @param {string} params.userId - User ID (can be null for guests)
   * @param {string} params.username - Username
   * @param {string} params.errorType - Type: 'crash', 'freeze', 'blackout', 'manual', 'error'
   * @param {string} params.errorMessage - Error message or description
   * @param {string} params.errorStack - Stack trace (optional)
   * @param {string} params.pageUrl - Current page URL
   * @param {string} params.userAgent - Browser user agent
   * @param {Object} params.gameState - Game state snapshot (optional)
   * @param {string} params.matchId - Match ID if in game (optional)
   * @param {Blob} params.screenshot - Screenshot blob (optional)
   * @returns {Promise<Object>} Created bug report
   */
  async submitBugReport({
    userId = null,
    username = 'Guest',
    errorType = 'manual',
    errorMessage,
    errorStack = null,
    pageUrl,
    userAgent,
    gameState = null,
    matchId = null,
    screenshot = null
  }) {
    if (!supabase) {
      console.error('[bugReportService] Supabase not configured');
      return null;
    }

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot) {
        const timestamp = Date.now();
        const filename = `bug-${timestamp}-${userId || 'guest'}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bug-screenshots')
          .upload(filename, screenshot, {
            contentType: 'image/png',
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('[bugReportService] Screenshot upload failed:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('bug-screenshots')
            .getPublicUrl(filename);
          screenshotUrl = urlData.publicUrl;
        }
      }

      // Insert bug report
      const { data, error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: userId,
          username,
          error_type: errorType,
          error_message: errorMessage?.substring(0, 1000) || 'No message provided',
          error_stack: errorStack?.substring(0, 5000),
          page_url: pageUrl,
          user_agent: userAgent,
          game_state: gameState,
          match_id: matchId,
          screenshot_url: screenshotUrl,
          status: 'new',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[bugReportService] Failed to insert bug report:', error);
        return null;
      }

      console.log('[bugReportService] Bug report submitted successfully:', data.id);
      return data;
    } catch (err) {
      console.error('[bugReportService] Exception in submitBugReport:', err);
      return null;
    }
  },

  /**
   * Capture screenshot of current page
   * @returns {Promise<Blob>} Screenshot blob
   */
  async captureScreenshot() {
    try {
      // Use html2canvas if available
      if (window.html2canvas) {
        const canvas = await window.html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          logging: false,
          scale: 0.5 // Reduce size for faster upload
        });

        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png', 0.8);
        });
      }

      // Fallback: canvas screenshot (won't work in all cases)
      console.warn('[bugReportService] html2canvas not available, screenshot skipped');
      return null;
    } catch (err) {
      console.error('[bugReportService] Screenshot capture failed:', err);
      return null;
    }
  },

  /**
   * Admin: Fetch all bug reports
   * @param {Object} params
   * @param {string} params.status - Filter by status: 'new', 'investigating', 'resolved', 'dismissed'
   * @param {number} params.limit - Max results
   * @returns {Promise<Array>} Bug reports
   */
  async fetchBugReports({ status = null, limit = 100 } = {}) {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('[bugReportService] Failed to fetch bug reports:', err);
      return [];
    }
  },

  /**
   * Admin: Update bug report status
   * @param {string} reportId
   * @param {string} status - 'new', 'investigating', 'resolved', 'dismissed'
   * @param {string} adminNotes - Optional admin notes
   * @returns {Promise<boolean>}
   */
  async updateBugReportStatus(reportId, status, adminNotes = null) {
    if (!supabase) return false;

    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes !== null) {
        updates.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('bug_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('[bugReportService] Failed to update bug report:', err);
      return false;
    }
  },

  /**
   * Admin: Delete bug report
   * @param {string} reportId
   * @returns {Promise<boolean>}
   */
  async deleteBugReport(reportId) {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('bug_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('[bugReportService] Failed to delete bug report:', err);
      return false;
    }
  }
};

/**
 * Global error handler that auto-reports crashes
 * Call setupGlobalErrorHandlers() in your main App component
 */
export function setupGlobalErrorHandlers(userId, username) {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    console.error('[Global Error Handler]', event.error);

    bugReportService.submitBugReport({
      userId,
      username,
      errorType: 'crash',
      errorMessage: event.message || 'Unhandled error',
      errorStack: event.error?.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global Promise Rejection]', event.reason);

    bugReportService.submitBugReport({
      userId,
      username,
      errorType: 'crash',
      errorMessage: `Promise rejection: ${event.reason?.message || event.reason}`,
      errorStack: event.reason?.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    });
  });

  console.log('[bugReportService] Global error handlers initialized');
}
