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
    console.log('[bugReportService] Attempting to submit bug report:', {
      userId,
      username,
      errorType,
      errorMessage: errorMessage?.substring(0, 100) + '...',
      hasStack: !!errorStack,
      hasScreenshot: !!screenshot,
      stackPreview: errorStack?.substring(0, 200)
    });

    if (!supabase) {
      console.error('[bugReportService] Supabase not configured');
      return null;
    }

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot) {
        const timestamp = Date.now();
        // Determine file extension from screenshot type
        const extension = screenshot.type.includes('png') ? 'png' : 
                         screenshot.type.includes('jpeg') || screenshot.type.includes('jpg') ? 'jpg' : 'png';
        const filename = `bug-${timestamp}-${userId || 'guest'}.${extension}`;
        
        console.log('[bugReportService] Uploading screenshot:', { filename, type: screenshot.type, size: screenshot.size });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bug-screenshots')
          .upload(filename, screenshot, {
            contentType: screenshot.type || 'image/png',
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('[bugReportService] Screenshot upload failed:', uploadError);
          console.log('[bugReportService] Will continue without screenshot');
        } else {
          const { data: urlData } = supabase.storage
            .from('bug-screenshots')
            .getPublicUrl(filename);
          screenshotUrl = urlData?.publicUrl || null;
          console.log('[bugReportService] Screenshot uploaded:', screenshotUrl);
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
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "bug_reports" does not exist')) {
          console.error('[bugReportService] DATABASE SETUP REQUIRED: Run supabase/schema.sql to create bug_reports table');
        }
        
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
   * Capture screenshot of current page using html2canvas or Canvas API
   * @returns {Promise<Blob>} Screenshot blob
   */
  async captureScreenshot() {
    try {
      console.log('[bugReportService] Attempting screenshot capture...');
      
      // Method 1: Try using html2canvas if available
      if (window.html2canvas) {
        console.log('[bugReportService] Using html2canvas library');
        const canvas = await window.html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          logging: false,
          scale: 0.5
        });
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png', 0.8);
        });
      }

      // Method 2: Try using modern Canvas API via html2image or similar
      if (typeof html2image !== 'undefined' && html2image.toBlob) {
        console.log('[bugReportService] Using html2image library');
        const blob = await html2image.toBlob(document.body);
        return blob;
      }

      // Method 3: Use getDisplayMedia API (ask user to select screen)
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        console.log('[bugReportService] Falling back to getDisplayMedia API');
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' }
          });
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();

          return new Promise((resolve) => {
            video.onloadedmetadata = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              stream.getTracks().forEach(track => track.stop());
              
              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/png', 0.8);
            };
          });
        } catch (e) {
          console.warn('[bugReportService] User cancelled screen capture:', e);
          return null;
        }
      }

      // Method 4: Basic canvas screenshot (static - not interactive)
      console.log('[bugReportService] Using basic canvas screenshot');
      const canvas = document.createElement('canvas');
      const rect = document.documentElement.getBoundingClientRect();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      
      // Fill with dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw simple text
      ctx.fillStyle = '#00ccff';
      ctx.font = '16px Arial';
      ctx.fillText('Screenshot captured at ' + new Date().toLocaleTimeString(), 20, 30);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.8);
      });
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
  console.log('[bugReportService] Setting up global error handlers for:', { userId, username });
  
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    console.error('[Global Error Handler] Caught error:', event.error);
    console.log('[Global Error Handler] Event details:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });

    bugReportService.submitBugReport({
      userId,
      username,
      errorType: 'crash',
      errorMessage: event.message || 'Unhandled error',
      errorStack: event.error?.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    }).then((result) => {
      console.log('[bugReportService] Error report submitted:', result?.id || 'failed');
    }).catch((err) => {
      console.error('[bugReportService] Failed to submit error report:', err);
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global Promise Rejection]', event.reason);
    console.log('[Global Promise Rejection] Event details:', { reason: event.reason });

    bugReportService.submitBugReport({
      userId,
      username,
      errorType: 'crash',
      errorMessage: `Promise rejection: ${event.reason?.message || event.reason}`,
      errorStack: event.reason?.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    }).then((result) => {
      console.log('[bugReportService] Promise rejection report submitted:', result?.id || 'failed');
    }).catch((err) => {
      console.error('[bugReportService] Failed to submit promise rejection report:', err);
    });
  });

  console.log('[bugReportService] Global error handlers initialized successfully');

  // Test function - can be called from console
  window.testBugReporting = () => {
    console.log('[bugReportService] Testing bug reporting system...');
    
    // Test 1: Manual error submission
    bugReportService.submitBugReport({
      userId,
      username,
      errorType: 'manual',
      errorMessage: 'Test error from manual trigger',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    }).then((result) => {
      console.log('[bugReportService] Manual test report result:', result);
    });
    
    // Test 2: Throw an error to test global handler
    setTimeout(() => {
      throw new Error('Test error to verify global error handler');
    }, 1000);
  };
}


/**
 * Auto-report caught errors (for try-catch blocks and API errors)
 * Call this when catching errors to auto-submit to admin
 * @param {Error|string} error - The error object or error message
 * @param {Object} context - Additional context
 * @param {string} context.userId - User ID
 * @param {string} context.username - Username
 * @param {string} context.errorType - Error type (e.g., 'api_error', 'storage_error', 'network_error')
 * @param {string} context.section - Section/feature where error occurred
 */
export const autoReportError = (error, context = {}) => {
  const {
    userId = null,
    username = 'Guest',
    errorType = 'caught_error',
    section = 'unknown'
  } = context;

  // Convert error to string properly
  let errorMessage = '';
  let errorStack = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = error.message || error.details || JSON.stringify(error);
    errorStack = error.stack || JSON.stringify(error);
  } else {
    errorMessage = String(error);
  }

  console.log('[autoReportError] Reporting caught error:', {
    section,
    errorType,
    message: errorMessage
  });

  // Submit to admin (fire and forget)
  bugReportService.submitBugReport({
    userId,
    username,
    errorType: `caught_${errorType}`,
    errorMessage: `[${section}] ${errorMessage}`,
    errorStack,
    pageUrl: window.location.href,
    userAgent: navigator.userAgent
  }).catch((err) => {
    console.error('[autoReportError] Failed to report error:', err);
  });
};
