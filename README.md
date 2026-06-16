# DevSecOps + AI/ML 95-Day Daily Roadmap Tracker

A state-of-the-art, full-stack learning dashboard designed to manage and track an intensive 95-day study curriculum covering Linux, Cloud, Docker, Kubernetes, DevSecOps Automated pipelines, and AI/ML Deep learning. It splits topics into 5 thematic phases, mapping progress against realistic cloud and orchestration certifications.

---

## 🚀 Key Architectural Aspects

- **Unified Full-Stack Integration:** Express + Vite servers mounted concurrently. Port `3000` serves REST API controllers on `/api/*` and acts as a Single Page Application reverse proxy for React assets.
- **Durable Local Storage:** Powered by a SQLite backend layer utilizing a query-adapter with standard parameters, making downstream database migrations (e.g., PostgreSQL or Supabase) clean and simple.
- **Duolingo-style Streak Engine:** Computes consecutive completed tasks. If you did today or yesterday’s task, your streak remains actively counting.
- **Server-Side Scheduled Cron Daemon:** Integrates `node-cron` to automatically run calendar sweeps at midnight every day. It computes missed days and saves static notification snapshots so clients load stats instantaneously without heavy calculations.
- **Automatic System Theming:** Responsive layout designed with responsive, modern Tailwind CSS supporting native light and dark modes utilizing the CSS `prefers-color-scheme` engine.

---

## 🗄️ Database Table Schemas

SQLite database resides in `database.sqlite` (customizable via `.env` parameter `DB_PATH`) and contains:

1. **`config` Table**
   - Holds persistent parameter configurations.
   - `key` (TEXT PRIMARY KEY) - Key identificator (e.g. `'start_date'`).
   - `value` (TEXT) - Custom value text (e.g. `'2026-06-15'`).

2. **`progress` Table**
   - Records completed roadmap tasks.
   - `day_id` (INTEGER PRIMARY KEY) - Completed day number (Day 1 - 95).
   - `completed_at` (TEXT NOT NULL) - ISO String timestamp.

3. **`notifications` Table**
   - Keeps latest calculations of missed days for instant UI load times.
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT) - Snapshot key.
   - `missed_count` (INTEGER NOT NULL) - Count of days before today left unchecked.
   - `status_message` (TEXT NOT NULL) - Descriptive alert string.
   - `checked_at` (TEXT NOT NULL) - ISO computation timestamp.

---

## 💻 REST API Reference

The following endpoints are mounted cleanly under the `/api` prefix:

| Method | Endpoint | Description | Request/Response payload |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/progress` | Retrieves all completed day IDs + saved start date | `Response: { completed: number[], startDate: string \| null }` |
| **POST** | `/api/progress/toggle` | Toggles completion of a specify day | `Body: { dayId: number }` <br> `Response: { dayId: number, completed: boolean }` |
| **POST** | `/api/start-date` | Sets/changes start date and refreshes calculations | `Body: { date: "YYYY-MM-DD" }` <br> `Response: { success: true, startDate: string }` |
| **POST** | `/api/reset` | Resets checked day completions while preserving start date | `Response: { success: true }` |
| **GET** | `/api/notifications`| Fetches latest server-calculated statistics and alerts | `Response: { missedCount: number, statusMessage: string, checkedAt: string }` |

---

## 🛠️ Step-by-Step Local Run Instructions

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)

### 2. Install Project Dependencies
In your host terminal, run:
```bash
npm install
```

### 3. Establish environmental setups
Copy `.env.example` configurations into an active `.env` file:
```bash
cp .env.example .env
```
Inside `.env`, verify the active bindings:
```env
PORT=3000
DB_PATH=database.sqlite
```

### 4. Boot the Development Full-Stack Environment
To compile in real-time with hot module support and trigger Express controllers simultaneously:
```bash
npm run dev
```
The console will start the server:
- Access development app at: `http://localhost:3000`
- SQLite database `database.sqlite` will be seeded automatically in the project folder with schema definitions.

### 5. Production Host Compilation & Start
To bundle assets for high-performance scale (e.g. deploying to AWS, Render.com or container clusters):
```bash
# Compiles Vite files to /dist and packages server.ts into standalone CommonJS dist/server.cjs
npm run build

# Start the compiled release bundle
npm start
```
The startup runtime will activate on the defined host with zero dependencies.
