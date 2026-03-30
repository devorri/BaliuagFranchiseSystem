import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCcw, X, Shield, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsInitializing(true);
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = { 
          fps: 10, 
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.0
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            // Found QR! Stop scanner and send result
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Just noise or not found yet, don't show toast
          }
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error('Scanner error:', err);
        setError(`Camera error: ${err.message || 'Check permissions'}`);
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="qr-modal-container">
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <Camera size={18} /> 
            <span>Scan Tricycle QR Code</span>
          </div>
          <div className="qr-secure-badge">
            <Shield size={12} />
            <span>Secure Connection</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="qr-modal-body">
          {error ? (
            <div className="qr-error">
              <RefreshCcw size={32} />
              <p>{error}</p>
              <button className="btn btn--outline btn--sm" onClick={() => window.location.reload()}>Refresh Page</button>
            </div>
          ) : (
            <div className="qr-reader-wrapper">
              <div id="qr-reader"></div>
              
              {isInitializing && (
                <div className="qr-loader">
                  <Loader2 className="animate-spin" size={32} />
                  <span>Accessing Verification Camera...</span>
                </div>
              )}

              <div className="qr-overlay">
                <div className="qr-scanner-frame">
                  <div className="qr-corner qr-corner--top-left"></div>
                  <div className="qr-corner qr-corner--top-right"></div>
                  <div className="qr-corner qr-corner--bottom-left"></div>
                  <div className="qr-corner qr-corner--bottom-right"></div>
                </div>
                <div className="qr-scanner-line"></div>
                <div className="qr-vignette"></div>
              </div>
            </div>
          )}
          <p className="qr-hint">Position the driver's QR code within the frame to verify their license and registration status.</p>
        </div>
      </div>
    </div>
  );
}
