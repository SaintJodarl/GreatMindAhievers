# GMA Network Admin Back Office - Implementation Tasks

## Phase 1: Database Schema Updates (Critical Foundation)
- [x] Update Prisma schema with MLM binary fields (placement_id, binary_position, sponsor_id)
- [x] Add BinaryTree flat structure table
- [x] Enhance Transaction model with proper types (referral_bonus, binary_bonus, withdrawal, adjustment, credit, debit)
- [x] Enhance KYCSubmission with NIN, BVN, State, LGA, document fields
- [x] Add AdminRole model with permissions
- [x] Add WalletTransaction ledger model (separate from Transaction)
- [x] Add CommissionCycle model for cycle-based commissions
- [x] Add indexes for performance

## Phase 2: Core API Routes - Authentication & Authorization
- [x] Create admin-only middleware/guards
- [x] Implement role-based access control (super_admin, finance_admin, support_admin, read_only_admin)
- [x] Create API route for admin session validation

## Phase 3: Member Management API
- [x] GET /api/admin/members - paginated, searchable, filterable
- [x] GET /api/admin/members/[id] - full profile with sponsor chain, binary placement, wallet, KYC
- [x] PATCH /api/admin/members/[id] - manual placement override (admin only)
- [x] PATCH /api/admin/members/[id]/status - activate/deactivate

## Phase 4: Registration Codes API
- [x] POST /api/admin/codes/generate - generate codes (registration/KYC)
- [x] GET /api/admin/codes - list with filters
- [x] PATCH /api/admin/codes/[id] - revoke code
- [x] POST /api/admin/codes/bulk - bulk generate

## Phase 5: Wallet & Finance API (Ledger-First)
- [x] GET /api/admin/wallet/overview - system-wide balance audit
- [x] GET /api/admin/wallet/transactions - paginated, filterable ledger
- [x] GET /api/admin/wallet/user/[userId] - user wallet with derived balance
- [x] POST /api/admin/wallet/adjustment - admin adjustment (creates ledger entry)
- [x] Ensure ALL wallet changes go through wallet_transactions

## Phase 6: Withdrawals API (High Risk)
- [x] GET /api/admin/withdrawals - paginated, filterable
- [x] POST /api/admin/withdrawals/[id]/approve - validate KYC + balance, create ledger entry
- [x] POST /api/admin/withdrawals/[id]/reject - with reason, audit log
- [x] KYC blocking enforcement

## Phase 7: MLM Binary Engine (Storage Only - No Recursion)
- [x] Binary tree placement logic (find next available spot)
- [x] Flat binary_tree table population
- [x] Path string generation (ROOT/12/44/89)
- [x] Depth calculation
- [x] No DFS/BFS/runtime tree traversal

## Phase 8: Commission Engine (Cycle-Based)
- [x] Commission cycle management
- [x] Binary matching bonus calculation (stored, not realtime)
- [x] Referral commission calculation (stored, not realtime)
- [x] Leadership bonus
- [x] No live tree traversal

## Phase 9: KYC Management API
- [x] GET /api/admin/kyc - paginated submissions
- [x] GET /api/admin/kyc/[id] - full details with documents
- [x] POST /api/admin/kyc/[id]/approve - with audit log
- [x] POST /api/admin/kyc/[id]/reject - with reason, audit log
- [x] File upload for KYC documents (local storage)

## Phase 10: Support System API
- [x] GET /api/admin/support/tickets - paginated, filterable
- [x] GET /api/admin/support/tickets/[id] - with messages
- [x] POST /api/admin/support/tickets/[id]/respond - admin reply
- [x] PATCH /api/admin/support/tickets/[id]/status - open/in_progress/resolved/closed

## Phase 11: Content Management API
- [x] CRUD for Content blocks
- [x] CRUD for Welcome Messages
- [x] Publish/unpublish toggles

## Phase 12: Reports & Analytics API
- [x] GET /api/admin/reports/summary - totals, active users, wallet flow
- [x] GET /api/admin/reports/withdrawals - totals by period
- [x] GET /api/admin/reports/commissions - totals by type
- [x] GET /api/admin/reports/kyc - approval rates
- [x] Cached responses, no heavy computation

## Phase 13: Admin Roles & Permissions API
- [x] GET /api/admin/roles - list admins with roles
- [x] POST /api/admin/roles - invite admin with role
- [x] PATCH /api/admin/roles/[id] - update role/permissions
- [x] Permission enforcement on all admin APIs

## Phase 14: Audit Logs Integration
- [x] Middleware/helper to log all admin actions
- [x] Log: wallet edits, approvals, KYC decisions, withdrawals, code generation, role changes
- [x] GET /api/admin/audit - paginated, filterable

## Phase 15: Frontend Integration - Make All UI Functional
- [x] Connect all admin page buttons to API routes
- [x] Add loading states, error handling, toast notifications
- [x] Implement modals for create/edit actions
- [x] Add pagination controls
- [x] Add search/filter functionality
- [x] File upload components for KYC

## Phase 16: Testing & Validation
- [x] Run prisma migrate / db push
- [x] Run seed
- [x] Test all admin flows
- [x] Verify no recursive MLM logic
- [x] Verify wallet ledger integrity
- [x] Verify KYC blocks withdrawals
- [x] Verify audit trail completeness