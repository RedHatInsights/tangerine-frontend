# ARCHITECTURE.md

## High-Level Design

Tangerine's frontend is a single-page application that acts as a thin client over a RESTful
backend. Every piece of domain state lives on the server; the frontend holds only transient UI state
and in-flight streaming buffers. This keeps the client small and avoids the need for a client-side
persistence layer.

The application is built with [Create React App][cra] (react-scripts 5.0.1), which owns the
Webpack/Babel toolchain. No ejection has been performed, so all build configuration is inherited from
react-scripts defaults. TypeScript is present in `devDependencies` with a `tsconfig.json` targeting
ES5, but all source files are plain JavaScript (`.js`). TypeScript serves only as an optional type
checker via `npm run typecheck`; it does not participate in the build pipeline.

## Component Hierarchy

```
BrowserRouter                        (src/index.js)
  App                                (src/App.js)
    Header                           (src/components/Header.js)
    Routes
      Home -> Main                   (src/pages/Home.js, src/components/Main.js)
      KnowledgeBases                 (src/pages/KnowledgeBases.js)
      KnowledgeBase                  (src/pages/KnowledgeBase.js)
      Assistant                      (src/pages/Assistant.js)
      Chat                           (src/pages/Chat.js)
        SearchInfo                   (src/components/SearchInfo.js)
```

### Component responsibilities

