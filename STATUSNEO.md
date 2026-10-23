# StatusNeo × Wren AI

Black/yellow futuristic rebrand of Wren AI (legacy v1) with a landing page at `/`
and the workspace behind **Launch Wren AI** (`/launch`).

## Quick start
```bash
./run.sh                       # builds wren-ui FROM SOURCE and starts everything
OPENAI_API_KEY=sk-... ./run.sh # non-interactive
./run.sh logs wren-ui | status | down | rebuild | reset
```
Open http://localhost:3001 (change with `HOST_PORT`). Requires Docker + Compose v2
and ~8 GB RAM for the first UI build.

Files: `docker/docker-compose-local.yml`, `docker/.env.local.example`, `run.sh`.
Theme: `wren-ui/src/styles/antd-variables.less`, `components/statusneo.less`, `components/landing.less`.
Landing: `wren-ui/src/pages/index.tsx`; gate: `wren-ui/src/pages/launch.tsx`.
