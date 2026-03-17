import { useStore } from './store/index.js';
import Library from './components/Library.jsx';
import AddBook from './components/AddBook.jsx';
import BookDetail from './components/BookDetail.jsx';
import Settings from './components/Settings.jsx';
import Navigation from './components/Navigation.jsx';

function App() {
  const screen       = useStore(s => s.screen);
  const selectedBook = useStore(s => s.selectedBook);
  const books        = useStore(s => s.books);
  const settings     = useStore(s => s.settings);
  const { addBook, updateBook, deleteBook, selectBook, setScreen, updateSettings, clearData } = useStore();

  return (
    <>
      {screen === 'library' && (
        <Library
          books={books}
          onSelectBook={selectBook}
          onAddBook={() => setScreen('add-book')}
        />
      )}
      {screen === 'add-book' && (
        <AddBook
          onSave={addBook}
          onClose={() => setScreen('library')}
        />
      )}
      {screen === 'book-detail' && selectedBook && (
        <BookDetail
          book={selectedBook}
          onUpdate={updateBook}
          onDelete={deleteBook}
          onBack={() => setScreen('library')}
        />
      )}
      {screen === 'settings' && (
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          books={books}
          onClearData={clearData}
        />
      )}
      <Navigation screen={screen} setScreen={setScreen} />
    </>
  );
}

export default App;
