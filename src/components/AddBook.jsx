import { useState, useRef } from 'react';
import Camera from './Camera.jsx';
import { generateId, randomSpineColor, SPINE_COLORS } from '../utils/storage.js';
import { identifyBookFromImage } from '../utils/vision.js';
import { sanitizeText, sanitizeNumber } from '../utils/sanitize.js';

export default function AddBook({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('0');
  const [status, setStatus] = useState('reading');
  const [coverImage, setCoverImage] = useState(null);
  const [spineColor, setSpineColor] = useState(randomSpineColor());
  const [showCamera, setShowCamera] = useState(false);
  const [scanMode, setScanMode] = useState(false); // true = camera opened in scan mode
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const fileRef = useRef(null);
  const scanFileRef = useRef(null);

  async function runScan(dataUrl) {
    setScanning(true);
    setScanError(null);
    setCoverImage(dataUrl);
    try {
      const result = await identifyBookFromImage(dataUrl);
      if (result.title) setTitle(result.title);
      if (result.author) setAuthor(result.author);
      if (!result.title && !result.author) setScanError('Couldn\'t identify the book. Fill in the details manually.');
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  }

  function handleCapture(dataUrl) {
    if (scanMode) {
      setScanMode(false);
      setShowCamera(false);
      runScan(dataUrl);
    } else {
      setCoverImage(dataUrl);
      setShowCamera(false);
    }
  }

  function handleScanFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => runScan(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCoverImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!title.trim()) return;
    const book = {
      id: generateId(),
      title: sanitizeText(title, 500),
      author: sanitizeText(author, 300),
      totalPages: sanitizeNumber(totalPages, 0, 99999),
      currentPage: sanitizeNumber(currentPage, 0, 99999),
      status,
      coverImage,
      spineColor,
      addedDate: new Date().toISOString(),
      lastReadDate: null,
      notes: '',
      sessions: [],
    };
    onSave(book);
  }

  if (showCamera) {
    return <Camera onCapture={handleCapture} onClose={() => { setShowCamera(false); setScanMode(false); }} />;
  }

  return (
    <div className="screen animate-slide-up">
      <div className="screen-header">
        <button className="back-btn" onClick={onClose}>← Back</button>
        <div className="screen-title">Add Book</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="form-section">
        {/* ── AI Scan Card ────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,115,255,0.12), rgba(212,168,83,0.1))',
          border: '1px solid rgba(139,115,255,0.25)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🔍</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Scan Book Cover</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>AI identifies title &amp; author automatically</div>
            </div>
          </div>

          {scanning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid var(--accent)',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Asking Gemini to identify the book…</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, gap: 6 }}
                onClick={() => { setScanMode(true); setShowCamera(true); }}
              >
                📷 Camera Scan
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, gap: 6 }}
                onClick={() => scanFileRef.current?.click()}
              >
                🖼️ Photo Scan
              </button>
            </div>
          )}

          {scanError && (
            <div style={{ fontSize: 12, color: 'var(--coral)' }}>{scanError}</div>
          )}
          {title && !scanning && (
            <div style={{ fontSize: 12, color: 'var(--success)' }}>
              ✓ Found: <strong>{title}</strong>{author ? ` by ${author}` : ''}
            </div>
          )}
        </div>

        <input
          ref={scanFileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleScanFileInput}
        />

        {/* Cover photo */}
        <div className="form-group">
          <div className="form-label">Cover Photo</div>
          <div className="camera-trigger" onClick={() => setShowCamera(true)}>
            {coverImage && <img src={coverImage} alt="Cover preview" />}
            {!coverImage && (
              <>
                <span className="camera-trigger-icon">📷</span>
                <span className="camera-trigger-label">Tap to take photo or browse</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCamera(true)} style={{ flex: 1 }}>
              📷 Camera
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} style={{ flex: 1 }}>
              🖼️ Gallery
            </button>
            {coverImage && (
              <button className="btn btn-danger btn-sm" onClick={() => setCoverImage(null)} style={{ flex: 'none' }}>
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="book-title">Title *</label>
          <input
            id="book-title"
            className="form-input"
            placeholder="Book title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Author */}
        <div className="form-group">
          <label className="form-label" htmlFor="book-author">Author</label>
          <input
            id="book-author"
            className="form-input"
            placeholder="Author name"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />
        </div>

        {/* Pages row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="total-pages">Total Pages</label>
            <input
              id="total-pages"
              className="form-input"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 320"
              value={totalPages}
              onChange={e => setTotalPages(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="current-page">Current Page</label>
            <input
              id="current-page"
              className="form-input"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={currentPage}
              onChange={e => setCurrentPage(e.target.value)}
            />
          </div>
        </div>

        {/* Status */}
        <div className="form-group">
          <div className="form-label">Status</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'reading', label: '📖 Reading' },
              { key: 'want-to-read', label: '🔖 Wishlist' },
              { key: 'finished', label: '✅ Finished' },
            ].map(s => (
              <button
                key={s.key}
                className={`filter-chip ${status === s.key ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setStatus(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spine color */}
        <div className="form-group">
          <div className="form-label">Spine Color</div>
          <div className="color-picker">
            {SPINE_COLORS.map(c => (
              <button
                key={c}
                className={`color-swatch ${spineColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setSpineColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!title.trim()}
          style={{ marginTop: 8, opacity: title.trim() ? 1 : 0.5 }}
        >
          Add to Library
        </button>
      </div>
    </div>
  );
}
