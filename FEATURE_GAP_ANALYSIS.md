# GMA Feature Gap Analysis Report

This document outlines the gaps between the current GMA user dashboard implementation and the target HirePath-inspired redesign requirements.

---

## 1. Sidebar Collapse Persistence (Phase 3 Gap)
* **Current state**: The collapse toggle works, but it utilizes standard React component state inside `AppLayout.tsx`. The collapse state resets to `expanded` whenever:
  * A page refresh occurs.
  * A user logs out and logs back in.
  * A navigation changes pages (due to SSR page reloads).
* **Required state**: Persist the collapsed state in `localStorage` and read it upon mount to avoid hydration flickering.

---

## 2. Dashboard Home Page Redesign (Phase 5 Gap)
* **Current Layout**: Centered tab view (Overview, My Network, Earnings, Withdrawals) with standard blocks.
* **Target Layout (HirePath Theme)**:
  1. **Top Blue Banner Header**: A prominent full-width card styled in bright corporate/fintech blue containing the page title, user greeting text, notification bell, and primary action button (e.g. "+ Register Member" or "+ Copy Link").
  2. **Overlapping KPI Cards Grid**: Four clean, white cards positioned directly below/partially overlapping the blue header, displaying:
     * Card 1: Available Wallet Balance (e.g. `₦52,400`)
     * Card 2: Total Earnings (e.g. `₦124,500`)
     * Card 3: Team Downlines (e.g. `Left: 2 | Right: 1`)
     * Card 4: Direct Referrals (e.g. count of direct sponsored users)
  3. **Two-Column main content section**:
     * **Column 1 (Wide)**: "Recent Ledger Transactions" table/card layout styled like the scholarships view. Contains items displaying transaction details (Amount, Date, Status, Reference, Type) with a "View" button.
     * **Column 2 (Narrow)**: "Referred Downlines" vertical list card styled like the AI Match Alerts view. Contains referred user avatars, names, email contact, status badges (Active/Pending), and "View tree ->" redirect links.

---

## 3. Route & API Integrations Integrity
All API routes and database tables are fully operational and verified. The redesign will bind directly to these working backend endpoints, keeping business logic intact:
* **Dashboard Summary**: `/api/user/dashboard-summary`
* **Direct Referrals List**: `/api/user/network/direct-referrals`
* **Wallet Ledger History**: `/api/wallet/transactions` (or the summary object's transaction history list)
