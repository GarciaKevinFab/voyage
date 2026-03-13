# VOYAGE

A luxury digital travel journal that transforms your adventures into beautifully crafted books. Capture destinations, stories, music, and memories in an elegant flipbook format with AI-powered narrative generation.

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion
- **Backend:** FastAPI (Python)
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **AI:** Claude API for narrative generation
- **Maps:** Leaflet with custom styled tiles
- **Music:** iTunes Search API integration

## Features

- Interactive bookshelf with 3D spine animations and book management
- AI-powered travel narrative generation via Claude
- Flipbook reader with realistic page-turn animations
- Interactive map integration with Leaflet for pinning destinations
- iTunes music search to attach songs to journal entries
- Book interior editor for composing and arranging pages
- Dashboard with trip statistics and overview
- Dust particle effects and gold shimmer animations
- Fully responsive luxury design system

## Prerequisites

- Node.js 20+
- Python 3.11+

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/voyage.git
cd voyage
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Navigate to `http://localhost:5173` in your browser.

## Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for narrative generation |
| `DATABASE_URL` | Database connection string (defaults to SQLite locally) |
| `CORS_ORIGINS` | Allowed frontend origins (e.g. `http://localhost:5173`) |

## Deployment

### Backend (Railway)

1. Push your repository to GitHub.
2. Create a new project on [Railway](https://railway.app).
3. Connect your GitHub repo and select the `backend/` directory as the root.
4. Add environment variables (`ANTHROPIC_API_KEY`, `DATABASE_URL`, `CORS_ORIGINS`).
5. Railway will detect the `Dockerfile` and deploy automatically.

### Frontend (Netlify)

1. Create a new site on [Netlify](https://netlify.com).
2. Connect your GitHub repo.
3. Set the build command to `npm run build` and the publish directory to `dist`.
4. Set the base directory to `frontend/`.
5. Add the backend URL as an environment variable if needed (`VITE_API_URL`).
6. Deploy.

## Design System

| Token | Value | Usage |
|---|---|---|
| Cream | `#F5F0E8` | Primary background, text on dark |
| Black | `#0A0A0A` | Primary dark background |
| Gold | `#C9A96E` | Accents, interactive elements |
| Gold Light | `#E8D5A3` | Hover states, highlights |
| Gold Dark | `#A07840` | Pressed states, scrollbar |
| Serif Font | Cormorant Garamond | Headings, book titles |
| Sans Font | Josefin Sans | Body text, UI elements |

## License

MIT
