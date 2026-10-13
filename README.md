# Sticky Notes

Sticky Notes is a desktop focused single page application for creating and organizing plain text notes on a bounded canvas. Users can choose a note size and color, type content locally, move and resize notes with pointer interactions, delete notes through a drop zone, and restore recent deletions during five seconds undo window. The application prioritizes responsive interactions by updating the DOM directly during pointer movement and committing to global state only when an interaction finishes.

## Features

- Configurable note size and background color.
- Centered creation with deterministic cascading placement.
- Immediate editor focus for newly created notes.
- Plain-text validation with a limit of 2,000 characters.
- Constraines for canvas dragging and resizing.
- Drag to delete with multiple recoverable snapshots.
- Five second undo window for each deleted note.
- Application level rendering error boundary.

## Technology

- React 19 and TypeScript
- Vite
- Zustand
- Vanilla CSS using BEM naming
- Vitest, jsdom, and React Testing Library
- ESLint and Prettier

## Architecture

The application uses a small layered structure. Generic UI components live in `src/components`, note behavior and state orchestration live in `src/features/notes`, and reusable business contracts and constants live in `src/domain`. Feature hooks coordinate pointer interactions, while pure geometry utilities perform positioning, clamping, drag, resize, and hit-testing calculations independently from React.

```text
src/
├── components/          Generic toolbar and error boundary
├── domain/              Note types, geometry contracts, and constants
├── features/notes/      Canvas, notes, controls, hooks, and Zustand store
├── test/                Shared test setup
├── App.tsx
└── main.tsx
```

Detailed behavior is documented in [`docs/specs`](docs/specs), with implementation phases in [`docs/PLAN.md`](docs/PLAN.md).

## Requirements

- Node.js 22
- pnpm through Corepack

## Getting Started

```bash
corepack enable
pnpm install
pnpm dev
```

Vite will print the local development URL after startup.

## Available Scripts

```bash
pnpm dev          # Start the development server
pnpm test         # Run the test suite once
pnpm test:watch   # Run tests in watch mode
pnpm lint         # Run ESLint
pnpm format       # Format the project with Prettier
pnpm format:check # Verify formatting
pnpm build        # Type-check and create a production build
pnpm preview      # Preview the production build
```

## Validation

The automated suite covers domain validation, store behavior, geometry constraints, creation and focus, local content editing, drag and resize performance, deletion, snapshot recovery, undo expiration, and render isolation. Before submitting changes, run:

```bash
pnpm format:check
pnpm test
pnpm lint
pnpm build
```
