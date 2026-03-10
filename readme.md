# 🎬 FREEFLIX 1.0
**Premium Streaming Experience for Sierra Leone**

FREEFLIX 1.0 is a high-performance, mobile-first web application designed to deliver movies, series, and local content (Nollywood/Salone) with a sleek, neon-inspired interface. Built for speed and security, it features a custom administrative dashboard and real-time content synchronization.

---

## 🚀 Key Features

* **⚡ Ultra-Fast Loading:** Optimized for mobile data with lazy-loading images and parallel API fetching.
* **📺 Multi-Episode Support:** Integrated "Series" logic allowing for easy episode selection within a single player.
* **🔍 Live Search:** Real-time filtering of the entire library as you type.
* **🔑 Secure Admin Suite:** A hidden dashboard (Shift + A) for publishing, editing, and deleting content.
* **📥 TMDB Integration:** One-click "Import" feature that pulls movie titles and posters directly from The Movie Database.
* **📱 PWA Ready:** Installable on Android and iOS devices with a custom splash screen and app icon.
* **🔗 QR Sharing:** Built-in QR generator to quickly share the app with friends.

---

## 🛠️ Technical Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5 / CSS3** | Structure and custom Neon UI |
| **Tailwind CSS** | Modern, responsive styling |
| **JavaScript (ES6+)** | Dynamic logic and API management |
| **Supabase (PostgreSQL)** | Real-time database for content storage |
| **TMDB API** | Trending global movie data |
| **Dropbox API** | Secure video stream hosting |
| **Vercel** | Global hosting and Edge deployment |

---

## 🛠️ Installation & Setup

1.  **Clone the project:** Download the source files (`index.html`, `script.js`, `style.css`, `manifest.json`).
2.  **Database Configuration:** * Create a Supabase project.
    * Add a `movies` table with columns: `title` (text), `category` (text), `poster_url` (text), `dropbox_url` (text), and `episodes` (jsonb).
3.  **Deploy to Vercel:**
    * Upload the files to a new Vercel project.
    * Set Environment Variables for `SUPABASE_URL`, `SUPABASE_KEY`, and `TMDB_KEY`.

---

## 🔒 Admin Access
To manage content on the live site:
1.  Press **`Shift + A`** on your keyboard.
2.  Enter the secure access code (Default: `232`).
3.  Use the top bar to publish new movies or series.

---

## 👨‍💻 Developer
**Mohamed Bai Kamara (Pa Kamara)** *ICT Instructor & Tech Entrepreneur* Freetown, Sierra Leone 🇸🇱