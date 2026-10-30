# Project structure rules

Use this as a starting convention, not a requirement to create every folder immediately.

- `frontend/src/components/` — reusable UI pieces used in multiple places.
- `frontend/src/pages/` — route-level screens, once the app's pages are known.
- `frontend/src/layouts/` — shared page shells (for example, navigation/sidebar), only if needed.
- `frontend/src/services/` — API request functions; keep network calls out of visual components where practical.
- `frontend/src/hooks/` — reusable custom React hooks.
- `frontend/src/utils/` — small, pure helper functions.
- `frontend/src/assets/` — imported images, icons, and fonts.
- `frontend/src/styles/` — shared tokens or extra stylesheets if global CSS grows.

File naming:

- React components: `PascalCase.jsx`, e.g. `Header.jsx`.
- Hooks: `useSomething.js`, e.g. `useCases.js`.
- API/service modules and utilities: `camelCase.js`, e.g. `caseService.js`.
- Keep one component per file by default. Do not split tiny components into many files without a reason.

Wait for the official problem statement before creating product-specific folders or adding libraries. This keeps the starter small and prevents throwaway work.
