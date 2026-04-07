/**
 * Call our own server-side proxy endpoint which holds the Gemini key.
 * The API key is never present in the browser.
 */
export async function identifyBookFromImage(dataUrl) {
  // Strip data-URL prefix to get raw base64 + mime type
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';

  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const endpoint = apiBase
    ? `${apiBase}/api/identify-book`
    : '/.netlify/functions/identify-book';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType, data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Server error ${res.status}`);
  }

  const json = await res.json();
  return {
    title:  (json.title  ?? '').trim(),
    author: (json.author ?? '').trim(),
  };
}
