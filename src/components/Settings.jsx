import { useState } from 'react';
import { requestPermission, scheduleReminder, clearScheduledReminder } from '../utils/notifications.js';

export default function Settings({ settings, onUpdate, books, onClearData }) {
  const [permStatus, setPermStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  async function handlePermissionRequest() {
    const result = await requestPermission();
    setPermStatus(result);
    if (result === 'granted' && settings.reminderEnabled) {
      scheduleReminder(settings.reminderTime, "Time to keep reading! 📖");
    }
    onUpdate({ ...settings, notifPermission: result });
  }

  function handleReminderToggle(enabled) {
    const next = { ...settings, reminderEnabled: enabled };
    onUpdate(next);
    if (enabled && permStatus === 'granted') {
      scheduleReminder(settings.reminderTime, "Time to keep reading! 📖");
    } else {
      clearScheduledReminder();
    }
  }

  function handleReminderTime(time) {
    const next = { ...settings, reminderTime: time };
    onUpdate(next);
    if (settings.reminderEnabled && permStatus === 'granted') {
      scheduleReminder(time, "Time to keep reading! 📖");
    }
  }

  const totalBooks = books.length;
  const readingBooks = books.filter(b => b.status === 'reading').length;
  const finishedBooks = books.filter(b => b.status === 'finished').length;
  const totalPages = books.reduce((a, b) => a + (b.currentPage || 0), 0);
  const totalSessions = books.reduce((a, b) => a + (b.sessions?.length || 0), 0);
  const totalMins = books.reduce((a, b) => {
    const secs = (b.sessions || []).reduce((s, sess) => s + (sess.seconds || 0), 0);
    return a + secs;
  }, 0) / 60;

  return (
    <div className="screen animate-fade-in">
      <div className="screen-header">
        <div className="screen-title">Settings</div>
      </div>

      {/* Stats overview */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: 14,
          }}
        >
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>
            Your Reading Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { value: totalBooks, label: 'Books in library' },
              { value: readingBooks, label: 'Currently reading' },
              { value: finishedBooks, label: 'Books finished' },
              { value: Math.round(totalPages).toLocaleString(), label: 'Pages read' },
              { value: totalSessions, label: 'Sessions logged' },
              { value: `${Math.round(totalMins)}m`, label: 'Time reading' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="settings-section">
        <div className="settings-section-title">Reminders</div>

        {permStatus !== 'granted' && permStatus !== 'unsupported' && (
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Enable Notifications</div>
              <div className="settings-row-desc">Required for reading reminders</div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: 'auto', flexShrink: 0 }}
              onClick={handlePermissionRequest}
            >
              Allow
            </button>
          </div>
        )}

        {permStatus === 'unsupported' && (
          <div className="settings-row">
            <div className="settings-row-desc">
              Notifications are not supported in this browser.
            </div>
          </div>
        )}

        {permStatus === 'denied' && (
          <div className="settings-row">
            <div className="settings-row-desc" style={{ color: 'var(--coral)' }}>
              Notifications are blocked. Please allow them in your browser settings.
            </div>
          </div>
        )}

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Daily reminder</div>
            <div className="settings-row-desc">Get a nudge to read each day</div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.reminderEnabled}
              onChange={e => handleReminderToggle(e.target.checked)}
              disabled={permStatus !== 'granted'}
            />
            <div className="toggle-track" />
          </label>
        </div>

        {settings.reminderEnabled && (
          <div className="settings-row">
            <div className="settings-row-label">Reminder time</div>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={e => handleReminderTime(e.target.value)}
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                color: 'var(--text)',
                padding: '8px 12px',
                fontSize: 14,
              }}
            />
          </div>
        )}
      </div>

      {/* Reading goal */}
      <div className="settings-section">
        <div className="settings-section-title">Reading Goal</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Daily page goal</div>
            <div className="settings-row-desc">Pages you aim to read each day</div>
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={settings.dailyGoal}
            onChange={e => onUpdate({ ...settings, dailyGoal: parseInt(e.target.value) || 0 })}
            style={{
              width: 70,
              background: 'var(--surface-3)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              color: 'var(--text)',
              padding: '8px 12px',
              fontSize: 15,
              textAlign: 'center',
            }}
          />
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <div className="settings-section-title">About</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">BookTracker</div>
            <div className="settings-row-desc">Your personal reading companion · v1.0</div>
          </div>
          <span style={{ fontSize: 24 }}>📚</span>
        </div>
      </div>

      {/* Danger zone */}
      <div className="settings-section" style={{ marginBottom: 8 }}>
        <div className="settings-section-title">Data</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label" style={{ color: 'var(--coral)' }}>Clear all data</div>
            <div className="settings-row-desc">Remove all books and reset settings</div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            style={{ width: 'auto', flexShrink: 0 }}
            onClick={() => {
              if (window.confirm('This will delete all your books and data. Are you sure?')) {
                onClearData();
              }
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
