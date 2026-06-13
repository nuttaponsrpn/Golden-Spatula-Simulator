# Web Template

A "Gold Standard" Nuxt 4 starter template extracted from MyInterface. Designed for type safety, robust error handling, and scalable feature-based architecture.

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (SSR by default)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript (Strict Mode)
- **API**: OpenAPI with auto-generated types (`openapi-typescript`)
- **Testing**: Playwright (Behavior-driven)

## Key Features

- **Standardized Error Handling**: Multi-layered system (`AppError`) that normalizes all errors and provides global state for notifications.
- **Type-Safe API Client**: Base `useApi` composable that integrates with the error system and auto-generated types.
- **Pure vs. Smart Components**: Strict architectural separation for better testability and reuse.
- **Component Documentation**: Automatic documentation pattern in `app/documents/` with a built-in explorer at `/dev/components`.
- **Universal AI Conventions**: Unified rules for Claude, Gemini, Copilot, and Cursor.

## Setup

1. **Clone/Copy** this template to your new project folder.
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure API**:
   - Copy `.env.example` to `.env` (create it if missing).
   - Set `NUXT_PUBLIC_API_BASE` to your backend URL.
   - Update `api-sources.config.ts` if needed.
4. **Generate API Types**:
   ```bash
   pnpm gen:api
   ```
5. **Start Development**:
   ```bash
   pnpm dev
   ```

## Project Structure & AI Conventions

This project uses a "Single Source of Truth" for AI conventions to ensure all agents (Claude, Gemini, Copilot, Cursor) follow the same rules.

- **CONVENTIONS.md**: The master file for all project rules and conventions.
- **GEMINI.md / CLAUDE.md / .cursorrules**: Platform-specific entry points (identical copies of CONVENTIONS.md).
- **.github/copilot-instructions.md**: Instructions specifically for GitHub Copilot.

**Note**: When updating project rules, always update **CONVENTIONS.md** and then sync the other files.

## Documentation

- `app/documents/`: All component documentation.
- `/dev/components`: Live component preview (development mode only).

