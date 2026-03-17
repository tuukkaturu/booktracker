import { useRef, useState } from 'react';

export default function Camera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function startCamera(mode) {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError('Camera not available. Use the file picker below.');
    }
  }

  // Ref callback — fires when the <video> node mounts or unmounts (no useEffect needed)
  function videoRefCallback(node) {
    videoRef.current = node;
    if (node && !streamRef.current) {
      startCamera(facingMode);
    } else if (!node) {
      stopStream();
    }
  }

  async function flipCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(dataUrl);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onCapture(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="camera-overlay animate-fade-in">
      {error ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24,
        }}>
          <div style={{ fontSize: 48 }}>📷</div>
          <div style={{ color: 'white', textAlign: 'center', fontSize: 15 }}>{error}</div>
          <label
            htmlFor="fallback-file"
            style={{
              background: 'white', color: '#000', padding: '12px 24px',
              borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            Choose Photo
          </label>
          <input
            id="fallback-file"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button
            onClick={handleClose}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 10 }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRefCallback}
            className="camera-video"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button className="camera-close-btn" onClick={handleClose}>✕</button>
            <button className="camera-capture-btn" onClick={capture} aria-label="Capture photo" />
            <button className="camera-flip-btn" onClick={flipCamera}>🔄</button>
          </div>
        </>
      )}
    </div>
  );
}
