-- Dynamic stage qualification support.
-- This migration is additive and preserves existing genealogy, sponsor, placement, reward, and wallet data.

ALTER TABLE "User" ALTER COLUMN "currentStage" SET DEFAULT 'REGISTERED_ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "highestStage" TEXT NOT NULL DEFAULT 'REGISTERED_ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stageUpdatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "finalStageCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "compensationPlanStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "User_currentStage_idx" ON "User"("currentStage");
CREATE INDEX IF NOT EXISTS "User_highestStage_idx" ON "User"("highestStage");
CREATE INDEX IF NOT EXISTS "User_compensationPlanStatus_idx" ON "User"("compensationPlanStatus");

ALTER TABLE "StageProgress" ADD COLUMN IF NOT EXISTS "qualifiedContributorCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StageProgress" ADD COLUMN IF NOT EXISTS "requiredContributorCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StageProgress" ADD COLUMN IF NOT EXISTS "remainingContributorCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StageProgress" ADD COLUMN IF NOT EXISTS "requirementStage" TEXT;
ALTER TABLE "StageProgress" ADD COLUMN IF NOT EXISTS "calculationId" TEXT;

CREATE TABLE IF NOT EXISTS "StageHistory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "qualifiedAt" TIMESTAMP(3) NOT NULL,
    "qualificationRuleVersion" TEXT NOT NULL,
    "triggerMemberId" TEXT,
    "calculationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StageHistory_memberId_toStage_key" ON "StageHistory"("memberId", "toStage");
CREATE INDEX IF NOT EXISTS "StageHistory_memberId_idx" ON "StageHistory"("memberId");
CREATE INDEX IF NOT EXISTS "StageHistory_toStage_idx" ON "StageHistory"("toStage");
CREATE INDEX IF NOT EXISTS "StageHistory_qualifiedAt_idx" ON "StageHistory"("qualifiedAt");
CREATE INDEX IF NOT EXISTS "StageHistory_triggerMemberId_idx" ON "StageHistory"("triggerMemberId");
CREATE INDEX IF NOT EXISTS "StageHistory_calculationId_idx" ON "StageHistory"("calculationId");

CREATE TABLE IF NOT EXISTS "QualificationContributor" (
    "id" TEXT NOT NULL,
    "stageHistoryId" TEXT NOT NULL,
    "qualifyingMemberId" TEXT NOT NULL,
    "contributorMemberId" TEXT NOT NULL,
    "contributorStageAtQualification" TEXT NOT NULL,
    "genealogyDepth" INTEGER NOT NULL,
    "contributorQualifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualificationContributor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QualificationContributor_stageHistoryId_contributorMemberId_key" ON "QualificationContributor"("stageHistoryId", "contributorMemberId");
CREATE INDEX IF NOT EXISTS "QualificationContributor_qualifyingMemberId_idx" ON "QualificationContributor"("qualifyingMemberId");
CREATE INDEX IF NOT EXISTS "QualificationContributor_contributorMemberId_idx" ON "QualificationContributor"("contributorMemberId");
CREATE INDEX IF NOT EXISTS "QualificationContributor_contributorStageAtQualification_idx" ON "QualificationContributor"("contributorStageAtQualification");

CREATE TABLE IF NOT EXISTS "StageLoan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "principal" DECIMAL(65,30) NOT NULL,
    "interestRate" DECIMAL(65,30) NOT NULL,
    "interestAmount" DECIMAL(65,30) NOT NULL,
    "totalRepayable" DECIMAL(65,30) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountRepaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StageLoan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StageLoan_userId_stage_key" ON "StageLoan"("userId", "stage");
CREATE INDEX IF NOT EXISTS "StageLoan_userId_idx" ON "StageLoan"("userId");
CREATE INDEX IF NOT EXISTS "StageLoan_stage_idx" ON "StageLoan"("stage");
CREATE INDEX IF NOT EXISTS "StageLoan_status_idx" ON "StageLoan"("status");

CREATE TABLE IF NOT EXISTS "StageLoanAudit" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StageLoanAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StageLoanAudit_loanId_idx" ON "StageLoanAudit"("loanId");
CREATE INDEX IF NOT EXISTS "StageLoanAudit_adminId_idx" ON "StageLoanAudit"("adminId");
CREATE INDEX IF NOT EXISTS "StageLoanAudit_action_idx" ON "StageLoanAudit"("action");
CREATE INDEX IF NOT EXISTS "StageLoanAudit_createdAt_idx" ON "StageLoanAudit"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StageHistory_memberId_fkey') THEN
    ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StageHistory_triggerMemberId_fkey') THEN
    ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_triggerMemberId_fkey" FOREIGN KEY ("triggerMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QualificationContributor_stageHistoryId_fkey') THEN
    ALTER TABLE "QualificationContributor" ADD CONSTRAINT "QualificationContributor_stageHistoryId_fkey" FOREIGN KEY ("stageHistoryId") REFERENCES "StageHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QualificationContributor_qualifyingMemberId_fkey') THEN
    ALTER TABLE "QualificationContributor" ADD CONSTRAINT "QualificationContributor_qualifyingMemberId_fkey" FOREIGN KEY ("qualifyingMemberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QualificationContributor_contributorMemberId_fkey') THEN
    ALTER TABLE "QualificationContributor" ADD CONSTRAINT "QualificationContributor_contributorMemberId_fkey" FOREIGN KEY ("contributorMemberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StageLoan_userId_fkey') THEN
    ALTER TABLE "StageLoan" ADD CONSTRAINT "StageLoan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StageLoanAudit_loanId_fkey') THEN
    ALTER TABLE "StageLoanAudit" ADD CONSTRAINT "StageLoanAudit_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "StageLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
