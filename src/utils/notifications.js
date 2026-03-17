export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

export function hasReadToday(lastReadDate) {
  if (!lastReadDate) return false;
  const today = new Date().toDateString();
  return new Date(lastReadDate).toDateString() === today;
}

let _reminderTimeout = null;

export function scheduleReminder(time, message) {
  clearScheduledReminder();
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  _reminderTimeout = setTimeout(() => {
    showNotification(message);
    scheduleReminder(time, message);
  }, delay);
}

export function clearScheduledReminder() {
  if (_reminderTimeout) {
    clearTimeout(_reminderTimeout);
    _reminderTimeout = null;
  }
}

export function showNotification(message) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('📚 BookTracker', {
      body: message,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: 'reading-reminder',
    });
  }
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
