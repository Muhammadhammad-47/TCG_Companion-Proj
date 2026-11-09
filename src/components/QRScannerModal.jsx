import React, { useState, useEffect, useRef } from 'react';
import {
  X, Camera, CameraOff, QrCode, CheckCircle2, AlertTriangle,
  Sparkles, Keyboard, Upload, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { characterLicenseService } from '../services/characterLicenseService';
import { soundFX } from '../game/utils/audio';

export default function QRScannerModal({ isOpen, onClose, userId, onUnlockSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream when modal is opened on 'camera' tab
  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access not supported on this browser/environment. Please use manual code entry.');
      setActiveTab('manual');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Start detection loop if BarcodeDetector is supported
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                handleCodeRedemption(detectedCode);
              }
            } catch (err) {
              // Frame scan error, continue
            }
          }
        }, 300);
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError('Camera permission denied or camera not found. You can enter the card code manually below.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  // Execute redemption of QR string
  const handleCodeRedemption = async (codeToRedeem) => {
    if (!codeToRedeem || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage({ text: 'Verifying TCG Card Security Signature...', type: 'info' });

    try {
      const result = await characterLicenseService.redeemQRCode(userId, codeToRedeem);
      if (result.success) {
        try { soundFX.playLevelUp(); } catch {}
        setStatusMessage({ text: result.message, type: 'success' });
        stopCamera();
        if (onUnlockSuccess) {
          onUnlockSuccess(result);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setStatusMessage({ text: result.error || 'Invalid card QR code.', type: 'error' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Error verifying code. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeRedemption(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e131f] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide text-white flex items-center gap-2">
                SCAN CARD ACCESS QR
              </h3>
              <p className="text-xs text-cyan-300/70">Scan physical card QR or voucher code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-black/20 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera size={14} /> LIVE CAMERA SCANNER
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Keyboard size={14} /> MANUAL VOUCHER CODE
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col items-center">
          
          {/* TAB 1: Live Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[280px] rounded-xl overflow-hidden bg-black border-2 border-cyan-500/50 shadow-inner flex items-center justify-center">
                
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Futuristic Scanning Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Laser scanner beam */}
                      <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#00f0ff] animate-bounce" style={{ animationDuration: '2s' }} />
                      {/* 4 Corner Crosshairs */}
                      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center flex flex-col items-center gap-3 text-gray-400">
                    <CameraOff size={36} className="text-gray-500" />
                    <p className="text-xs leading-relaxed">
                      {cameraError || 'Camera initializing... If requested, please allow camera permissions.'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">
                Point camera at the QR code on the back of your physical card or tournament badge.
              </p>
            </div>
          )}

          {/* TAB 2: Manual Code Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="w-full flex flex-col gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-gray-300 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Enter the unique card code printed on your physical card pack, tournament slip, or admin voucher (e.g. <strong className="text-white">KTRL-CHAR-CHYNAMAN-98A1</strong>).
                </span>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-semibold text-gray-300 tracking-wider">
                  VOUCHER / CARD CODE:
                </label>
                <input
                  type="text"
                  placeholder="e.g. KTRL-CHAR-CHYNAMAN-A1B2"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/60 border border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-cyan-300 placeholder-gray-500 tracking-wider font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={16} />
                VERIFY & UNLOCK ACCESS
              </button>
            </form>
          )}

          {/* Status Notification Message */}
          {statusMessage.text && (
            <div className={`w-full mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              ) : (
                <Sparkles size={16} className="shrink-0 animate-spin text-cyan-400" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center text-[11px] text-gray-500">
          Official Kontrolla TCG Security Card Authentication
        </div>

      </div>
    </div>
  );
}

