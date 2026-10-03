# DataMind Frontend

Initial React frontend structure for the AI Data Analyst Workspace.

## Install

```bash
npm install
npm install ogl react-router-dom
```

If Tailwind is already configured, run:

```bash
npm run dev
```

## Routes

- `/` — Landing page
- `/signin` — Sign in page
- `/signup` — Sign up page
- `/profile-setup` — Nickname onboarding
- `/workspace` — Main AI analysis workspace
- `/workspace/datasets` — Datasets view & file management
- `/workspace/analyses` — Recent analyses history
- `/workspace/outputs` — Generated outputs & PDF reports
- `/workspace/settings` — Account, security & preferences settings
- `/workspace/analysis/:id` — Analysis detail & interactive follow-up chat
