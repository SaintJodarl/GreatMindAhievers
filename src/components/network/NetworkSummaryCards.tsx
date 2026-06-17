'use client';
import React from 'react';
import { Users, UserPlus, ArrowLeft, ArrowRight, Target } from 'lucide-react';

interface SummaryData {
  directReferrals: number;
  totalDownlines: number;
  leftLegCount: number;
  rightLegCount: number;
  currentBinaryPosition: string;
  placementPosition: string;
  placementParent: string;
}

interface NetworkSummaryCardsProps {
  data: SummaryData;
}

const cards = [
  {
    key: 'directReferrals',
    label: 'Direct Referrals',
    icon: UserPlus,
    color: 'var(--primary)',
    bg: 'rgba(108, 71, 255, 0.1)',
    border: 'rgba(108, 71, 255, 0.2)',
  },
  {
    key: 'totalDownlines',
    label: 'Total Downlines',
    icon: Users,
    color: 'var(--accent)',
    bg: 'rgba(16, 217, 160, 0.1)',
    border: 'rgba(16, 217, 160, 0.2)',
  },
  {
    key: 'leftLegCount',
    label: 'Left Leg',
    icon: ArrowLeft,
    color: 'var(--info)',
    bg: 'rgba(56, 189, 248, 0.1)',
    border: 'rgba(56, 189, 248, 0.2)',
  },
  {
    key: 'rightLegCount',
    label: 'Right Leg',
    icon: ArrowRight,
    color: 'var(--warning)',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
  },
] as const;

export default function NetworkSummaryCards({ data }: NetworkSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: card.bg,
            border: `1px solid ${card.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl" style={{ background: `${card.color}20` }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold font-mono-nums" style={{ color: card.color }}>
              {data[card.key as keyof SummaryData]}
            </p>
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {card.label}
            </p>
          </div>
        </div>
      ))}

      <div
        className="lg:col-span-2 p-5 rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
            <Target size={20} style={{ color: 'var(--info)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Binary Position
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Current Path
            </p>
            <p className="text-sm font-mono-nums truncate" style={{ color: 'var(--foreground)' }}>
              {data.currentBinaryPosition}
            </p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Placement Side
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              {data.placementPosition}
            </p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Parent
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {data.placementParent === 'ROOT' ? 'ROOT (You)' : 'Under Placement'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
