# 📚 BookTracker

Your personal reading companion—because books deserve better than a stack on the nightstand.

A beautiful, fully-featured PWA for tracking your reading progress, celebrating your bookshelf, and never losing momentum on that book you've been meaning to finish for the past 6 months.

**Works on desktop, tablet, and mobile** · Install as an app from your home screen · No login required

---

## ✨ What You Can Do

- **📖 Build your library** — Add any book, track where you are in it, mark it as reading/finished. No pressure, no judgment.
- **⏱️ Time your sessions** — Built-in timer tracks how long you actually spend reading (turns out 20 minutes feels longer than you think)
- **🎨 Color-code your books** — Give each book a unique spine color. Your shelf actually looks beautiful now.
- **📷 Scan book covers with AI** — Can't remember the title? Point your camera at the cover. Gemini 2.0 Flash figures it out instantly.
- **🔔 Get daily nudges** — Set a reminder for your preferred reading time. Gentle pushes to keep the momentum going.
- **📊 Track your progress** — Graphs aren't everything, but seeing "120 pages read this month" hits different.
- **📝 Save thoughts** — Jot down quotes, reactions, or just "omg plot twist" for each book.
- **💾 Works offline** — Your library lives entirely on your device. No cloud, no servers (except Gemini, which is optional), no tracking.
- **🏠 Install as an app** — Taps your home screen like a real app. You'll forget it's a website.

---

## 🛠️ Built With

- **Bun** — Fast runtime, package manager, _and_ backend server. Why split the team when one can do it all?
- **Vite 8 + React 19** — Instant hot reload. Seriously, you'll change a color and it's updated before you move your mouse.
- **Zustand 5** — Honest state management. No boilerplate, no ceremony. Just works.
- **Gemini 2.0 Flash Lite** — Book covers → book data in milliseconds (when your phone can reach the internet)
- **CSS Custom Properties** — Handcrafted "Midnight Reading Nook" theme. No Tailwind overhead, just color variables and good taste.
- **PWA + Service Worker** — Works offline, runs on your home screen, and syncs with your other devices (read: localStorage is your database)
- **Web APIs** — Camera, Notifications, Storage. Learned to use them properly so you don't have to.

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed

### Installation

```bash
git clone https://github.com/yourusername/booktracker.git
cd booktracker
bun install
```

### Environment Setup

Create a `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free Gemini API key at https://aistudio.google.com/app/apikey

### Local Development

**Terminal 1 — Backend:**

```bash
bun run dev:server
```

**Terminal 2 — Frontend:**

```bash
bun run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
bun run build
```

---

## 💡 Why This Exists

Reading apps used to mean clunky reviews on Goodreads or empty promises to yourself about tracking pages. BookTracker is different because **it stays in your pocket, never asks for login, and respects your privacy**. Every word of your library lives _on your device_, not some server paying for ad tech.

Plus, it's just _nice_ to use. Dark theme. Fast. No notifications asking you to write reviews. Just you and your books.

## 📱 Test It on Your Phone

Your PC is boring—let's see this on an actual phone.

### Quick Test (No HTTPS)

```bash
# Already listening on your local WiFi
bun run dev
```

Find your PC's IP and open on your phone. **Note:** Camera & notifications need `https://`, so this won't work for scanning covers.

### Full Power (via Tunnel)

For camera, notifications, and app installation to work:

```bash
bunx cloudflared tunnel --url http://localhost:5173
```

Copy the `https://` URL. Works anywhere, no port forwarding, just magic.

---

## � Deploy It (It's Easier Than You Think)

Five minutes on Vercel + five minutes on Fly.io and you're live.

**Frontend:** Push to GitHub → connect to Vercel → auto-deploys. That's it. (Netlify works too.)

**Backend:** Same story. Use Fly.io's free tier or Railway. Set `GEMINI_API_KEY` as a secret and you're done.

Your bookshelf is now on the internet, with zero downtime and HTTPS by default.

---

## � Security & Privacy

Your data is yours. Here's how we keep it that way:

- **Your API key never touches your phone.** Bun backend holds it server-side. Gemini only talks to us.
- **Input gets validated.** No weird characters, no buffer overflows, no surprise injections.
- **Rate limiting keeps bots out.** 10 requests per minute per IP. Fair, but firm.
- **Security headers on everything.** CSP, CORS, X-Frame-Options, the whole arsenal.
- **Offline first.** Your library doesn't need internet to exist. Gemini scanning does, but that's it.

TL;DR: We're paranoid about your privacy so you don't have to be.

---

## 📝 Project Structure

```
booktracker/
├── src/
│   ├── App.jsx, index.css
│   ├── store/ (Zustand)
│   ├── components/ (7 components)
│   └── utils/ (storage, notifications, vision, sanitize)
├── public/ (PWA manifest, service worker)
├── server.js (Bun backend proxy)
├── vite.config.js
└── package.json
```

---

## 📖 How to Use It

**Adding a book:** Type it in, or snap a photo of the cover. Both work. No judgment if you forget titles.

**Reading sessions:** Start the timer when you sit down. When you're done, tap "Save Progress" and you're back at your shelf. The app remembers everything.

**Reminders:** Set a time. Get a notification. You'll actually read it because the reminder feels personal, not corporate.

**Stats:** Check how many pages you've read this month. Watch the number go up. Feels good.

**Offline:** Internet went out? Still works. Syncs when you're back online. (Except AI scanning—that needs the cloud.)

---

## 🤝 Found a Bug? Have an Idea?

This is open source. It's yours to fork, break, and improve.

1. Make a branch with a cool name
2. Make your changes
3. Push and open a PR
4. We'll probably merge it

---

## 📄 License

MIT. Build whatever you want.

---

## 🙏 Thanks

- **Gemini API** for making book scanning actually work
- **Bun** for being stupidly fast
- **Vite** for instant hot reload (dev experience matters)
- **Zustand** for state management without the cruft
- You for actually reading this far

---

**Made for people who love books and hate clunky apps.**

**Happy reading.** 📚🌙
