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
          className="px-4 py-3 rounded-xl text-center w-full max-w-[220px] md:min-w-[130px]"
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
            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-bold text-white uppercase"
            style={{ background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}88 100%)` }}
          >
            {node.name ? node.name.split(' ')[0][0] : '?'}
          </div>
          <p
            className="text-xs font-semibold leading-tight mb-0.5"
            style={{ color: 'var(--foreground)' }}
          >
            {node.name.length > 16 ? node.name.slice(0, 14) + '…' : node.name}
          </p>
          <p className="text-xs font-mono-nums" style={{ color: 'var(--muted-foreground)' }}>
            {node.id ? node.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
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
        <div className="mt-4 md:mt-6">
          {/* Connector line from parent */}
          <div className="relative flex items-start justify-center">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 md:h-4"
              style={{ background: 'var(--border)' }}
            />
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mt-4 relative w-full justify-center">
            {/* Horizontal connector (desktop only) */}
            <div
              className="hidden md:block absolute top-0 left-[calc(25%)] h-0.5"
              style={{ width: '50%', background: 'var(--border)', top: '-8px' }}
            />
            {/* Left child */}
            <div className="flex flex-col items-center relative w-full md:w-auto">
              {/* Desktop vertical joiner */}
              <div
                className="hidden md:block w-0.5 h-4 mb-0 -mt-2"
                style={{ background: 'var(--border)' }}
              />
              {/* Mobile vertical joiner (connects to parent or previous sibling) */}
              <div className="md:hidden w-0.5 h-6 -mt-6" style={{ background: 'var(--border)' }} />

              <div
                className="text-[10px] md:text-xs font-semibold mb-2 px-2 py-0.5 rounded uppercase tracking-wider"
                style={{ background: 'rgba(108,71,255,0.1)', color: 'var(--primary)' }}
              >
                Left Leg
              </div>
              {node.leftChild ? <TreeNodeCard node={node.leftChild} /> : <EmptySlot side="Left" />}
            </div>
            {/* Right child */}
            <div className="flex flex-col items-center relative w-full md:w-auto">
              {/* Desktop vertical joiner */}
              <div
                className="hidden md:block w-0.5 h-4 mb-0 -mt-2"
                style={{ background: 'var(--border)' }}
              />
              {/* Mobile vertical joiner (connects to left sibling on mobile) */}
              <div className="md:hidden w-0.5 h-6 -mt-6" style={{ background: 'var(--border)' }} />

              <div
                className="text-[10px] md:text-xs font-semibold mb-2 px-2 py-0.5 rounded uppercase tracking-wider"
                style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--info)' }}
              >
                Right Leg
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
      className="px-4 py-3 rounded-xl text-center w-full max-w-[200px] md:min-w-[120px] cursor-pointer transition-all duration-150 hover:border-primary"
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
      className="rounded-xl p-4 sm:p-5"
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

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-full justify-center px-2 py-4 md:px-0">
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
