export default function Navigation({ screen, setScreen }) {
  return (
    <nav className="nav">
      <button
        className={`nav-btn ${screen === 'library' ? 'active' : ''}`}
        onClick={() => setScreen('library')}
      >
        <span className="nav-btn-icon">📚</span>
        <span className="nav-btn-label">Library</span>
      </button>

      <button
        className="nav-add-btn"
        onClick={() => setScreen('add-book')}
        aria-label="Add book"
      >
        +
      </button>

      <button
        className={`nav-btn ${screen === 'settings' ? 'active' : ''}`}
        onClick={() => setScreen('settings')}
      >
        <span className="nav-btn-icon">⚙️</span>
        <span className="nav-btn-label">Settings</span>
      </button>
    </nav>
  );
}
