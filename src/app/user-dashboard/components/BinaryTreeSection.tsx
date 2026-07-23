'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PositionedBinaryTree, {
  BinaryTreeSide,
  PositionedBinaryTreeItem,
  PositionedBinaryTreeNode,
} from '@/components/network/PositionedBinaryTree';
import ZoomableTreeViewport from '@/components/network/ZoomableTreeViewport';

interface TreeNode {
  id: string;
  name: string;
  rank: string;
  currentStage?: string;
  currentStageName?: string;
  volume: number;
  status: string;
  leftChild?: TreeNode | null;
  rightChild?: TreeNode | null;
  joinDate: string;
}

interface TreeSizing {
  depth: number;
  leafSlots: number;
  nodeWidth: number;
  nodeHeight: number;
  leafGap: number;
  levelGap: number;
  avatarSize: number;
  avatarFontSize: number;
  nameFontSize: number;
  metaFontSize: number;
  badgeFontSize: number;
  cardPaddingX: number;
  cardPaddingY: number;
  connectorStroke: number;
}

type DiagramData = { type: 'member'; node: TreeNode } | { type: 'empty'; side: 'Left' | 'Right' };

const INITIAL_VISIBLE_DESCENDANT_DEPTH = 3;

const stageColors: Record<string, string> = {
  REGISTERED_ACTIVE: '#6B7280',
  STARTER_ENTRY_STAGE: '#64748B',
  EMERALD_STAGE_1: '#10B981',
  SILVER_STAGE_2: '#94A3B8',
  GOLD_STAGE_3: '#F59E0B',
  JASPER_STAGE_4: '#EF4444',
  SAPPHIRE_STAGE_5: '#3B82F6',
  DIAMOND_STAGE_6_FINAL: '#38BDF8',
};

const stageLegend = [
  { stage: 'EMERALD_STAGE_1', label: 'Emerald' },
  { stage: 'SILVER_STAGE_2', label: 'Silver' },
  { stage: 'DIAMOND_STAGE_6_FINAL', label: 'Diamond' },
];

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function getRenderedStats(
  node: TreeNode | null | undefined,
  depthIndex = 0
): { depth: number; leafSlots: number } {
  if (!node) return { depth: 1, leafSlots: 1 };

  const hasChildren = Boolean(node.leftChild || node.rightChild);
  const shouldRenderChildren = depthIndex < INITIAL_VISIBLE_DESCENDANT_DEPTH || hasChildren;

  if (!shouldRenderChildren) {
    return { depth: 1, leafSlots: 1 };
  }

  const leftStats = getRenderedStats(node.leftChild, depthIndex + 1);
  const rightStats = getRenderedStats(node.rightChild, depthIndex + 1);

  return {
    depth: 1 + Math.max(leftStats.depth, rightStats.depth),
    leafSlots: leftStats.leafSlots + rightStats.leafSlots,
  };
}

function getTreeSizing(rootNode: TreeNode): TreeSizing {
  const { depth, leafSlots } = getRenderedStats(rootNode);
  const breadthPressure = Math.max(0, Math.log2(Math.max(1, leafSlots)) - 2) * 0.7;
  const depthPressure = Math.max(0, depth - 3);
  const pressure = depthPressure + breadthPressure;

  return {
    depth,
    leafSlots,
    nodeWidth: Math.round(clampNumber(132 - pressure * 10, 78, 132)),
    nodeHeight: Math.round(clampNumber(118 - pressure * 7, 84, 118)),
    leafGap: Math.round(clampNumber(30 - pressure * 5, 8, 30)),
    levelGap: Math.round(clampNumber(46 - pressure * 5, 20, 46)),
    avatarSize: Math.round(clampNumber(32 - pressure * 1.8, 22, 32)),
    avatarFontSize: Math.round(clampNumber(11 - pressure * 0.35, 8, 11)),
    nameFontSize: Math.round(clampNumber(12 - pressure * 0.45, 9, 12)),
    metaFontSize: Math.round(clampNumber(10 - pressure * 0.35, 8, 10)),
    badgeFontSize: Math.round(clampNumber(10 - pressure * 0.35, 8, 10)),
    cardPaddingX: Math.round(clampNumber(10 - pressure * 0.8, 6, 10)),
    cardPaddingY: Math.round(clampNumber(8 - pressure * 0.7, 5, 8)),
    connectorStroke: clampNumber(2 - pressure * 0.12, 1.25, 2),
  };
}

