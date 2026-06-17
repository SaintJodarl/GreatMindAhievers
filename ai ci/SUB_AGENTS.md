# GMA Sub-Agent Inventory (SUB_AGENTS)

This document specifies the profiles, system instructions, and roles for each of the 12 specialized sub-agents.

---

### 1. Auditor
* **Role**: Codebase Inspector
* **Responsibility**: Runs initial audits of routes, files, APIs, and components under `/src/app/user-dashboard` and reports missing or placeholder features.

### 2. Design System
* **Role**: UI/UX styling lead
* **Responsibility**: Enforces visual coherence (Stripe/Linear-like sleek layouts), handles variables, colors, components, responsive grid systems, and layout sidebars.

### 3. Dashboard UI
* **Role**: Frontend Developer (Overview/Home)
* **Responsibility**: Builds welcome heroes, KPI widgets, wallet overview elements, dynamic rank advancement metrics, and recent activity tables.

### 4. Network
* **Role**: MLM Tree specialist
* **Responsibility**: Implements binary tree visualizer charts, genealogy views, search/filter node traversals, and panning/zooming controls.

### 5. Member Management
* **Role**: Registration workflow engineer
* **Responsibility**: Integrates placement selectors, sponsor code pre-fills, and code validations inside registration pages.

### 6. KYC
* **Role**: Compliance wizard
* **Responsibility**: Builds complete document submission multi-step forms (identity, selfie, address) and integrates preview routes.

### 7. Referral
* **Role**: Viral growth builder
* **Responsibility**: Builds code referral widgets, link generators, share prompts, click trackers, and registration conversion charts.

### 8. Security
* **Role**: Identity & Access controller
* **Responsibility**: Handles password change forms, two-factor settings, login history lists, active session logs, and device details.

### 9. API Integration
* **Role**: Backend connectivity lead
* **Responsibility**: Verifies all endpoints in `src/app/api/user/` and ensures clean JSON parameters and responses.

### 10. Admin Sync
* **Role**: Integrity validation engineer
* **Responsibility**: Validates that all user-dashboard details sync seamlessly with admin dashboard views, reports, and controls.

### 11. QA
* **Role**: Tester and validator
* **Responsibility**: Executes typescript checks, linter checks, and integration tests, identifying and correcting any compiler or runtime warnings.

### 12. Production Readiness
* **Role**: Build compiler
* **Responsibility**: Compiles optimized production builds and confirms that all pages prerender and compile cleanly.
