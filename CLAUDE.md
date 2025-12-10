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

## Managing Red Hat Konflux Dependency Updates

The `red-hat-konflux` bot regularly opens PRs to update npm dependencies. These PRs typically update `package.json` and `package-lock.json`.

### Strategy 1: Merge Individual PRs (Preferred for Small Batches)

When there are only a few open konflux PRs, use the `gh` CLI to merge them with admin privileges:

```bash
# List all open konflux PRs
gh pr list --author "app/red-hat-konflux" --json number,title,mergeable,state --state open

# Merge PRs that are mergeable
for pr in 61 62 63; do
  gh pr merge $pr --squash --delete-branch --admin
done
```

**Note**: PRs that are behind the base branch or have conflicts will fail to merge and need conflict resolution.

### Strategy 2: Combine into Single PR (For Large Batches)

When there are 15+ open konflux PRs, combine them into a single PR:

1. **Create a combined branch**:

   ```bash
   git checkout -b combined-konflux-dependency-updates
   ```

2. **Fetch all remote branches**:

   ```bash
   git fetch origin
   ```

3. **Get list of branch names from PRs**:

   ```bash
   gh pr list --author "app/red-hat-konflux" --json number,headRefName,title --state open
   ```

4. **Merge all konflux branches sequentially (oldest to newest)**:

   ```bash
   # Merge each branch - conflicts are expected
   git merge --no-edit origin/konflux/references/main
   git merge --no-edit origin/konflux/mintmaker/main/pre-commit-mirrors-eslint-9.x
   # ... continue with remaining branches
   ```

5. **Resolve merge conflicts**:
   - **For `package.json`**: Choose the newer/higher version of each dependency
   - **For `package-lock.json`**: Use `git checkout --theirs package-lock.json` to take the incoming version
   - **After resolving conflicts**:
     ```bash
     git add package.json package-lock.json
     git commit -m "Merge PR #XX and resolve conflicts - <description>"
     ```
   - **Pattern**: When choosing between versions, always use the higher version number

6. **Regenerate package-lock.json after all merges**:

   ```bash
   npm install
   git add package-lock.json
   git commit -m "Regenerate package-lock.json after merging all updates"
   ```

7. **Push and create PR**:

   ```bash
   git push -u origin combined-konflux-dependency-updates
   gh pr create --title "chore(deps): Combined dependency updates from red-hat-konflux" --body "<detailed summary>"
   ```

8. **Wait for individual PRs to auto-close**:
   - After the combined PR is merged, wait ~1 minute
   - GitHub will automatically close most/all of the individual konflux PRs since their changes are now in main
   - Check if any PRs remain open: `gh pr list --author "app/red-hat-konflux" --state open`
   - Only manually close PRs that didn't auto-close:
     ```bash
     gh pr close <pr-number> --comment "Closing - changes included in combined PR #<combined-pr-number>"
     ```

### Handling Merge Conflicts in Konflux PRs

When PRs have conflicts (typically after other PRs have been merged):

1. **Checkout the PR branch**:

   ```bash
   gh pr checkout <pr-number>
   ```

2. **Merge main into the PR branch**:

   ```bash
   git merge origin/main
   ```

3. **Resolve conflicts**:
   - **For `package.json`**: Choose the newer version of each dependency
   - **For `package-lock.json`**: Use `git checkout --theirs package-lock.json` to take main's version
   - **Pattern**: When choosing between versions, use the higher version number

4. **Commit and push**:

   ```bash
   git add package.json package-lock.json
   git commit -m "Merge main into PR #<pr-number> and resolve conflicts"
   git push origin <branch-name>
   ```

5. **Wait a few seconds, then merge**:
   ```bash
   sleep 3
   gh pr merge <pr-number> --squash --delete-branch --admin
   ```

### Workflow for Batch Merging Conflicted PRs

When multiple PRs have conflicts, resolve them **in order from oldest to newest**:

```bash
# Work through PRs sequentially (oldest first)
for pr in 61 62 63 64 65; do
  echo "Processing PR #$pr"

  # Update local main
  git checkout main && git pull origin main

  # Checkout PR and merge main
  gh pr checkout $pr
  git merge origin/main

  # Resolve conflicts (manual step)
  # Edit package.json to choose newer versions
  git checkout --theirs package-lock.json

  # Commit and push
  git add package.json package-lock.json
  git commit -m "Merge main into PR #$pr and resolve conflicts"
  git push origin <branch-name>

  # Merge the PR
  sleep 3
  gh pr merge $pr --squash --delete-branch --admin
done
```

**Why oldest first?**: Earlier PRs may update dependencies that later PRs also touch. Merging in order minimizes cascading conflicts.

### Important Considerations

- **Conflict resolution strategy**: When in doubt, choose the newer/higher version of dependencies
- **Package lock regeneration**: Always run `npm install` after combining multiple PRs to ensure consistency
- **TypeScript compatibility**: `react-scripts@5.0.1` only supports TypeScript ^3.2.1 || ^4. Do NOT upgrade to TypeScript 5 until react-scripts is upgraded to a compatible version
- **PatternFly v6 breaking changes**:
  - `TextContent` component replaced with `Content` - update all imports and usages
  - `Text` and `TextVariants` removed - replace with standard HTML elements (h1, h3, h4, h5, p, small)
  - After upgrading, run `npm run build` to catch component API changes
- **Peer dependency warnings**: Major version updates (React 19, PatternFly 6, etc.) may cause peer dependency warnings - these are expected during transitions
- **Testing**: For major version updates, test the application locally before merging
- **Verify npm install**: After combining PRs, run `npm install` to ensure there are no peer dependency conflicts that would break the build
- **Admin flag**: The `--admin` flag bypasses branch protection rules - use only for automated dependency updates
- **Timing**: Some PRs need a few seconds after pushing before GitHub recognizes them as mergeable
- **Breaking changes**: Major version updates may require code changes - document these in the PR description
