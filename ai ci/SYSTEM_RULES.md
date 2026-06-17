# GMA System Rules & Non-Negotiable Constraints (SYSTEM_RULES)

All agents working on the Great Mind Achievers (GMA) codebase must strictly adhere to these architectural rules. Failure to comply will block production readiness approval.

---

## 💾 1. SQLite Database Rules
* **No `mode: 'insensitive'` searches**: SQLite does not support `mode: 'insensitive'` in Prisma filter queries. String queries like `contains` are case-insensitive by default in SQLite for ASCII characters.
* **No migrations for local dev updates**: Database push operations should use `npx prisma db push` during schema modifications.

---

## 💰 2. Wallet & Ledger Rules
* **Ledger-first Balance Modification**: Balance adjustments must never be written directly to the `Wallet.balance` field. All balance changes MUST be recorded as `WalletTransaction` entries (using methods in `src/lib/wallet/service.ts`), which update the balance field automatically inside transactions.
* **Wallet-User ID Alignment**: Ensure `Wallet.id === User.id`. When generating or seeding wallets, set the `id` property to match the `userId` to satisfy database foreign-key constraints on ledger actions.

---

## 🌳 3. Binary MLM Tree Rules
* **No Recursion**: Recursive searches (DFS or BFS) are strictly banned.
* **Ancestor Count Climbing**: Climbing parent hierarchies for count and volume updates must be performed using iterative loops.
* **Spillover Searches**: Auto-placements must follow extreme-left or extreme-right leg paths to find vacant leaves iteratively.

---

## 🔒 4. Authentication & Security Rules
* **Server-side Session Guards**: Protect all API endpoints under `/api/user` and `/api/admin` with session guards checking `getServerSession(authOptions)`.
* **KYC Enforcement**: All withdrawal processing requests must verify that the user's KYC status is `'APPROVED'`.
