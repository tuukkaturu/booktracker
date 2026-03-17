import { useState } from 'react';
import BookCard from './BookCard.jsx';
import { hasReadToday } from '../utils/notifications.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'reading', label: '📖 Reading' },
  { key: 'finished', label: '✅ Finished' },
  { key: 'want-to-read', label: '🔖 Wishlist' },
];

export default function Library({ books, onSelectBook, onAddBook }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const needsNudge = books.some(
    b => b.status === 'reading' && !hasReadToday(b.lastReadDate)
  );

  const visible = books.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="screen animate-fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-title">My Library</div>
          <div className="screen-subtitle">{books.length} book{books.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {needsNudge && books.length > 0 && (
        <div className="nudge-banner" onClick={() => {
          const inProgress = books.find(b => b.status === 'reading');
          if (inProgress) onSelectBook(inProgress);
        }}>
          <span className="nudge-icon">🕯️</span>
          <div>
            <div className="nudge-title">Time to read!</div>
            <div className="nudge-desc">You haven't logged any reading today.</div>
          </div>
        </div>
      )}

      {books.length > 0 && (
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by title or author…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button style={{ color: 'var(--text-3)', fontSize: 18 }} onClick={() => setQuery('')}>✕</button>
          )}
        </div>
      )}

      <div className="shelf-filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          {books.length === 0 ? (
            <>
              <div className="empty-state-title">Your shelf is empty</div>
              <div className="empty-state-desc">
                Add your first book to start tracking your reading journey.
              </div>
              <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={onAddBook}>
                + Add a Book
              </button>
            </>
          ) : (
            <>
              <div className="empty-state-title">No matches</div>
              <div className="empty-state-desc">Try a different filter or search term.</div>
            </>
          )}
        </div>
      ) : (
        <div className="library-shelf">
          {visible.map(book => (
            <BookCard key={book.id} book={book} onClick={() => onSelectBook(book)} />
          ))}
        </div>
      )}
    </div>
  );
}