function buildDiagramNode(
  node: TreeNode,
  path = 'root',
  depthIndex = 0,
  side?: BinaryTreeSide
): PositionedBinaryTreeNode<DiagramData> {
  const hasChildren = Boolean(node.leftChild || node.rightChild);
  const shouldRenderChildren = depthIndex < INITIAL_VISIBLE_DESCENDANT_DEPTH || hasChildren;

  return {
    key: `${path}-${node.id}`,
    side,
    data: { type: 'member', node },
    left: shouldRenderChildren
      ? node.leftChild
        ? buildDiagramNode(node.leftChild, `${path}-left`, depthIndex + 1, 'LEFT')
        : {
            key: `${path}-left-empty`,
            side: 'LEFT',
            data: { type: 'empty', side: 'Left' },
          }
      : undefined,
    right: shouldRenderChildren
      ? node.rightChild
        ? buildDiagramNode(node.rightChild, `${path}-right`, depthIndex + 1, 'RIGHT')
        : {
            key: `${path}-right-empty`,
            side: 'RIGHT',
            data: { type: 'empty', side: 'Right' },
          }
      : undefined,
  };
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || '?';
}

function getNodeStageColor(node: TreeNode) {
  return stageColors[node.currentStage || ''] || '#6B7280';
}

function PlacementLabel({ side }: { side?: BinaryTreeSide }) {
  if (!side) return <div className="h-0" />;

  const isLeft = side === 'LEFT';

  return (
    <div
      className="mb-1 max-w-full truncate rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
      style={{
        background: isLeft ? 'rgba(108,71,255,0.1)' : 'rgba(56,189,248,0.1)',
        color: isLeft ? 'var(--primary)' : 'var(--info)',
      }}
    >
      {isLeft ? 'Left Leg' : 'Right Leg'}
    </div>
  );
}

