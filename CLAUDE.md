# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands

- `npm install` - Install dependencies
- `npm start` - Start development server (runs on http://localhost:3000)
- `npm run build` - Build for production
- `npm test` - Run tests

### Container Development

- `docker compose up --build` - Start with Docker Compose (Linux only, not supported on Mac)
- Backend dependency: Requires tangerine-backend running on port 8000

#### Full Stack Setup with Docker

To run both backend and frontend together:

1. Clone the backend: `git clone https://github.com/RedHatInsights/tangerine-backend`
2. In the backend directory: `docker compose up --build`
3. In this frontend directory: `docker compose up --build`

### Production Build

- `./build.sh` - Production container build script (requires QUAY_USER and QUAY_TOKEN env vars)

## Architecture Overview

### Core Application Structure

This is a React-based RAG (Retrieval Augmented Generation) frontend for managing AI chat assistants. The app follows a page-based routing structure with separated knowledge base and assistant management:

- **Home** (`/`) - Assistant management dashboard with CRUD operations
- **Knowledge Bases** (`/knowledgebases`) - Knowledge base management dashboard
- **Knowledge Base Details** (`/knowledgebases/:kbId`) - View/edit KB configuration and document upload
- **Assistant Details** (`/assistants/:assistantId`) - View/edit assistant configuration and KB associations
- **Chat Interface** (`/assistants/:assistantId/chat`) - Real-time streaming chat with assistants

### Key Components

- `App.js` - Main router with Header component and five routes
- `Header.js` - Navigation header with links to Assistants and Knowledge Bases
- `Main.js` - Dashboard for listing, creating, and deleting assistants
- `Assistant.js` - Detailed view for assistant management and knowledge base associations (uses DualListSelector)
- `KnowledgeBases.js` - Dashboard for listing, creating, and deleting knowledge bases
- `KnowledgeBase.js` - Detailed view for KB management and document upload/deletion
- `Chat.js` - Streaming chat interface with markdown rendering and feedback system
- `SearchInfo.js` - Component for displaying search metadata from RAG responses

### Data Flow Patterns

- All API communication uses axios for standard requests and fetch for streaming
- Assistant state management through React hooks with local state
- Chat implements streaming responses with TextDecoderStream
- Session tracking with crypto.randomUUID() for chat sessions
- File uploads use FormData for document management

### UI Framework

Uses PatternFly React components throughout:

- Forms, modals, tables, panels for UI structure
- Consistent styling with PatternFly design system
- Markdown rendering with react-markdown and remark-gfm
- **Important**: Always use PatternFly React components for new UI features (https://github.com/patternfly/patternfly-react)
- Component documentation: https://www.patternfly.org/components/all-components

### Backend Integration

- Proxy configured for `http://127.0.0.1:8000/` in package.json
- **Assistant API endpoints**: `/api/assistants`, `/api/assistants/{id}`, `/api/assistants/{id}/knowledgebases`
- **Knowledge Base API endpoints**: `/api/knowledgebases`, `/api/knowledgebases/{id}`, `/api/knowledgebases/{id}/documents`
- **Other endpoints**: `/api/feedback`, `/api/assistantDefaults`
- Supports streaming chat responses and file uploads
- Document support: .md, .txt, .pdf files
- **New Architecture**: Many-to-many relationship between assistants and knowledge bases

### State Management

- Component-level state with useState hooks
- No global state management (Redux, Context, etc.)
- Real-time updates through streaming API responses
- Feedback tracking for chat interactions
