'use client';
import React, { useEffect, useState } from 'react';

interface TreeNode {
  id: string;
  name: string;
  rank: string;
  volume: number;
  status: string;
  leftChild?: TreeNode | null;
  rightChild?: TreeNode | null;
  joinDate: string;
}

const rankColors: Record<string, string> = {
  'Registered / Active': '#6B7280',
  'Starter Stage - Entry Stage': '#64748B',
  'Starter Stage — Entry Stage': '#64748B',
  'Emerald — Stage 1': '#10B981',
  Silver: '#C0C0C0',
  'Silver — Stage 2': '#94A3B8',
  Bronze: '#CD7F32',
  Entry: '#6B7280',
  Gold: '#F59E0B',
  'Gold — Stage 3': '#F59E0B',
  'Jasper — Stage 4': '#EF4444',
  'Sapphire — Stage 5': '#3B82F6',
  Diamond: '#38BDF8',
  'Diamond — Stage 6 — Final Stage': '#38BDF8',
};

function TreeNodeCard({
  node,
  isRoot = false,
  level = 0,
}: {
  node: TreeNode;
  isRoot?: boolean;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.leftChild || node.rightChild;
  const rankColor = rankColors[node.rank] || '#6B7280';
  const isDeepNode = level >= 2;

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div
        className="group relative cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div
          className={`rounded-lg px-2.5 py-2 text-center shadow-sm md:px-3 md:py-2.5 ${
            isRoot
              ? 'w-[clamp(7.5rem,56vw,10rem)] md:w-[9.5rem]'
              : 'w-[clamp(6.5rem,44vw,8.75rem)] md:w-[8rem]'
          }`}
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
            className={`mx-auto mb-1.5 flex items-center justify-center rounded-full font-bold uppercase text-white ${
              isDeepNode ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-[11px]'
            }`}
            style={{ background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}88 100%)` }}
          >
            {node.name ? node.name.split(' ')[0][0] : '?'}
          </div>
          <p
            className="mb-0.5 max-w-full truncate text-xs font-semibold leading-tight"
            style={{ color: 'var(--foreground)' }}
          >
            {node.name.length > 16 ? node.name.slice(0, 14) + '…' : node.name}
          </p>
          <p className="text-xs font-mono-nums" style={{ color: 'var(--muted-foreground)' }}>
            {node.id ? node.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}
          </p>
          <div className="mt-1.5 flex flex-col items-center justify-center gap-1">
            <span
              className="max-w-full truncate rounded-full px-1.5 py-0.5 text-xs font-medium"
              style={{ background: `${rankColor}15`, color: rankColor, fontSize: '10px' }}
            >
              {node.rank || 'Entry'}
            </span>
            <span
              className="text-xs font-mono-nums"
              style={{ color: 'var(--accent)', fontSize: '10px' }}
            >
              {(node.volume || 0).toLocaleString()} PV
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
        <div className="mt-3 md:mt-4">
          {/* Connector line from parent */}
          <div className="relative flex items-start justify-center">
            <div
              className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 md:h-4"
              style={{ background: 'var(--border)' }}
            />
          </div>
          <div className="relative mt-3 flex w-full flex-col items-center justify-center gap-3 md:flex-row md:items-start md:gap-4">
            {/* Horizontal connector (desktop only) */}
            <div
              className="hidden md:block absolute top-0 left-[calc(25%)] h-0.5"
              style={{ width: '50%', background: 'var(--border)', top: '-8px' }}
            />
            {/* Left child */}
            <div className="flex flex-col items-center relative w-full md:w-auto">
              {/* Desktop vertical joiner */}
              <div
                className="mb-0 hidden h-3 w-0.5 -mt-2 md:block"
                style={{ background: 'var(--border)' }}
              />
              {/* Mobile vertical joiner (connects to parent or previous sibling) */}
              <div className="-mt-5 h-5 w-0.5 md:hidden" style={{ background: 'var(--border)' }} />

              <div
                className="mb-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:text-xs"
                style={{ background: 'rgba(108,71,255,0.1)', color: 'var(--primary)' }}
              >
                Left Leg
              </div>
              {node.leftChild ? (
                <TreeNodeCard node={node.leftChild} level={level + 1} />
              ) : (
                <EmptySlot side="Left" level={level + 1} />
              )}
            </div>
            {/* Right child */}
            <div className="flex flex-col items-center relative w-full md:w-auto">
              {/* Desktop vertical joiner */}
              <div
                className="mb-0 hidden h-3 w-0.5 -mt-2 md:block"
                style={{ background: 'var(--border)' }}
              />
              {/* Mobile vertical joiner (connects to left sibling on mobile) */}
              <div className="-mt-5 h-5 w-0.5 md:hidden" style={{ background: 'var(--border)' }} />

              <div
                className="mb-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:text-xs"
                style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--info)' }}
              >
                Right Leg
              </div>
              {node.rightChild ? (
                <TreeNodeCard node={node.rightChild} level={level + 1} />
              ) : (
                <EmptySlot side="Right" level={level + 1} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptySlot({ side, level = 0 }: { side: string; level?: number }) {
  const isDeepNode = level >= 2;

  return (
    <div
      className="w-[clamp(6.5rem,44vw,8.75rem)] cursor-pointer rounded-lg px-2.5 py-2 text-center transition-all duration-150 hover:border-primary md:w-[8rem] md:px-3 md:py-2.5"
      style={{
        background: 'rgba(108,71,255,0.04)',
        border: '1px dashed var(--border)',
      }}
    >
      <div
        className={`mx-auto mb-1.5 flex items-center justify-center rounded-full ${
          isDeepNode ? 'h-6 w-6' : 'h-7 w-7'
        }`}
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

interface BinaryTreeSectionProps {
  summary?: any;
}

export default function BinaryTreeSection({ summary }: BinaryTreeSectionProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  useEffect(() => {
    if (!summary) return;

    let active = true;
    setTreeLoading(true);
    setTreeError(null);

    fetch('/api/user/network/tree')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Unable to load binary tree');
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setTreeData(data.tree ?? null);
        }
      })
      .catch((error) => {
        if (active) {
          setTreeError(error.message || 'Unable to load binary tree');
          setTreeData(null);
        }
      })
      .finally(() => {
        if (active) {
          setTreeLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [summary]);

  // If no summary is loaded yet, show skeleton or empty
  if (!summary) {
    return (
      <div
        className="flex h-[260px] items-center justify-center rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm text-slate-400 animate-pulse">Loading tree...</p>
      </div>
    );
  }

  // Construct the root node from summary
  // Assuming API gives us leftLegCount, rightLegCount, etc.
  // We'll leave children empty for now since we're removing mock data.
  // Real tree data should be fetched from /api/user/network/tree
  const fallbackRootNode: TreeNode = {
    id: summary.id || 'User',
    name: summary.name || 'You',
    rank: summary.currentStageName || summary.rank || 'Entry',
    volume: Math.min(summary.leftVolume || 0, summary.rightVolume || 0),
    status: summary.status === 'ACTIVE' ? 'Active' : 'Pending',
    joinDate: summary.createdAt || new Date().toISOString(),
    leftChild: null,
    rightChild: null,
  };

  const rootNode = treeData ?? fallbackRootNode;

  return (
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            Binary Network Tree
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Your member-relative downline structure
          </p>
          {treeError && (
            <p className="mt-1 text-xs text-amber-600">
              Showing summary-only tree while live tree reloads.
            </p>
          )}
        </div>
        <div className="hidden flex-wrap gap-3 md:flex">
          {['Emerald — Stage 1', 'Silver — Stage 2', 'Diamond — Stage 6 — Final Stage'].map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: rankColors[r] }} />
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {r}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto overscroll-x-contain pb-2">
        <div className="flex min-w-full justify-center px-1 py-3 md:px-0">
          {treeLoading && !treeData ? (
            <p className="py-12 text-sm text-slate-400 animate-pulse">Loading live tree...</p>
          ) : (
            <TreeNodeCard node={rootNode} isRoot />
          )}
        </div>
      </div>
    </div>
  );
}
