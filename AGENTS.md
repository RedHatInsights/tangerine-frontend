# AGENTS.md

## Project Overview

Tangerine Frontend is a slim, lightweight RAG (Retrieval Augmented Generation) web application for
creating and managing AI-powered chatbot assistants. It provides a React SPA through which users
define assistants, associate them with knowledge bases, upload documents, and hold streaming chat
sessions against those knowledge bases. The app is distributed as a container image built with
`build.sh` and published to Quay.io; it is licensed under Apache 2.0 and maintained under the Red
Hat Insights organization.

## Dependencies

**Runtime:**

- React 19.2.6, React Router DOM 7, axios
- PatternFly React Core 6.4.3 (Red Hat design system)
- react-markdown + remark-gfm (chat message rendering)

**Build / Toolchain:**

- react-scripts 5.0.1 (Create React App, no ejection)
- npm (package manager)
- TypeScript 4.9.5 — present as a type-checker only; it does **not** participate in the build

**Dev / Test:**

- ESLint 8.57.1, extends `react-app` + `react-app/jest`; `@typescript-eslint` plugins v5
- Prettier 3.x
- Jest (via react-scripts)

## Development Commands

See [Development Setup][readme-dev] in the README for the full command reference, including Docker
Compose setup and the complete development tooling section.

**Agent-specific commands** (Konflux dependency management via `gh`):

```bash
# List all open Konflux PRs
gh pr list --author "app/red-hat-konflux" --json number,title,mergeable,state --state open

# Merge a single PR with admin privileges
gh pr merge <pr-number> --squash --delete-branch --admin
```

