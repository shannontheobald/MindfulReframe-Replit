# Mindful Reframe Application

## Overview

This is a full-stack web application called "Mindful Reframe" that helps users transform limiting beliefs into empowering thoughts through guided reflection and visualization. The application consists of a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database using Drizzle ORM.

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

### API Endpoints
- `POST /api/intake` - Create new intake response
- `GET /api/intake/:userId` - Retrieve intake response by user ID

### Frontend Pages
- **Home Page**: Landing page with hero section and navigation to intake/past sessions
- **Intake Page**: Multi-step form for collecting user responses to 5 questions
- **Past Sessions Page**: Placeholder for viewing previous sessions
- **404 Page**: Error page for unmatched routes

### UI Components
- Comprehensive shadcn/ui component library including forms, buttons, cards, dialogs, and navigation
- Custom styling with CSS variables for theming
- Responsive design with mobile-first approach

## Data Flow

1. User navigates to intake page from home
2. User fills out 5-question intake form with validation
3. Form data is submitted to backend API with Zod validation
4. Backend stores intake response in PostgreSQL database
5. Success confirmation shown to user
6. User can view past sessions (future functionality)

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
- Database (Drizzle ORM, Neon serverless driver)
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
- `DATABASE_URL` required for PostgreSQL connection
- Replit-specific plugins for development environment

The application follows a clean separation of concerns with shared TypeScript schemas between frontend and backend, ensuring type safety across the full stack. The architecture is designed to be scalable and maintainable with clear data flow and robust error handling.