| Component        | Role                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header`         | Global navigation bar. Uses PatternFly `Masthead` with imperative `useNavigate` calls rather than `<Link>` elements.                                           |
| `Main`           | Assistant dashboard. Lists assistants with their KB counts, handles create (modal) and delete. Fetches KB counts per assistant in parallel with `Promise.all`. |
| `KnowledgeBases` | Knowledge base dashboard. Mirrors the structure of `Main` for KB CRUD.                                                                                         |
| `KnowledgeBase`  | Single KB detail view. Manages document upload with streaming progress tracking and document deletion.                                                         |
| `Assistant`      | Single assistant detail view. Manages assistant metadata editing and KB associations via a `DualListSelector`.                                                 |
| `Chat`           | Streaming chat interface. Renders markdown responses incrementally, tracks sessions, and collects per-interaction feedback.                                    |
| `SearchInfo`     | Expandable source citations within chat messages. Renders RAG retrieval snippets as markdown inside nested expandable sections.                                |
| `Home`           | Thin wrapper that renders `Main`. Exists solely to give the route a page-level component without embedding `Main` directly in `App`.                           |

### Notable structural decisions

- **`Home` indirection.** `Home` is a one-line wrapper around `Main`. This keeps `src/pages/` as the
  canonical set of route-level components while allowing `Main` to live under `src/components/`
  alongside other reusable components. The naming (`Main` for the assistant dashboard) is a legacy
  artifact from when assistants were the only entity in the application.

- **No shared layout component.** `Header` is rendered once in `App` above the `Routes` switch.
  Page-level layout (margins, widths) is handled with inline styles per page rather than a shared
  layout wrapper.

## State Management Approach

The application uses exclusively component-local state (`useState`, `useRef`). There is no global
store, no React Context, and no state management library.

### Rationale

Each page is a self-contained CRUD view that fetches its own data on mount and re-fetches after
mutations. There are no cross-page data dependencies that would benefit from shared state:

- Navigating from the assistant list to an assistant detail page triggers a fresh fetch.
- The chat page manages its own message array, session ID, and feedback tracking.
- KB associations are loaded independently by both the assistant list (for counts) and the assistant
  detail page (for the dual-list selector).

This means navigating back to a previously visited page always re-fetches from the server. The
tradeoff is simplicity (no cache invalidation logic) at the cost of redundant network requests on
navigation.

### State shape conventions

Detail pages (`Assistant`, `KnowledgeBase`) maintain two parallel state objects: one for the
displayed data and one for the modal edit form. For example, `Assistant` holds both `assistantInfo`
(read-only display) and `modalAssistantInfo` (editable copy). The modal copy is initialized from the
display copy when the modal opens, and the display copy is refreshed from the server after a
successful update. This prevents partially edited state from leaking into the display while the modal
is open.

## Routing Structure

Routing uses React Router DOM v7 with `BrowserRouter` at the root.

```
/                                -> Home (assistant dashboard)
/knowledgebases                  -> KnowledgeBases (KB dashboard)
/knowledgebases/:knowledgeBaseId -> KnowledgeBase (KB detail)
/assistants/:assistantId         -> Assistant (assistant detail)
/assistants/:assistantId/chat    -> Chat (streaming chat)
```

All routes are defined as flat siblings in `App.js`. There is no nested routing or layout routes.
Route parameters are consumed via `useParams()` in each page component.

### Navigation patterns

- **Dashboard-to-detail**: Uses React Router `<Link>` for name cells in tables, and imperative
  `navigate()` calls for action buttons.
- **Back navigation**: Detail pages use explicit "Back to..." buttons with `navigate()` rather than
  browser-native back navigation.
- **Header navigation**: The header uses `useNavigate` with `onClick` handlers on plain PatternFly
  buttons rather than `<Link>` or `<NavLink>` components.

## API Communication Layer

The application uses two distinct mechanisms for server communication, chosen based on whether the
response is streamed.

### axios — Standard requests

All non-streaming API calls (CRUD operations) use [axios][axios] with no shared instance or
interceptor configuration. Each component imports axios directly and makes calls with relative URLs
(e.g., `/api/assistants`). The CRA development proxy (`"proxy": "http://127.0.0.1:8000/"` in
`package.json`) forwards these to the backend during development.

**Error handling pattern**: Every axios call chains `.catch()` with `console.error`. There is no
user-facing error display, no toast/alert system, and no retry logic. Failed requests silently log
to the console and leave the UI in its pre-request state.

**Response shape handling**: Several components defensively access `response.data.data ||
response.data` to handle both wrapped (`{ data: [...] }`) and unwrapped array responses from the
backend. This suggests the API response envelope is inconsistent across endpoints or has evolved over
time.

### fetch — Streaming responses

Two features use the native Fetch API for streaming:

1. **Chat responses** (`src/pages/Chat.js`): Uses `TextDecoderStream` piped from `response.body` to
   incrementally parse SSE-formatted lines (`data: {...}\r\n`). Tokens are appended to the last
   message in the messages array via functional `setMessages` updates. Search metadata arrives as the
   final event in the stream, at which point the message is marked `done` and feedback buttons are
   shown.

2. **Document upload progress** (`src/pages/KnowledgeBase.js`): Uses `response.body.getReader()` with
   manual `TextDecoder` to parse newline-delimited JSON events from the upload endpoint. Each event
   contains a `step` field (`start` or `end`) and a `file` field with a `default:` prefix that must
   be stripped before matching to the local filename.

### Why two HTTP clients

axios does not support streaming response bodies. The Fetch API's `ReadableStream` is required for
SSE consumption. Rather than replacing axios entirely, the codebase uses axios for the majority of
simple request/response calls and fetch only where streaming is necessary.

## Dependency Decisions

| Dependency                                | Purpose              | Rationale                                                                                                                                                                                                                          |
| ----------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PatternFly React Core/Table/Icons][pf]   | UI component library | Red Hat's design system. Provides consistent enterprise styling, accessible components, and pre-built patterns (DualListSelector, MultipleFileUpload, Masthead) that would be costly to build from scratch.                        |
| [react-markdown][rm] + [remark-gfm][rgfm] | Markdown rendering   | Chat responses and RAG source snippets contain markdown. `react-markdown` renders it as React elements (no `dangerouslySetInnerHTML`), and `remark-gfm` adds GitHub Flavored Markdown support (tables, strikethrough, task lists). |
| [axios][axios]                            | HTTP client          | Simpler API than fetch for standard request/response patterns. Used for all non-streaming calls.                                                                                                                                   |
| [react-router-dom][rrd]                   | Client-side routing  | Standard choice for SPA routing in React applications.                                                                                                                                                                             |
| [react-scripts][cra]                      | Build toolchain      | CRA's zero-config Webpack/Babel setup. Avoids custom build configuration at the cost of limited customization.                                                                                                                     |

### Constraints on dependency upgrades

- **TypeScript is pinned to 4.x.** `react-scripts@5.0.1` only supports TypeScript `^3.2.1 || ^4`.
  Upgrading to TypeScript 5 requires first upgrading or replacing react-scripts.
- **PatternFly v6 API.** The codebase has already migrated to PF v6 conventions: `Content` instead
  of `TextContent`, native HTML headings instead of `Text`/`TextVariants`, and the
  `ModalHeader`/`ModalBody`/`ModalFooter` pattern instead of the old `Modal` props API.

## Container Architecture

The production deployment uses a two-stage Docker build with a Caddy reverse proxy:

```
                    +------------------+
                    |      Caddy       |  :3000 (external)
                    |                  |
                    |  /api/* -------> |---> backend:8000
                    |  /*    -------> |---> frontend:3000
                    +------------------+
                           |
              +------------+------------+
              |                         |
    +---------+--------+    +-----------+---------+
    | tangerine-frontend|    | tangerine-backend   |
    | (serve -s build)  |    | (external, port 8000)|
    +------------------+    +---------------------+
```

- **Build stage**: Uses `ubi9/nodejs-22` to `npm install` and `npm run build`, producing a static
  bundle.
- **Runtime stage**: Uses `ubi9/nodejs-22-minimal` with the [`serve`][serve] package to host the
  static build output. This avoids shipping the full Node.js image and build dependencies into
  production.
- **Caddy proxy**: A `Caddyfile` routes `/api/*` to the backend service and everything else to the
  frontend. This replaces the CRA dev proxy in production and runs with `auto_https off` since TLS
  termination is expected to happen upstream.
- **Network**: Both services join an external Docker network named `tangerine`, which the backend's
  own `docker-compose.yml` is expected to create.

## Chat Streaming Protocol

The chat streaming implementation deserves specific attention as it is the most complex client-side
logic in the application.

### Message lifecycle

1. User presses Enter. The current input is added to `messages` as a `{ sender: "human" }` entry.
2. A `fetch` POST to `/api/assistants/:id/chat` sends the query, full message history (`prevMsgs`),
   a per-message `interactionId` (via `crypto.randomUUID()`), and the persistent `sessionId`.
3. The response stream is piped through `TextDecoderStream`. Each chunk may contain multiple
   SSE-formatted lines (`data: {...}\r\n`).
4. For each parsed JSON payload:
   - If `text_content` is present, it is appended to the last AI message (or a new AI message is
     created if the last message is from the human).
   - If `search_metadata` is present, it is attached to the message, `done` is set to `true`, and
     the `interactionId` from the metadata is stored on the message for feedback tracking.
5. Once `done`, upvote/downvote buttons appear. Feedback is posted to `/api/feedback` and the
   interaction ID is added to `interactionsGivenFeedback` to prevent duplicate submissions.

### Session tracking

A `sessionId` is generated once per component mount via `crypto.randomUUID()`. It persists across
messages within a single chat session but resets if the user navigates away and returns. The session
ID is displayed in the UI and sent with every chat request.

## Document Upload Flow

`src/pages/KnowledgeBase.js` implements a streaming upload flow using PatternFly's
`MultipleFileUpload` component:

1. Files are dropped or selected. Client-side validation filters to `.md`, `.txt`, and `.pdf`
   extensions.
2. PatternFly's `onReadSuccess` callback fires after the browser reads each file. The component
   immediately starts a `fetch` POST with `FormData` to the documents endpoint.
3. The backend returns a newline-delimited JSON stream with `{ step: "start"|"end", file: "..." }`
   events. The `file` field has a `default:` prefix that is stripped before matching.
4. Progress state is tracked per file via a `readFileData` array and a `pendingUploads` Set. When
   all pending uploads complete (Set becomes empty), the KB info is re-fetched to update the document
   list.

## Key Tradeoffs

| Decision                            | Benefit                                                       | Cost                                                                                          |
| ----------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No global state                     | Zero state management complexity; each page is self-contained | Redundant fetches on every navigation; no optimistic updates                                  |
| Component-local API calls           | Each component is independently understandable                | No shared error handling, no request deduplication, no loading skeletons                      |
| `console.error`-only error handling | Simple implementation                                         | Users see no feedback on failures; debugging requires opening DevTools                        |
| Inline styles throughout            | No CSS class naming or stylesheet management                  | Inconsistent spacing values; harder to maintain visual consistency; no responsive breakpoints |
| axios + fetch dual approach         | Streaming support where needed, simpler API elsewhere         | Two HTTP patterns to understand; no shared interceptors or auth handling                      |
| `serve` for production hosting      | Lightweight static file server                                | No server-side rendering, no compression config, no cache headers beyond defaults             |
| CRA without ejection                | Zero build config maintenance                                 | Cannot customize Webpack (e.g., for code splitting, bundle analysis, or aliasing)             |

[axios]: https://github.com/axios/axios
[cra]: https://create-react-app.dev
[pf]: https://www.patternfly.org
[rgfm]: https://github.com/remarkjs/remark-gfm
[rm]: https://github.com/remarkjs/react-markdown
[rrd]: https://reactrouter.com
[serve]: https://github.com/vercel/serve
