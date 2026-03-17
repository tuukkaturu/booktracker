import { useState, useRef } from 'react';
import Camera from './Camera.jsx';
import { SPINE_COLORS } from '../utils/storage.js';
import { formatDuration } from '../utils/notifications.js';
import { sanitizeText, sanitizeNumber } from '../utils/sanitize.js';

export default function BookDetail({ book, onUpdate, onDelete, onBack }) {
  const [editing, setEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(book.currentPage);
  const [notes, setNotes] = useState(book.notes || '');
  const [status, setStatus] = useState(book.status);
  const [showCamera, setShowCamera] = useState(false);
  const [coverImage, setCoverImage] = useState(book.coverImage);
  const [spineColor, setSpineColor] = useState(book.spineColor);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [totalPages, setTotalPages] = useState(book.totalPages);

  // Session timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionStartPage, setSessionStartPage] = useState(book.currentPage);
  const intervalRef = useRef(null);
  const fileRef = useRef(null);

  function startInterval() {
    intervalRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
  }

  function stopInterval() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function save() {
    const pagesRead = Math.max(0, currentPage - sessionStartPage);
    const sessionEntry = timerRunning || sessionSeconds > 0
      ? { date: new Date().toISOString(), seconds: sessionSeconds, pagesRead }
      : null;

    stopInterval();
    onUpdate({
      ...book,
      currentPage: sanitizeNumber(currentPage, 0, 99999),
      notes: sanitizeText(notes, 5000),
      status,
      coverImage,
      spineColor,
      title: sanitizeText(title, 500),
      author: sanitizeText(author, 300),
      totalPages: sanitizeNumber(totalPages, 0, 99999),
      lastReadDate: new Date().toISOString(),
      sessions: sessionEntry
        ? [...(book.sessions || []), sessionEntry]
        : (book.sessions || []),
    });
    setTimerRunning(false);
    setSessionSeconds(0);
    setEditing(false);
    onBack();
  }

  function toggleTimer() {
    if (!timerRunning) {
      setSessionStartPage(currentPage);
      setTimerRunning(true);
      startInterval();
    } else {
      stopInterval();
      setTimerRunning(false);
      save();
    }
  }

  function handleCapture(dataUrl) {
    setCoverImage(dataUrl);
    setShowCamera(false);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCoverImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  const pct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;
  const pagesLeft = Math.max(0, totalPages - currentPage);
  const totalSessionSeconds = (book.sessions || []).reduce((acc, s) => acc + (s.seconds || 0), 0);

  function handleBack() {
    stopInterval();
    onBack();
  }

  if (showCamera) {
    return <Camera onCapture={handleCapture} onClose={() => setShowCamera(false)} />;
  }

  return (
    <div className="screen animate-slide-up">
      <div className="screen-header" style={{ paddingBottom: 12 }}>
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: 'auto' }}
          onClick={() => editing ? save() : setEditing(true)}
        >
          {editing ? '💾 Save' : '✏️ Edit'}
        </button>
      </div>

      {/* Cover / header */}
      <div
        className="detail-cover"
        style={{ '--spine-color': spineColor }}
        onClick={editing ? () => setShowCamera(true) : undefined}
      >
        {coverImage ? (
          <img src={coverImage} alt={title} />
        ) : (
          <div
            className="detail-cover-placeholder"
            style={{ background: `linear-gradient(135deg, ${spineColor}66, ${spineColor}22)` }}
          >
            📖
          </div>
        )}
        <div className="detail-cover-overlay">
          {editing ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: 'auto', fontSize: 12 }}
                onClick={e => { e.stopPropagation(); setShowCamera(true); }}
              >
                📷 Camera
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: 'auto', fontSize: 12 }}
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              >
                🖼️ Gallery
              </button>
              {coverImage && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: 'auto', fontSize: 12 }}
                  onClick={e => { e.stopPropagation(); setCoverImage(null); }}
                >
                  ✕
                </button>
              )}
            </div>
          ) : null}
          {editing ? (
            <input
              className="form-input"
              style={{ marginBottom: 6, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700 }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="detail-title">{title}</div>
          )}
          {editing ? (
            <input
              className="form-input"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Author"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="detail-author">{author || 'Unknown author'}</div>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* Status */}
      {editing && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
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
      )}

      {/* Progress */}
      <div className="progress-card">
        <div className="progress-card-header">
          <div className="progress-card-title">Progress</div>
          <div className="progress-fraction">{currentPage} / {totalPages || '?'}</div>
        </div>
        <div className="progress-bar-lg">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="progress-percentage">{pct}% complete · {pagesLeft} pages left</div>
      </div>

      {/* Page stepper */}
      <div className="page-stepper">
        <button
          className="stepper-btn"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
        >−</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <input
            className="stepper-input"
            type="number"
            inputMode="numeric"
            value={currentPage}
            onChange={e => setCurrentPage(Math.max(0, Math.min(totalPages || 99999, parseInt(e.target.value) || 0)))}
          />
          {editing && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <div className="form-label">Total Pages</div>
                <input
                  className="form-input"
                  type="number"
                  inputMode="numeric"
                  value={totalPages}
                  onChange={e => setTotalPages(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
          <div className="stepper-label">current page</div>
        </div>
        <button
          className="stepper-btn"
          onClick={() => setCurrentPage(p => p + 1)}
        >+</button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{(book.sessions || []).length}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {totalSessionSeconds > 3600
              ? `${Math.floor(totalSessionSeconds / 3600)}h`
              : `${Math.floor(totalSessionSeconds / 60)}m`}
          </div>
          <div className="stat-label">Reading time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pct}%</div>
          <div className="stat-label">Complete</div>
        </div>
      </div>

      {/* Session timer */}
      <div className="session-timer">
        <div className={`session-time-display ${timerRunning ? 'running' : ''}`}>
          {formatDuration(sessionSeconds)}
        </div>
        <div className="session-controls">
          <button
            className={`btn ${timerRunning ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: 'auto', gap: 6 }}
            onClick={toggleTimer}
          >
            {timerRunning ? '⏹ Stop & Save' : '▶ Start Session'}
          </button>
          {!timerRunning && sessionSeconds > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSessionSeconds(0)}
            >
              Reset
            </button>
          )}
        </div>
        {timerRunning && (
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>
            Starting from page {sessionStartPage}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="notes-card">
        <div className="form-label" style={{ marginBottom: 8 }}>Notes &amp; Thoughts</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Jot down your thoughts, favorite quotes, reflections…"
        />
      </div>

      {/* Spine color picker (edit mode) */}
      {editing && (
        <div style={{ marginBottom: 14 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>Spine Color</div>
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
      )}

      {!editing && (
        <button className="btn" onClick={save} style={{
          background: 'var(--primary)',
          color: '#0B0B14',
          fontWeight: 700,
          boxShadow: '0 4px 16px var(--primary-glow)',
          marginBottom: 8,
        }}>
          💾 Save Progress
        </button>
      )}

      {/* Danger zone */}
      <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-danger" onClick={() => {
          if (window.confirm(`Remove "${title}" from your library?`)) onDelete(book.id);
        }}>
          🗑 Remove Book
        </button>
      </div>
    </div>
  );
}
