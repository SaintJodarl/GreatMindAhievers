'use client';

import React from 'react';
import {
  STAGE_CONFIG,
  STAGE_IDS,
  STAGE_ORDER,
  STAGE_RANK,
  StageId,
  getRequirementText,
  normalizeStageId,
} from '@/lib/qualification/constants';

interface StageProgressSnapshot {
  stage: string;
  stageName?: string;
  qualifiedContributorCount: number;
  requiredContributorCount: number;
  remainingContributorCount: number;
  leftQualifiedCount?: number;
  rightQualifiedCount?: number;
}

interface StageProgressionProps {
  currentStage?: string | null;
  nextStage?: string | null;
  stageProgress?: StageProgressSnapshot | null;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

function getStageState(stage: StageId, currentStage: StageId, progressStage?: StageId | null) {
  if (stage === currentStage) return 'current';
  if (progressStage && stage === progressStage) return 'in-progress';
  if (STAGE_RANK[stage] < STAGE_RANK[currentStage]) return 'completed';
  return 'upcoming';
}

function stateLabel(state: ReturnType<typeof getStageState>) {
  if (state === 'current') return 'Current';
  if (state === 'in-progress') return 'In Progress';
  if (state === 'completed') return 'Completed';
  return 'Upcoming';
}

function progressPercent(progress?: StageProgressSnapshot | null) {
  if (!progress || progress.requiredContributorCount <= 0) return 0;
  return Math.min(
    100,
    Math.round((progress.qualifiedContributorCount / progress.requiredContributorCount) * 100)
  );
}

export default function StageProgression({
  currentStage,
  nextStage,
  stageProgress,
}: StageProgressionProps) {
  const normalizedCurrentStage = normalizeStageId(currentStage);
  const progressStage = stageProgress?.stage ? normalizeStageId(stageProgress.stage) : null;
  const journeyStages = STAGE_ORDER.filter((stage) => stage !== STAGE_IDS.REGISTERED_ACTIVE);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Compensation Journey
          </p>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Starter Level to Stage 6
          </h2>
        </div>
        {nextStage && (
          <p className="text-xs font-semibold text-slate-500">
            Next focus:{' '}
            <span className="text-indigo-700">
              {STAGE_CONFIG[normalizeStageId(nextStage)].shortName}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {journeyStages.map((stage) => {
          const config = STAGE_CONFIG[stage];
          const state = getStageState(stage, normalizedCurrentStage, progressStage);
          const isActive = state === 'current' || state === 'in-progress';
          const progress = progressStage === stage ? stageProgress : null;
          const percent = progressPercent(progress);

          return (
            <article
              key={stage}
              className={`min-w-0 rounded-lg border p-3 transition-colors ${
                state === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : isActive
                    ? 'border-indigo-200 bg-indigo-50/60 ring-1 ring-indigo-100'
                    : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    {config.stageNumber ? `Stage ${config.stageNumber}` : 'Starter Level'}
                  </p>
                  <h3 className="mt-0.5 truncate text-sm font-bold text-slate-900">
                    {config.shortName}
                  </h3>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                    state === 'completed'
                      ? 'border-emerald-200 bg-white text-emerald-700'
                      : isActive
                        ? 'border-indigo-200 bg-white text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {stateLabel(state)}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Reward</span>
                  <strong className="text-right font-mono-nums text-slate-900">
                    {config.id === STAGE_IDS.STARTER_ENTRY_STAGE
                      ? config.rewardPackage
                      : config.hasReward
                        ? formatMoney(config.rewardValue)
                        : 'Not applicable'}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Requirement</span>
                  <strong className="text-right text-slate-900">
                    {config.requiredCount ? `${config.requiredCount} members` : 'Activation'}
                  </strong>
                </div>
              </div>

              {progress && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>
                      {progress.qualifiedContributorCount} of {progress.requiredContributorCount}
                    </span>
                    <span>{progress.remainingContributorCount} left</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${config.shortName} qualification progress`}
                  >
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {(typeof progress.leftQualifiedCount === 'number' ||
                    typeof progress.rightQualifiedCount === 'number') && (
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Left {progress.leftQualifiedCount ?? 0} / Right{' '}
                      {progress.rightQualifiedCount ?? 0}
                    </p>
                  )}
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-[11px] font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Details
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {getRequirementText(stage)}
                </p>
                {config.rewardPackage && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {config.rewardPackage}
                  </p>
                )}
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