function MemberDiagramNode({
  item,
  sizing,
}: {
  item: PositionedBinaryTreeItem<DiagramData>;
  sizing: TreeSizing;
}) {
  if (item.data.type !== 'member') return null;

  const { node } = item.data;
  const rankColor = getNodeStageColor(node);
  const isRoot = item.depth === 0;

  return (
    <div className="flex h-full w-full flex-col items-center">
      <PlacementLabel side={item.side} />
      <div
        className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg text-center shadow-sm"
        style={{
          padding: `${sizing.cardPaddingY}px ${sizing.cardPaddingX}px`,
          background: isRoot
            ? 'linear-gradient(135deg, rgba(108,71,255,0.25) 0%, rgba(108,71,255,0.1) 100%)'
            : 'var(--card)',
          border: isRoot
            ? '1px solid rgba(108,71,255,0.5)'
            : `1px solid ${node.status === 'Active' ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
          boxShadow: isRoot ? '0 0 16px rgba(108,71,255,0.2)' : undefined,
        }}
      >
        <div
          className="mb-1 flex shrink-0 items-center justify-center rounded-full font-bold uppercase text-white"
          style={{
            width: sizing.avatarSize,
            height: sizing.avatarSize,
            fontSize: sizing.avatarFontSize,
            background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}88 100%)`,
          }}
        >
          {getInitials(node.name)}
        </div>
        <p
          className="mb-0.5 max-w-full truncate font-semibold leading-tight"
          style={{ color: 'var(--foreground)', fontSize: sizing.nameFontSize }}
          title={node.name}
        >
          {node.name}
        </p>
        <p
          className="max-w-full truncate font-mono-nums"
          style={{ color: 'var(--muted-foreground)', fontSize: sizing.metaFontSize }}
        >
          {node.id ? node.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}
        </p>
        <div className="mt-1 flex max-w-full flex-col items-center justify-center gap-0.5">
          <span
            className="max-w-full truncate rounded-full px-1.5 py-0.5 font-medium"
            style={{
              background: `${rankColor}15`,
              color: rankColor,
              fontSize: sizing.badgeFontSize,
            }}
            title={node.rank}
          >
            {node.rank || 'Entry'}
          </span>
          <span
            className="font-mono-nums"
            style={{ color: 'var(--accent)', fontSize: sizing.metaFontSize }}
          >
            {(node.volume || 0).toLocaleString()} PV
          </span>
        </div>
        {node.status !== 'Active' && (
          <span className="badge badge-pending mt-1 px-1.5 py-0" style={{ fontSize: 8 }}>
            {node.status}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyDiagramNode({
  item,
  sizing,
}: {
  item: PositionedBinaryTreeItem<DiagramData>;
  sizing: TreeSizing;
}) {
  if (item.data.type !== 'empty') return null;

  return (
    <div className="flex h-full w-full flex-col items-center">
      <PlacementLabel side={item.side} />
      <div
        className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg text-center transition-colors duration-150 hover:border-primary"
        style={{
          padding: `${sizing.cardPaddingY}px ${sizing.cardPaddingX}px`,
          background: 'rgba(108,71,255,0.04)',
          border: '1px dashed var(--border)',
        }}
      >
        <div
          className="mb-1 flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: sizing.avatarSize,
            height: sizing.avatarSize,
            background: 'var(--muted)',
          }}
        >
          <svg
            width={Math.max(12, sizing.avatarSize * 0.48)}
            height={Math.max(12, sizing.avatarSize * 0.48)}
            viewBox="0 0 14 14"
            fill="none"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p
          className="max-w-full truncate"
          style={{ color: 'var(--muted-foreground)', fontSize: sizing.nameFontSize }}
        >
          Open {item.data.side}
        </p>
        <p
          className="mt-0.5 max-w-full truncate"
          style={{ color: 'var(--primary)', fontSize: sizing.metaFontSize }}
        >
          Invite member
        </p>
      </div>
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

  const fallbackRootNode = useMemo<TreeNode | null>(() => {
    if (!summary) return null;

    return {
      id: summary.id || 'User',
      name: summary.name || 'You',
      rank: summary.currentStageName || summary.rank || 'Entry',
      currentStage: summary.currentStage,
      currentStageName: summary.currentStageName,
      volume: Math.min(summary.leftVolume || 0, summary.rightVolume || 0),
      status: summary.status === 'ACTIVE' ? 'Active' : 'Pending',
      joinDate: summary.createdAt || new Date().toISOString(),
      leftChild: null,
      rightChild: null,
    };
  }, [summary]);
  const rootNode = treeData ?? fallbackRootNode;
  const sizing = useMemo(() => (rootNode ? getTreeSizing(rootNode) : null), [rootNode]);
  const diagramRoot = useMemo(() => (rootNode ? buildDiagramNode(rootNode) : null), [rootNode]);

  if (!summary || !rootNode || !sizing || !diagramRoot) {
    return (
      <div
        className="flex h-[260px] items-center justify-center rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm text-slate-400 animate-pulse">Loading tree...</p>
      </div>
    );
  }

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
          {stageLegend.map(({ stage, label }) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: stageColors[stage] }}
              />
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {treeLoading && !treeData ? (
        <div className="flex min-h-[22rem] items-center justify-center">
          <p className="text-sm text-slate-400 animate-pulse">Loading live tree...</p>
        </div>
      ) : (
        <ZoomableTreeViewport
          ariaLabel="Binary network tree"
          variant="dark"
          resetKey={`${rootNode.id}-${sizing.depth}-${sizing.leafSlots}`}
          minScale={0.03}
          maxScale={3}
          fitPadding={28}
        >
          <PositionedBinaryTree
            root={diagramRoot}
            nodeWidth={sizing.nodeWidth}
            nodeHeight={sizing.nodeHeight}
            leafGap={sizing.leafGap}
            levelGap={sizing.levelGap}
            connectorColor="rgba(148,163,184,0.45)"
            connectorStrokeWidth={sizing.connectorStroke}
            renderNode={(item) =>
              item.data.type === 'member' ? (
                <MemberDiagramNode item={item} sizing={sizing} />
              ) : (
                <EmptyDiagramNode item={item} sizing={sizing} />
              )
            }
          />
        </ZoomableTreeViewport>
      )}
    </div>
  );
}
