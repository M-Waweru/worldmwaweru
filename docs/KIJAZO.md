# Kijazo — unrestricted coding-agent architecture

## Current prototype
Open the website with `?kijazo=1` to reveal a local editing overlay. This version edits site copy and visual themes in the browser, persists the draft in localStorage, and exports `content/site.json`. It does **not** call an LLM, execute code, authenticate users or publish to GitHub automatically. These boundaries are deliberate MVP implementation scope, not long-term product limits.

The public site renders the committed `kijazoTheme` property from `content/site.json` if present. The preview uses CSS custom properties.

## Next: genuine arbitrary-code editing

The SDK is a transport and experience layer, not a coding engine. A service must own:

- A GitHub App installation and short-lived GitHub installation tokens. Never ship app private keys or OpenAI credentials to a public JavaScript bundle.
- An LLM-backed agent loop with file-search, read/write code, shell, tests, and optionally browser automation.
- A per-task isolated working directory/container or VM without production secrets, with scoped filesystem permissions, egress rules, time/compute budgets, and task logs.
- A workspace/session record, chat transcript, structured event stream (SSE/WebSocket), diffs and status.
- Build/test workers and a publish operation. An agent may edit *any* authorized file; publishing to main is a separate policy decision.
- A role policy: anonymous visitors can propose independent changes; owners/moderators merge or approve publication. For a public collaboration experiment, visitors may create shared content through a moderated API rather than having repository write access.
- Per-session isolation for parallel agents, resource quotas and conflict resolution.

## Recommended hosting split
- Static website: current hosting/CDN.
- Kijazo SDK: a tiny package bundled into the React app.
- API: small Node/Python service on existing Docker infrastructure, or a Cloudflare Worker for identity/session/queue entry.
- Agent workers: disposable containers/VMs on a Docker host. Long-running shell/browser builds do not belong inside a browser or short-lived edge request.
- Database and queue: PostgreSQL + Redis.
- GitHub: versioned source of truth. Host watches the production branch and deploys after accepted changes pass checks.
- AI: service-side API credentials; model responses alone never directly deploy or handle repository secrets.

## Interaction cycle
1. Visitor opens editor. SDK establishes a session and sends page/context and natural language.
2. Agent creates an isolated worktree from a known commit, plans/edits arbitrary authorized code and executes tests.
3. Runtime streams terminal output, diffs, screenshots and preview URLs back to the panel while it works.
4. Visitor asks for further changes in the same workspace; agent continues.
5. Visitor submits the changes. GitHub App opens a PR or, for owner-controlled mode, publishes after automated checks and explicit authorization.
6. Hosting provider deploys the accepted commit. Live visitors receive the new version.

**Never conflate unrestricted editing capacity with unrestricted production permissions.** An agent can have broad coding capabilities while being denied production secrets, payment credentials and unreviewed writes to a shared branch.

## Next implementation task
Replace `applyInstruction` with a request to `POST /sessions/:id/messages`; add a backend agent worker and an SSE events endpoint. Implement one full free-form edit, for example redesigning a React component; stream the work and serve a runnable preview. Only then automate GitHub publication.
