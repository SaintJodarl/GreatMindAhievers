-- Forward-only reconciliation for production databases where the reward-withdrawal
-- workflow migration was not applied, was partially applied, or was marked applied
-- before the nullable Withdrawal linkage columns existed.

ALTER TABLE "Withdrawal"
  ADD COLUMN IF NOT EXISTS "rewardId" TEXT,
  ADD COLUMN IF NOT EXISTS "rewardClaimId" TEXT,
  ADD COLUMN IF NOT EXISTS "qualificationStage" TEXT,
  ADD COLUMN IF NOT EXISTS "rewardStatusSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionType" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentNote" TEXT;

ALTER TABLE "Withdrawal"
  ALTER COLUMN "rewardId" DROP NOT NULL,
  ALTER COLUMN "rewardClaimId" DROP NOT NULL,
  ALTER COLUMN "qualificationStage" DROP NOT NULL,
  ALTER COLUMN "rewardStatusSnapshot" DROP NOT NULL,
  ALTER COLUMN "rejectionType" DROP NOT NULL,
  ALTER COLUMN "approvedAt" DROP NOT NULL,
  ALTER COLUMN "rejectedAt" DROP NOT NULL,
  ALTER COLUMN "paidAt" DROP NOT NULL,
  ALTER COLUMN "paymentReference" DROP NOT NULL,
  ALTER COLUMN "paymentNote" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Withdrawal_rewardId_idx" ON "Withdrawal"("rewardId");
CREATE INDEX IF NOT EXISTS "Withdrawal_rewardClaimId_idx" ON "Withdrawal"("rewardClaimId");
CREATE INDEX IF NOT EXISTS "Withdrawal_rejectionType_idx" ON "Withdrawal"("rejectionType");
CREATE INDEX IF NOT EXISTS "Withdrawal_qualificationStage_idx" ON "Withdrawal"("qualificationStage");
CREATE INDEX IF NOT EXISTS "Withdrawal_paidAt_idx" ON "Withdrawal"("paidAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Withdrawal_non_correctable_rewardId_key"
  ON "Withdrawal"("rewardId")
  WHERE "rewardId" IS NOT NULL
    AND (
      "status" IN ('PENDING', 'APPROVED', 'PAID')
      OR ("status" = 'REJECTED' AND "rejectionType" = 'FINAL')
    );

CREATE UNIQUE INDEX IF NOT EXISTS "Withdrawal_non_correctable_rewardClaimId_key"
  ON "Withdrawal"("rewardClaimId")
  WHERE "rewardClaimId" IS NOT NULL
    AND (
      "status" IN ('PENDING', 'APPROVED', 'PAID')
      OR ("status" = 'REJECTED' AND "rejectionType" = 'FINAL')
    );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Withdrawal_rewardId_fkey'
      AND conrelid = '"Withdrawal"'::regclass
  ) THEN
    ALTER TABLE "Withdrawal"
      ADD CONSTRAINT "Withdrawal_rewardId_fkey"
      FOREIGN KEY ("rewardId") REFERENCES "Reward"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Withdrawal_rewardClaimId_fkey'
      AND conrelid = '"Withdrawal"'::regclass
  ) THEN
    ALTER TABLE "Withdrawal"
      ADD CONSTRAINT "Withdrawal_rewardClaimId_fkey"
      FOREIGN KEY ("rewardClaimId") REFERENCES "RewardClaim"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
