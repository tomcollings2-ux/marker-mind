# MarkerMind - Digital Whiteboard Application

## Overview

MarkerMind (also known as Noteable) is a digital whiteboard web application that replicates the experience of using a physical whiteboard with colorful sticky notes and hand-drawn marker elements. The app provides an interactive canvas where users can create, move, and edit sticky notes, draw freehand lines, add text labels, and draw straight lines with a marker-like aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Animation**: Framer Motion for drag-and-drop and interactive animations
- **Fonts**: Google Fonts (Kalam, Architects Daughter, Permanent Marker) for hand-drawn aesthetic

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful API with JSON request/response format
- **Development Server**: Vite dev server with HMR, proxied through Express in development
- **Production Build**: esbuild bundles server code, Vite builds client assets

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)
- **Connection**: Uses `DATABASE_URL` environment variable for connection string

### Data Model
The application uses a hierarchical data structure:
- **Boards**: Container for all whiteboard elements
- **Sticky Notes**: Draggable, editable notes with color, shape, position, and rotation
- **Drawings**: Freehand marker strokes stored as path arrays
- **Text Labels**: Positioned text with customizable font style and size
- **Lines**: Straight lines between two points with style options

### Project Structure
```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # UI components (StickyNote, DrawingCanvas, etc.)
│   │   ├── pages/        # Route pages (Board, not-found)
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and API client
├── server/           # Backend Express application
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── vite.ts       # Vite dev server integration
├── shared/           # Shared code between client and server
│   └── schema.ts     # Drizzle database schema and Zod validation
```

### Key Design Patterns
- **Shared Schema**: Database schemas defined in `shared/` are used by both frontend (for type safety) and backend (for database operations)
- **API Client Layer**: Centralized API functions in `client/src/lib/api.ts` abstract fetch calls
- **Component-per-feature**: Each major feature (sticky notes, drawing, lines) has its own canvas/component

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### UI/Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Shadcn/ui**: Pre-built component library configured via `components.json`
- **Lucide React**: Icon library

### Build Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server-side bundling for production
- **TypeScript**: Type checking across the entire codebase

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)
- **vite-plugin-meta-images**: Custom plugin for OpenGraph image handling