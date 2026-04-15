# 🌾 FARMORA — AI-Powered Smart Farming Platform

FARMORA is a full-stack agricultural advisory web application designed for Indian farmers and traders. It provides real-time mandi prices, AI-based crop advisory, profit simulation, and farm task management — all in a multilingual interface supporting **English**, **Tamil**, and **Hindi**.

---

## 🚀 Live Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Weather widget, crop price cards, pest alerts, daily task checklist |
| 💹 **Market Prices** | Real-time mandi prices filterable by crop, state, and district |
| 🤖 **AI Advisory** | Streaming chatbot powered by OpenAI — answers crop/pest/price questions |
| 🧮 **Profit Simulator** | Input crop + quantity + date → get predicted price, profit & risk level |
| 👤 **Farmer Profile** | State, district, crops, soil type, irrigation, land size, consent settings |
| 🌐 **Multilingual** | Full UI in English, Tamil (தமிழ்), and Hindi (हिंदी) |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** — UI framework and fast build tool
- **TypeScript** — Type-safe development
- **TailwindCSS** + **shadcn/ui** — Styling and component library
- **TanStack Query (React Query v5)** — Server state management and data fetching
- **Zustand** — Global state for language preference (persisted in localStorage)
- **Wouter** — Lightweight client-side routing
- **Recharts** — Price trend charts
- **React Hook Form** + **Zod** — Form handling and validation

### Backend
- **Node.js** + **Express 5** — HTTP server
- **TypeScript** — Full type safety
- **Passport.js** + **express-session** — Session-based authentication
- **Drizzle ORM** — Type-safe database queries
- **better-sqlite3** — SQLite database driver
- **OpenAI SDK** — AI advisory with SSE (Server-Sent Events) streaming

### Shared Layer
- **drizzle-zod** — Auto-generates Zod schemas from Drizzle table definitions
- **shared/** folder — Single source of truth for DB schema, API routes, and TypeScript types used by both client and server

---

## 📁 Project Structure

```
FARMORA/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Dashboard, Prices, Advisory, Simulations, Profile
│       ├── components/      # SidebarLayout, WeatherWidget, PriceChart, UI blocks
│       ├── hooks/           # useAuth, useFarmData, useLanguage, useToast
│       └── lib/             # queryClient, location-data, utils
├── server/                  # Express backend
│   ├── index.ts             # Server entry point (port 5000)
│   ├── routes.ts            # All API route handlers
│   ├── storage.ts           # Database operations (IStorage interface)
│   ├── db.ts                # SQLite connection via Drizzle
│   └── replit_integrations/
│       ├── auth/            # Passport.js session authentication
│       └── chat/            # OpenAI SSE streaming chat routes
├── shared/                  # Shared between client and server
│   ├── schema.ts            # Drizzle table definitions + TypeScript types + Zod schemas
│   ├── routes.ts            # API route contracts (path, method, input schema)
│   └── models/              # auth.ts, chat.ts type models
└── script/
    └── build.ts             # Production build script (Vite + esbuild)
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/farmora.git
cd farmora

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your keys (see below)

# 4. Create the database tables
npm run db:push

# 5. Start the development server
npm run dev
```

The app runs on **http://localhost:5000**

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Database (SQLite by default — leave as is for local development)
DATABASE_URL=file:local.db

# OpenAI API Key (required for AI Advisory feature)
OPENAI_API_KEY=your_openai_api_key_here

# Session secret (any random string)
SESSION_SECRET=your_random_secret_string

# Port (optional, defaults to 5000)
PORT=5000
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`.

---

## 📜 Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build client (Vite) + server (esbuild) for production |
| `npm start` | Run production build |
| `npm run db:push` | Push Drizzle schema to database (creates/updates tables) |
| `npm run check` | TypeScript type check |

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Registered user accounts |
| `profiles` | Farmer details (state, district, crops, soil, metadata) |
| `market_prices` | Mandi crop prices with source and confidence score |
| `simulations` | Profit simulation history per farmer |
| `notifications` | System alerts per user |
| `tasks` | Daily farm task checklist per user |

---

## 🔐 Authentication Flow

1. User visits the app → Landing page shown
2. User logs in → Passport.js creates a session
3. Session cookie sent to browser automatically on every request
4. `isAuthenticated` middleware protects all `/api/*` routes
5. On login, if profile is incomplete → auto-redirected to `/profile`

---

## 🤖 AI Advisory — How Streaming Works

```
User types question
      ↓
POST /api/conversations        (creates conversation)
      ↓
POST /api/conversations/:id/messages  (sends message)
      ↓
Server calls OpenAI Chat Completions API
      ↓
Response streamed via SSE (Server-Sent Events)
      ↓
Frontend reads stream token-by-token
      ↓
Words appear live on screen (like ChatGPT)
```

---

## 💰 Profit Simulator — Algorithm

```
predictedPrice = basePrice(₹2400) × seasonalityFactor × marketVariation
weatherRisk    = sale date > 30 days away ? 0.85 : 0.95
totalRevenue   = quantity × predictedPrice × weatherRisk
profit         = totalRevenue - (quantity × ₹1450 input cost)
riskLevel      = profit > ₹25000 → Low | profit > 0 → Medium | else → High
```

---

## 🌐 Multi-Language Support

Languages are managed via a Zustand store with localStorage persistence.
Translations are defined in `client/src/hooks/use-language.ts`.

| Code | Language |
|---|---|
| `en` | English |
| `ta` | Tamil (தமிழ்) |
| `hi` | Hindi (हिंदी) |

To add a new language: add a new key to the `translations` object in `use-language.ts`.

---

## 🔮 Planned Improvements

- [ ] Real OpenWeatherMap API integration
- [ ] Agmarknet API for live mandi prices
- [ ] PostgreSQL for production deployment
- [ ] WebSocket-based real-time price alerts
- [ ] SMS notifications via Twilio for farmers without smartphones
- [ ] Persistent chat history across sessions
- [ ] Unit tests with Vitest + Playwright E2E tests

---

## 👨‍💻 Author

Built as a full-stack TypeScript project demonstrating:
- Monorepo architecture with shared type-safe contract layer
- SSE-based AI streaming
- Drizzle ORM schema-first development
- Session authentication with Passport.js
- Multilingual React application with Zustand persistence

---

## 📄 License

MIT
