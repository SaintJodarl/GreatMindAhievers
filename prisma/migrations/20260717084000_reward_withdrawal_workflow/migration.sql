-- Link reward-withdrawal requests to the authoritative reward/claim records.
-- This migration is intentionally additive and nullable so existing wallet-style
-- withdrawals can remain readable while new reward withdrawals are enforced.

ALTER TABLE "Withdrawal"
  ADD COLUMN "rewardId" TEXT,
  ADD COLUMN "rewardClaimId" TEXT,
  ADD COLUMN "qualificationStage" TEXT,
  ADD COLUMN "rewardStatusSnapshot" TEXT,
  ADD COLUMN "rejectionType" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "paymentReference" TEXT,
  ADD COLUMN "paymentNote" TEXT;

CREATE INDEX "Withdrawal_rewardId_idx" ON "Withdrawal"("rewardId");
CREATE INDEX "Withdrawal_rewardClaimId_idx" ON "Withdrawal"("rewardClaimId");
CREATE INDEX "Withdrawal_rejectionType_idx" ON "Withdrawal"("rejectionType");
CREATE INDEX "Withdrawal_qualificationStage_idx" ON "Withdrawal"("qualificationStage");
CREATE INDEX "Withdrawal_paidAt_idx" ON "Withdrawal"("paidAt");

-- Prisma cannot express this PostgreSQL partial uniqueness rule directly.
-- It permits historical CORRECTABLE rejections while preventing concurrent
-- active withdrawals, paid withdrawals, or FINAL rejections for the same
-- reward/claim.
CREATE UNIQUE INDEX "Withdrawal_non_correctable_rewardId_key"
  ON "Withdrawal"("rewardId")
  WHERE "rewardId" IS NOT NULL
    AND (
      "status" IN ('PENDING', 'APPROVED', 'PAID')
      OR ("status" = 'REJECTED' AND "rejectionType" = 'FINAL')
    );

CREATE UNIQUE INDEX "Withdrawal_non_correctable_rewardClaimId_key"
  ON "Withdrawal"("rewardClaimId")
  WHERE "rewardClaimId" IS NOT NULL
    AND (
      "status" IN ('PENDING', 'APPROVED', 'PAID')
      OR ("status" = 'REJECTED' AND "rejectionType" = 'FINAL')
    );

ALTER TABLE "Withdrawal"
  ADD CONSTRAINT "Withdrawal_rewardId_fkey"
  FOREIGN KEY ("rewardId") REFERENCES "Reward"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Withdrawal"
  ADD CONSTRAINT "Withdrawal_rewardClaimId_fkey"
  FOREIGN KEY ("rewardClaimId") REFERENCES "RewardClaim"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
