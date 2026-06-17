# GMA User Dashboard Audit Report

## 1. Dashboard Architecture
The Great Mind Achievers (GMA) member application is built using **Next.js 15 (App Router)** and **TypeScript**. 
* **State Management**: React state (`useState`, `useEffect`) and server-side cache fetching via Next.js server components/actions.
* **Authentication**: NextAuth.js managing user credentials, statuses, and roles.
* **Database & ORM**: Prisma Client connecting to a local SQLite database (`dev.db`).

---

## 2. Directory & Page Route Hierarchy
All pages under `/user-dashboard` are wrapped inside the layout system:

* **`/user-dashboard`**: Main Overview containing tabbed views (Overview, My Network, Earnings, Withdrawals).
* **My Network (`/user-dashboard/network`)**:
  * `/tree`: Visual SVG Binary Tree explorer.
  * `/referrals`: Paginated direct referral list.
  * `/downline`: Downline member directory showing hierarchy depth.
  * `/sponsor`: Sponsor details display card.
* **Member Registration (`/user-dashboard/registration`)**:
  * `/new`: Interactive sponsor registration form.
  * `/placement`: Toggle strategy selector (LEFT or RIGHT).
  * `/history`: Historical log of registration cycles.
* **KYC & Verification (`/user-dashboard/kyc`)**:
  * `/complete`: Multi-stage identity, address, and selfie file uploader.
  * `/status`: Real-time audit status checks (Approved/Pending/Rejected).
  * `/documents`: View list of uploaded NIN/Passport attachments.
* **Referral Center (`/user-dashboard/referrals`)**:
  * `/link`: Social link generator (LEFT/RIGHT URL formats).
  * `/code`: Referral QR code download tool.
  * `/history`: Referred signups activity log.
* **Announcements (`/user-dashboard/announcements`)**:
  * `/news`: Official announcements feed.
  * `/welcome`: Active platform introductory headers.
  * `/training`: Strategy training manuals.
* **Support (`/user-dashboard/support`)**:
  * `/tickets`: Real-time ticket messaging threads.
  * `/help`: Searchable accordion FAQ list.
* **Account Settings (`/user-dashboard/account`)**:
  * `/profile`: Tabbed settings for contact information, notifications, and bank details.
  * `/security`: Changes passwords, displays active device logs, and toggles simulated 2FA.

---

## 3. Sidebar Navigation Analysis
* **Component**: `src/components/dashboard/member-sidebar.tsx`
* **Configuration**: `src/config/member-navigation.ts`
* **Collapsing Controls**: State is currently declared inline on `src/components/AppLayout.tsx`. It collapses but defaults back to open on page redirects and refreshes, failing the persistence criteria.

---

## 4. Wallet & Ledger System
* **Endpoints**: 
  * `GET /api/user/dashboard-summary` returns balance and payouts details.
  * `POST /api/user/kyc/submit` and wallet debit commands enforce absolute ledger-first integrity: no direct balance updates are allowed, and all operations generate corresponding `WalletTransaction` logs.

---

## 5. Feature Status Summary

| Module | Implementation Status | Gaps Identified |
| :--- | :--- | :--- |
| **Overview** | Fully Functional (Tabbed) | Reorganize style to match the modern two-column HirePath theme (Blue Header banner, KPI Cards grid overlay, recent ledger item cards, referred users list). |
| **Sidebar Collapse** | Partially Persisted | The sidebar state resets on refresh or page redirect. Needs permanent browser local storage persistence. |
| **KYC Verification** | Fully Functional | Needs visual layout matching and verification of responsive mobile wrappers. |
| **Profile Settings** | Fully Functional | Requires styling alignment to match modern typography hierarchies. |
