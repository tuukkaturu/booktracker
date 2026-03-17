import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getBooks, saveBooks, getSettings, saveSettings } from '../utils/storage.js';
import { scheduleReminder, clearScheduledReminder } from '../utils/notifications.js';

// Register service worker at module load — no useEffect needed
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

export const useStore = create(
  subscribeWithSelector((set) => ({
    books: getBooks(),
    settings: getSettings(),
    screen: 'library',
    selectedBook: null,

    addBook(book) {
      set(s => ({ books: [book, ...s.books], screen: 'library' }));
    },
    updateBook(updated) {
      set(s => ({
        books: s.books.map(b => b.id === updated.id ? updated : b),
        selectedBook: updated,
      }));
    },
    deleteBook(id) {
      set(s => ({
        books: s.books.filter(b => b.id !== id),
        screen: 'library',
        selectedBook: null,
      }));
    },
    selectBook(book) {
      set({ selectedBook: book, screen: 'book-detail' });
    },
    setScreen(screen) {
      set({ screen });
    },
    updateSettings(settings) {
      set({ settings });
    },
    clearData() {
      localStorage.clear();
      set({ books: [], settings: getSettings(), screen: 'library', selectedBook: null });
    },
  }))
);

// ── Side-effect subscriptions (replaces useEffect in components) ──────────

// Persist books whenever they change
useStore.subscribe(
  s => s.books,
  books => saveBooks(books)
);

// Persist settings + manage reading reminders
useStore.subscribe(
  s => s.settings,
  settings => {
    saveSettings(settings);
    if (settings.reminderEnabled) {
      scheduleReminder(settings.reminderTime, "Time to keep reading! 📖");
    } else {
      clearScheduledReminder();
    }
  }
);
