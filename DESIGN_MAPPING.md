# GMA Design Mapping Document

This document maps the visual modules from the HirePath mock design to the GMA MLM dashboard implementation.

---

## 1. Sidebar Redesign Mapping

| Reference Design Element | GMA MLM Sidebar Mapping | Backend Integration / Status |
| :--- | :--- | :--- |
| **Logo: "HirePath"** | Logo: "GMA Network" | Client-side SVG / Completed. |
| **Navigation Links** | GMA Navigation Links | Configured in `member-navigation.ts`. |
| **Notification Badges** | Numeric counts (e.g., Open Tickets: 2) | Feeds from `/api/user/dashboard-summary` support counts. |
| **Active State (Solid Purple Box)** | Highlight selected path in solid indigo background | Uses Next.js `usePathname()` to highlight active links. |
| **Footer: Avatar & Sign out** | Persistent Identity Card footer | Renders avatar initials, name, rank, verification status, and Sign Out. |

---

## 2. Top Blue Banner Header Mapping

| Reference Design Element | GMA MLM Overview Mapping | Backend Integration / Status |
| :--- | :--- | :--- |
| **Banner Container** | Bright Indigo/Blue Gradient Banner Card | Inline CSS grid styled in Tailwind CSS. |
| **Title: "Dashboard"** | Title: "Dashboard" | Static text. |
| **Subtitle: "Welcome back, [Name]"** | Subtitle: "Welcome back, [User.name]!" | Populated from NextAuth session and summary payload. |
| **Bell Icon (Notification)** | Interactive Notification Bell | Toggle notifications indicator. |
| **Button: "+ Create Scholarship"** | Button: "+ Register Member" | Links to `/user-dashboard/registration/new`. |

---

## 3. KPI Cards Grid Mapping

| Reference Design Element | GMA MLM Overview Mapping | Backend Integration / Status |
| :--- | :--- | :--- |
| **Card 1: Active Scholarship** | Available Balance (`Wallet.balance`) | Sourced from `/api/user/dashboard-summary` balance. |
| **Card 2: Total Applications** | Lifetime Earnings | Derived from `/api/user/dashboard-summary` total commissions. |
| **Card 3: Draft** | Team Downlines (`leftLegCount` + `rightLegCount`) | Derived from `/api/user/dashboard-summary` left and right leg counts. |
| **Card 4: Pending Review** | Direct Referrals | Derived from `/api/user/dashboard-summary` directReferrals count. |

---

## 4. Column 1 (Wide Panel) Mapping

| Reference Design Element | GMA MLM Overview Mapping | Backend Integration / Status |
| :--- | :--- | :--- |
| **Heading: "Active Scholarships"** | Heading: "Recent Ledger Transactions" | Sourced from `/api/user/dashboard-summary` transaction history. |
| **Link: "View All"** | Link: "View All" | Switches tab to `Earnings` or redirects to referrals link. |
| **List Item Card** | Modern Transaction card displaying amount, reference code, status (Completed/Pending/Rejected), and category (CREDIT/DEBIT). | Flex layout rendering transaction objects. |
| **Button: "View"** | Button: "View" | Triggers detailed transaction lookup. |

---

## 5. Column 2 (Narrow Panel) Mapping

| Reference Design Element | GMA MLM Overview Mapping | Backend Integration / Status |
| :--- | :--- | :--- |
| **Heading: "AI Match Alerts"** | Heading: "Referred Downlines" | Sourced from `/api/user/network/direct-referrals`. |
| **Link: "View All"** | Link: "View All" | Redirects to `/user-dashboard/network/referrals`. |
| **User Row Item** | Avatar initials, member name, email address, and leg position. | Renders sponsor registrations list. |
| **Link: "View Profile ->"** | Link: "View Tree ->" | Redirects to `/user-dashboard/network/tree?rootId=[id]`. |
