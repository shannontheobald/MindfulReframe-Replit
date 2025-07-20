# Mindful Reframe Application

## Overview

This is a full-stack web application called "Mindful Reframe" that helps users transform limiting beliefs into empowering thoughts through guided reflection and visualization. The application consists of a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database using Drizzle ORM.

**Current Status:** Phase 1, 2 & 3 Complete - Homepage, Intake Form, Journal Analysis, and Interactive Reframing Chatbot

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Driver**: Neon serverless driver for PostgreSQL
- **Validation**: Zod schemas for request/response validation
- **Session Management**: In-memory storage (production-ready for database sessions)

## Key Components

### Database Schema
- **Users Table**: Stores user authentication data (id, username, password)
- **Intake Responses Table**: Stores user's responses to 5 intake questions with timestamps
- **Journal Sessions Table**: Stores journal entries with AI-detected thoughts and cognitive distortions
- **Reframing Sessions Table**: Stores interactive chat sessions for guided thought reframing

### API Endpoints
- `POST /api/intake` - Create new intake response
- `GET /api/intake/:userId` - Retrieve intake response by user ID
- `POST /api/sessions/analyze` - Analyze journal entry with OpenAI and create session
- `GET /api/sessions/:userId` - Get all journal sessions for user
- `GET /api/sessions/detail/:sessionId` - Get specific journal session details
- `POST /api/reframing/start` - Start new interactive reframing session
- `POST /api/reframing/:sessionId/chat` - Send message in reframing chat
- `GET /api/reframing/:sessionId` - Get reframing session details and chat history
- `GET /api/status` - Check server and database status

### Frontend Pages
- **Home Page**: Landing page with hero section and navigation to session/past sessions
- **Intake Page**: Multi-step form for collecting user responses to 5 questions
- **Session Page**: Journal entry form with AI-powered thought analysis and distortion detection
- **Reframe Page**: Interactive chat interface for guided CBT reframing with method selection
- **Past Sessions Page**: Placeholder for viewing previous sessions
- **404 Page**: Error page for unmatched routes

### UI Components
- Comprehensive shadcn/ui component library including forms, buttons, cards, dialogs, and navigation
- Custom styling with CSS variables for theming
- Responsive design with mobile-first approach

## Data Flow

### Phase 1: Intake Flow
1. User navigates to intake page from home
2. User fills out 5-question intake form with validation
3. Form data is submitted to backend API with Zod validation
4. Backend stores intake response in database
5. Success confirmation shown to user

### Phase 2: Journal Analysis Flow
1. User clicks "Start a New Session" from home page
2. User writes journal entry in long-form text area
3. Entry submitted to OpenAI via `/api/sessions/analyze` endpoint
4. AI analyzes entry using CBT techniques and user's intake context
5. System extracts 2-4 negative thoughts and labels cognitive distortions
6. Results displayed with explanations and options to select thoughts for reframing
7. Session saved to database for future reference

### Phase 3: Interactive Reframing Flow
1. User selects a negative thought from journal analysis results
2. User chooses reframing method (Evidence Check, Alternative Perspectives, etc.)
3. System creates reframing session via `/api/reframing/start` endpoint
4. Interactive chat interface guides user through CBT reframing process
5. AI asks thoughtful questions to help user examine their thought patterns
6. Conversation continues until user develops a balanced, realistic perspective
7. Final reframed thought is captured and session marked complete
8. All chat history and progress saved for future reference

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Hook Form)
- UI Components (Radix UI primitives, shadcn/ui)
- Styling (Tailwind CSS, class-variance-authority)
- State Management (TanStack Query)
- Routing (Wouter)
- Validation (Zod)

### Backend Dependencies
- Express.js with TypeScript support
- Database (Drizzle ORM, Neon serverless driver with fallback to in-memory storage)
- AI Integration (OpenAI API for GPT-4o)
- Validation (Zod, drizzle-zod)
- Development tools (tsx, esbuild)

## Deployment Strategy

### Development
- Frontend: Vite dev server with HMR
- Backend: Express server with tsx for TypeScript execution
- Database: PostgreSQL via Neon serverless (DATABASE_URL environment variable)

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Database: Drizzle migrations applied via `drizzle-kit push`

### Environment Configuration
- `NODE_ENV` determines development vs production mode
- `DATABASE_URL` for PostgreSQL connection (with graceful fallback to in-memory storage)
- `OPENAI_API_KEY` for AI-powered journal analysis
- Replit-specific plugins for development environment

## Recent Changes (Latest First)

### Phase 3: Interactive Reframing Chatbot (January 2025)
- ✅ **COMPLETE**: Built interactive chat interface for guided CBT reframing
- ✅ Added reframing session database schema with chat history storage
- ✅ Created 5 CBT reframing methods: Evidence Check, Alternative Perspectives, Balanced Thinking, Self-Compassion, Action Focus
- ✅ Implemented real-time chat with OpenAI using personalized user context from intake responses
- ✅ Built progressive reframing system that guides users to discover insights themselves
- ✅ Added session completion detection with final reframed thought capture
- ✅ Applied comprehensive rules system with crisis detection and security measures
- ✅ Fixed frontend API integration issues and tested complete user flow
- ✅ Enhanced storage interface with reframing session CRUD operations
- ✅ **USER FLOW**: Journal analysis → Thought selection → Method choice → Interactive chat → Guided reframing → Completion

### Phase 2: Journal Entry + AI Analysis (January 2025)
- ✅ Added OpenAI integration with GPT-4o for cognitive distortion detection
- ✅ Created new `/session` page with journal entry form
- ✅ Built comprehensive analysis system that identifies 2-4 negative thoughts
- ✅ Implemented CBT-based distortion labeling (overgeneralization, all-or-nothing thinking, etc.)
- ✅ Added user context integration from intake responses for personalized analysis
- ✅ Created journal sessions database schema with arrays for thoughts/distortions
- ✅ Updated navigation flow to direct users to session page instead of intake
- ✅ Added robust error handling for AI service failures
- ✅ **RULES IMPLEMENTATION**: Applied comprehensive rules system covering:
  - AI safety with crisis detection and jailbreak protection
  - Session limits (20 per user) with upgrade prompts
  - Input validation and sanitization (5000 character limit)
  - Token usage controls and daily limits (20k tokens/day)
  - Proper tone enforcement using "Reframe" persona
  - Security measures including RLS-style session isolation
  - Rate limiting and abuse prevention
  - Feature flags and premium gating capabilities

### Phase 1: Homepage + Intake Form (January 2025)
- ✅ Built beautiful homepage with calming gradient design and glass effects
- ✅ Created comprehensive intake form with 5 personalization questions
- ✅ Implemented form validation and progress tracking
- ✅ Added database schema and API endpoints for intake responses
- ✅ Created graceful database connection handling with in-memory fallback

The application follows a clean separation of concerns with shared TypeScript schemas between frontend and backend, ensuring type safety across the full stack. The architecture is designed to be scalable and maintainable with clear data flow and robust error handling.