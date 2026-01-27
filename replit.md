# Farmora - Agricultural Intelligence Platform

## Overview

Farmora is a web-first agricultural intelligence platform designed for the Indian market. It serves three user types: Farmers (crop selling decisions), Traders (farmer discovery and connection), and Admin (platform monitoring). The platform provides AI-powered advisory, real-time market prices, profit simulations, and multi-language support (English, Tamil, Hindi).

The application follows a full-stack architecture with a React frontend, Express backend, PostgreSQL database, and integrates with OpenAI for AI advisory features. Authentication is handled through Replit Auth with session-based management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state, Zustand for client state (language preferences)
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom earth-tone theme (greens, browns for agricultural context)
- **Data Visualization**: Recharts for market price charts and trends

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Role-Based Access**: Middleware functions (requireFarmer, requireTrader, requireAdmin) for route protection

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Tables**: users, sessions, profiles, marketPrices, simulations, notifications, conversations, messages
- **Migrations**: Drizzle Kit handles schema migrations to `./migrations` folder

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Features**: Chat-based advisory with deterministic logic layer (trend analysis, volatility calculation) before AI explanations
- **Advisory Logic**: Computes SELL/HOLD/WAIT recommendations based on price trends and volatility before generating explanations
- **Audio Support**: Voice chat capabilities with WebM/Opus recording and PCM16 playback

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level page components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── replit_integrations/  # Auth, chat, audio, image modules
│   └── storage.ts       # Database access layer
├── shared/              # Shared code (types, schemas, routes)
│   ├── schema.ts        # Drizzle table definitions
│   ├── routes.ts        # API route contracts
│   └── models/          # Auth and chat model definitions
```

### Build System
- **Development**: tsx for TypeScript execution with Vite dev server
- **Production**: esbuild bundles server, Vite builds client to `dist/`
- **Scripts**: `npm run dev` for development, `npm run build` for production build

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Required Environment Variables**: ISSUER_URL, REPL_ID, SESSION_SECRET

### AI Services
- **OpenAI API**: Chat completions for advisory, image generation, speech-to-text
- **Required Environment Variables**: AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL

### Third-Party Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **TanStack Query**: Server state management and caching
- **Recharts**: Data visualization for price trends
- **date-fns**: Date formatting and manipulation
- **Zod**: Runtime type validation for API inputs/outputs

### Audio Processing
- **FFmpeg**: Required for audio format conversion (WebM to WAV for speech-to-text)
- **AudioWorklet**: Browser-based PCM16 audio playback for voice responses