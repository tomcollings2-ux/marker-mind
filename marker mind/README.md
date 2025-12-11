# MarkerMind - Collaborative Whiteboard Application

A real-time collaborative whiteboard built with React, TypeScript, and Express.

## Features

- **Sticky Notes** - Create customizable sticky notes with different colors, fonts, and sizes
- **Drawing Tools** - Free-form drawing with customizable pen colors and thickness
- **Line Connectors** - Draw connection lines between elements
- **Text Labels** - Add floating text labels
- **Image Upload** - Upload and place images on your board
- **Undo/Redo** - Full undo/redo support (20 action history)
- **Templates** - Quick-start templates (Kanban, SWOT, Brainstorm, etc.)
- **Auto-save** - Your changes are automatically saved to the server
- **User Authentication** - Secure login and registration

## Tech Stack

### Frontend
- React 19 + TypeScript
- TanStack Query (React Query) for server state
- Framer Motion for animations
- Radix UI for accessible components
- Tailwind CSS for styling
- Wouter for routing

### Backend
- Express + TypeScript
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- Cloudinary for image hosting

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/markermind
SESSION_SECRET=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

3. Push database schema:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

The client will be available at `http://localhost:5000`  
The API server will run on `http://localhost:5001`

## Development

### Available Scripts

- `npm run dev` - Start backend development server with auto-reload
- `npm run dev:client` - Start frontend development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### Project Structure

```
client/
  src/
    components/    # React components
    hooks/         # Custom React hooks
    lib/           # Utilities and API client
    pages/         # Page components
    constants.ts   # Application constants
server/
  db/             # Database schema
  routes/         # API routes
shared/
  schema.ts       # Shared TypeScript types
```

## Architecture

- **State Management**: TanStack Query for server state, React hooks for local state
- **Authentication**: Session-based auth with Passport Local Strategy
- **Real-time Updates**: Auto-save with optimistic updates
- **History**: Custom undo/redo implementation with 20-action limit

## Configuration Constants

See `client/src/constants.ts` for configurable values:
- Min/max zoom levels
- Note size constraints
- History size limit
- UI timing values

## License

MIT
