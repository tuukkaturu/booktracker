const STATUS_LABELS = {
  reading: 'Reading',
  finished: 'Finished',
  'want-to-read': 'Want to read',
};

export default function BookCard({ book, onClick }) {
  const pct = book.totalPages > 0
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div
      className="book-card animate-slide-up"
      style={{ '--spine-color': book.spineColor }}
      onClick={onClick}
    >
      <div className="book-spine-thumb">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} />
        ) : (
          <div
            className="book-spine-thumb-placeholder"
            style={{ background: `${book.spineColor}33` }}
          >
            📖
          </div>
        )}
      </div>

      <div className="book-card-body">
        <div className="book-card-title">{book.title}</div>
        <div className="book-card-author">{book.author || 'Unknown author'}</div>

        {book.status !== 'want-to-read' && (
          <>
            <div className="book-progress-bar">
              <div
                className="book-progress-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="book-progress-text">
              {book.currentPage} / {book.totalPages} pages · {pct}%
            </div>
          </>
        )}
      </div>

      <span className={`book-status-badge badge-${book.status === 'want-to-read' ? 'want' : book.status}`}>
        {STATUS_LABELS[book.status]}
      </span>
    </div>
  );
}
