---
name: project-architecture
description: Use for system boundaries, data flow, module ownership, and technical decisions that affect multiple components.
---

# Architecture

- Start with the smallest diagram or data-flow note needed for the decision.
- Define interfaces, ownership, failure handling, and migration impact before implementation.
- Prefer explicit contracts and simple components over premature abstractions.
- Record confirmed decisions in the relevant design document; keep handoff state concise.

## Confirmed frontend baseline

- MDL 1F uses React/Vite/strict TypeScript and Supabase browser Auth with PKCE.
- Fastify remains the application-data boundary; profile ownership comes from its verified JWT.
- See `docs/ARCHITECTURE.md` for module boundaries, callback behavior and validation limits.
