const BOOKS_KEY = 'bt_books';
const SETTINGS_KEY = 'bt_settings';

export function getBooks() {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function defaultSettings() {
  return {
    reminderEnabled: false,
    reminderTime: '20:00',
    dailyGoal: 30,
    notifPermission: 'default',
  };
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const SPINE_COLORS = [
  '#7C3D52',
  '#2D5A7B',
  '#3D6B4F',
  '#6B4C7B',
  '#7B5C2D',
  '#2D5A6B',
  '#5A3D7B',
  '#7B4C2D',
  '#3D5A7B',
  '#5C7B2D',
];

export function randomSpineColor() {
  return SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)];
}
