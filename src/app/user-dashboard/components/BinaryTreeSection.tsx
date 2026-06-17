'use client';
import React, { useState } from 'react';

interface TreeNode {
  id: string;
  name: string;
  rank: string;
  volume: number;
  status: 'Active' | 'Pending' | 'Suspended';
  leftChild?: TreeNode;
  rightChild?: TreeNode;
  joinDate: string;
}

const TREE_DATA: TreeNode = {
  id: 'GMA-00142',
  name: 'Adebayo Okafor (You)',
  rank: 'Silver',
  volume: 27300,
  status: 'Active',
  joinDate: 'Jan 12, 2026',
  leftChild: {
    id: 'GMA-00218',
    name: 'Chidinma Obi',
    rank: 'Bronze',
    volume: 8420,
    status: 'Active',
    joinDate: 'Feb 3, 2026',
    leftChild: {
      id: 'GMA-00341',
      name: 'Emeka Nwosu',
      rank: 'Entry',
      volume: 2100,
      status: 'Active',
      joinDate: 'Mar 15, 2026',
    },
    rightChild: {
      id: 'GMA-00389',
      name: 'Amaka Eze',
      rank: 'Entry',
      volume: 1840,
      status: 'Pending',
      joinDate: 'Apr 2, 2026',
    },
  },
  rightChild: {
    id: 'GMA-00267',
    name: 'Tunde Bakare',
    rank: 'Bronze',
    volume: 6180,
    status: 'Active',
    joinDate: 'Feb 18, 2026',
    leftChild: {
      id: 'GMA-00412',
      name: 'Ngozi Adeyemi',
      rank: 'Entry',
      volume: 1650,
      status: 'Active',
      joinDate: 'Mar 28, 2026',
    },
    rightChild: {
      id: 'GMA-00445',
      name: 'Kelechi Eze',
      rank: 'Entry',
      volume: 980,
      status: 'Active',
      joinDate: 'Apr 10, 2026',
    },
  },
};

const rankColors: Record<string, string> = {
  Silver: '#C0C0C0',
  Bronze: '#CD7F32',
  Entry: '#6B7280',
  Gold: '#F59E0B',
  Diamond: '#38BDF8',
};

function TreeNodeCard({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.leftChild || node.rightChild;
  const rankColor = rankColors[node.rank] || '#6B7280';

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div
        className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div
          className="px-4 py-3 rounded-xl text-center min-w-[130px]"
          style={
            isRoot
              ? {
                  background:
                    'linear-gradient(135deg, rgba(108,71,255,0.25) 0%, rgba(108,71,255,0.1) 100%)',
                  border: '1px solid rgba(108,71,255,0.5)',
                  boxShadow: '0 0 16px rgba(108,71,255,0.2)',
                }
              : {
                  background: 'var(--card)',
                  border: `1px solid ${node.status === 'Active' ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
                }
          }
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}88 100%)` }}
          >
            {node.name.split(' ')[0][0]}
          </div>
          <p
            className="text-xs font-semibold leading-tight mb-0.5"
            style={{ color: 'var(--foreground)' }}
          >
            {node.name.length > 16 ? node.name.slice(0, 14) + '…' : node.name}
          </p>
          <p className="text-xs font-mono-nums" style={{ color: 'var(--muted-foreground)' }}>
            {node.id}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: `${rankColor}15`, color: rankColor, fontSize: '10px' }}
            >
              {node.rank}
            </span>
            <span
              className="text-xs font-mono-nums"
              style={{ color: 'var(--accent)', fontSize: '10px' }}
            >
              {node.volume.toLocaleString()} PV
            </span>
          </div>
          {node.status !== 'Active' && (
            <div className="mt-1">
              <span className="badge badge-pending" style={{ fontSize: '9px' }}>
                {node.status}
              </span>
            </div>
          )}
        </div>
        {hasChildren && (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-xs transition-transform duration-200"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {expanded ? '−' : '+'}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-6">
          {/* Connector lines */}
          <div className="relative flex items-start justify-center">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4"
              style={{ background: 'var(--border)' }}
            />
          </div>
          <div className="flex gap-8 mt-4 relative">
            {/* Horizontal connector */}
            <div
              className="absolute top-0 left-[calc(25%)] h-0.5"
              style={{ width: '50%', background: 'var(--border)', top: '-8px' }}
            />
            {/* Left child */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 mb-0 -mt-2" style={{ background: 'var(--border)' }} />
              <div
                className="text-xs font-semibold mb-2 px-2 py-0.5 rounded"
                style={{ background: 'rgba(108,71,255,0.1)', color: 'var(--primary)' }}
              >
                L
              </div>
              {node.leftChild ? <TreeNodeCard node={node.leftChild} /> : <EmptySlot side="Left" />}
            </div>
            {/* Right child */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 mb-0 -mt-2" style={{ background: 'var(--border)' }} />
              <div
                className="text-xs font-semibold mb-2 px-2 py-0.5 rounded"
                style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--info)' }}
              >
                R
              </div>
              {node.rightChild ? (
                <TreeNodeCard node={node.rightChild} />
              ) : (
                <EmptySlot side="Right" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptySlot({ side }: { side: string }) {
  return (
    <div
      className="px-4 py-3 rounded-xl text-center min-w-[120px] cursor-pointer transition-all duration-150 hover:border-primary"
      style={{
        background: 'rgba(108,71,255,0.04)',
        border: '1px dashed var(--border)',
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5"
        style={{ background: 'var(--muted)' }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Open {side}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--primary)', fontSize: '10px' }}>
        Invite member
      </p>
    </div>
  );
}

export default function BinaryTreeSection() {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            Binary Network Tree
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Your downline structure — click nodes to expand/collapse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
              Left: 14,820 PV
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--info)' }} />
              Right: 12,480 PV
            </span>
          </div>
        </div>
      </div>

      {/* Tree container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex justify-center min-w-[600px] py-4">
          <TreeNodeCard node={TREE_DATA} isRoot />
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Rank:
        </p>
        {Object.entries(rankColors).map(([rank, color]) => (
          <div key={`legend-${rank}`} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {rank}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
