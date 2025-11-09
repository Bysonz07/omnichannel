# Omnichannel Stock Monitor (Next.js)

This is a minimal Next.js (app-router) project to monitor incoming/outgoing stock, visualize trends, and import data from CSV/Excel files.

Quick start (Windows cmd.exe):

1. Install dependencies:

   npm install

2. Run dev server:

   npm run dev

3. Open http://localhost:3000

Features:
- Dashboard (app router) with chart and recent transaction table
- Import CSV (.csv) and Excel (.xlsx/.xls) using the Import button
- Uses localStorage to persist imported transactions in the browser

CSV/Excel expected columns (recommended):
- date (YYYY-MM-DD or other parsable format)
- sku (optional)
- type (incoming|outgoing) or direction (in|out)
- qty (number)

The importer will try to infer common column names.

Notes:
- This is a small starter app; extend with server-side APIs and DB for production.

## Sakura assistant (Gemini RAG)

The floating Sakura chat assistant uses Google Gemini with context from your uploaded stock and sales datasets.

1. Create a `.env.local` file (or set environment variables in your hosting provider) with:

   ```bash
   GEMINI_API_KEY=your-google-gemini-key
   # Optional (defaults to gemini-1.5-flash)
   GEMINI_MODEL=gemini-1.5-flash
   ```

2. Restart `npm run dev` after changing env variables so Next.js can pick them up.

The assistant calls `/api/chat`, which retrieves data via `lib/data-store.ts`, assembles a lightweight RAG prompt, and streams the answer back to the overlay UI.