See [Managing Red Hat Konflux Dependency Updates](#managing-red-hat-konflux-dependency-updates)
below for full procedures.

## Architecture

See [ARCHITECTURE.md][architecture] for the full design document.

The app is a standard Create React App SPA. `src/App.js` is the entry point; it mounts a
`Header.js` navigation bar and five React Router routes mapping to page-level components:
`Main.js` (assistants dashboard), `KnowledgeBases.js`, `KnowledgeBase.js`, `Assistant.js`, and
`Chat.js`. All API communication uses axios for standard requests and `fetch` with
`TextDecoderStream` for streaming chat. There is no global state manager — each page component
owns its state via `useState` hooks.

## Code Style

**Formatter:** Prettier 3.x — authoritative config in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

Prettier runs on save via the pre-commit hook (`--write`, covers `.md` files too).

**Linter:** ESLint 8.57.1, config extends `react-app` + `react-app/jest`. The
`@typescript-eslint` plugins (v5) are present but TypeScript strict-mode checking is opt-in via
`tsc`; ESLint remains the enforced gate. ESLint runs `--fix` on every commit.

**Language:** All source files are `.js`. Do not create `.ts` or `.tsx` files — TypeScript is used
only as an optional type-checker, not as a source language.

**UI components:** Always use [PatternFly React][patternfly-docs] components for new UI. Do not
introduce custom CSS solutions for layout or structure that PatternFly already covers.

## Common Mistakes

1. **Using TypeScript as a source language.** All source files are `.js`. TypeScript is present
   only for optional type-checking (`tsc`). Adding `.ts`/`.tsx` files or importing TypeScript-only
   constructs will break the react-scripts build.

2. **Upgrading TypeScript to v5.** `react-scripts@5.0.1` only supports TypeScript
   `^3.2.1 || ^4`. Do not bump the `typescript` package to v5 until react-scripts is upgraded to
   a compatible version. Konflux PRs that propose this upgrade must be rejected or held.

3. **Using deprecated PatternFly v5 component APIs.** PatternFly v6 introduced breaking changes:
   - `TextContent` → `Content`
   - `Text` and `TextVariants` removed → use plain HTML elements (`h1`, `p`, `small`, etc.)
   - `Modal` no longer accepts `title`/`description`/`actions` props → use `ModalHeader`,
     `ModalBody`, `ModalFooter`

   After any PatternFly upgrade, run `npm run build` to surface component API errors.

4. **Skipping `npm install` after combining Konflux PRs.** Merging multiple dependency branches
   leaves `package-lock.json` in an inconsistent state. Always run `npm install` and commit the
   regenerated lockfile before pushing a combined branch.

5. **Inline links in markdown.** This file (and all markdown committed to the repo) is formatted
   by Prettier on commit. Use reference-style links to keep lines within the 80-character print
   width and pass the pre-commit hook cleanly.

6. **Assuming Docker Compose works on macOS.** The `docker compose up --build` frontend workflow
   is Linux-only. On macOS, run `npm start` directly and point it at a separately running backend.

## Managing Red Hat Konflux Dependency Updates

The `red-hat-konflux` bot regularly opens PRs to update npm dependencies. These PRs typically
update `package.json` and `package-lock.json`.

### Strategy 1: Merge Individual PRs (Preferred for Small Batches)

When there are only a few open Konflux PRs, use the `gh` CLI to merge them with admin privileges:

```bash
# List all open konflux PRs
gh pr list --author "app/red-hat-konflux" --json number,title,mergeable,state --state open

# Merge PRs that are mergeable
for pr in 61 62 63; do
  gh pr merge $pr --squash --delete-branch --admin
done
```

**Note**: PRs that are behind the base branch or have conflicts will fail to merge and need
conflict resolution.

### Strategy 2: Combine into Single PR (For Large Batches)

When there are 15+ open Konflux PRs, combine them into a single PR:

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

4. **Merge all Konflux branches sequentially (oldest to newest)**:

   ```bash
   # Merge each branch - conflicts are expected
   git merge --no-edit origin/konflux/references/main
   git merge --no-edit origin/konflux/mintmaker/main/pre-commit-mirrors-eslint-9.x
   # ... continue with remaining branches
   ```

5. **Resolve merge conflicts**:
   - **For `package.json`**: Choose the newer/higher version of each dependency
   - **For `package-lock.json`**: Use `git checkout --theirs package-lock.json` to take the
     incoming version
   - **After resolving conflicts**:

     ```bash
     git add package.json package-lock.json
     git commit -m "Merge PR #XX and resolve conflicts - <description>"
     ```

   - **Pattern**: When choosing between versions, always use the higher version number

6. **Regenerate `package-lock.json` after all merges**:

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
   - GitHub will automatically close most/all of the individual Konflux PRs since their changes
     are now in main
   - Check if any PRs remain open:

     ```bash
     gh pr list --author "app/red-hat-konflux" --state open
     ```

   - Only manually close PRs that did not auto-close:

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
   - **For `package-lock.json`**: Use `git checkout --theirs package-lock.json` to take main's
     version
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

**Why oldest first?**: Earlier PRs may update dependencies that later PRs also touch. Merging in
order minimizes cascading conflicts.

### Important Considerations

- **Conflict resolution strategy**: When in doubt, choose the newer/higher version of dependencies
- **Package lock regeneration**: Always run `npm install` after combining multiple PRs to ensure
  consistency
- **TypeScript compatibility**: `react-scripts@5.0.1` only supports TypeScript `^3.2.1 || ^4`.
  Do NOT upgrade to TypeScript 5 until react-scripts is upgraded to a compatible version
- **PatternFly v6 breaking changes**:
  - `TextContent` component replaced with `Content` — update all imports and usages
  - `Text` and `TextVariants` removed — replace with standard HTML elements (`h1`, `h3`, `h4`,
    `h5`, `p`, `small`)
  - `Modal` API changed — use `ModalHeader`, `ModalBody`, and `ModalFooter` instead of
    `title`/`description`/`actions` props
  - After upgrading, run `npm run build` to catch component API changes
- **Peer dependency warnings**: Major version updates (React 19, PatternFly 6, etc.) may cause
  peer dependency warnings — these are expected during transitions
- **Testing**: For major version updates, test the application locally before merging
- **Verify npm install**: After combining PRs, run `npm install` to ensure there are no peer
  dependency conflicts that would break the build
- **Admin flag**: The `--admin` flag bypasses branch protection rules — use only for automated
  dependency updates
- **Timing**: Some PRs need a few seconds after pushing before GitHub recognizes them as mergeable
- **Breaking changes**: Major version updates may require code changes — document these in the PR
  description

[readme-dev]: README.md#development-environment-setup
[architecture]: ARCHITECTURE.md
[patternfly-docs]: https://www.patternfly.org/components/all-components
