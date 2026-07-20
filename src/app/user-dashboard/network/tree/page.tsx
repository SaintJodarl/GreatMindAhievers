'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, UserPlus, ShieldAlert } from 'lucide-react';
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
  volume: number;
  leftVolume?: number;
  rightVolume?: number;
  status: string;
  joinDate: string;
  leftChild?: TreeNode | null;
  rightChild?: TreeNode | null;
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

type DiagramData =
  | { type: 'member'; node: TreeNode }
  | { type: 'empty'; parentId: string; position: 'LEFT' | 'RIGHT' };

const rankColors: Record<string, string> = {
  Diamond: '#38BDF8',
  Gold: '#F59E0B',
  Silver: '#C0C0C0',
  Bronze: '#CD7F32',
  Entry: '#6B7280',
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function getRenderedStats(node: TreeNode, depthIndex = 0): { depth: number; leafSlots: number } {
  const hasActualChildren = Boolean(node.leftChild || node.rightChild);
  const shouldRenderChildren = depthIndex < 2 || hasActualChildren;

  if (!shouldRenderChildren) {
    return { depth: 1, leafSlots: 1 };
  }

  const leftStats = node.leftChild
    ? getRenderedStats(node.leftChild, depthIndex + 1)
    : { depth: 1, leafSlots: 1 };
  const rightStats = node.rightChild
    ? getRenderedStats(node.rightChild, depthIndex + 1)
    : { depth: 1, leafSlots: 1 };

  return {
    depth: 1 + Math.max(leftStats.depth, rightStats.depth),
    leafSlots: leftStats.leafSlots + rightStats.leafSlots,
  };
}

function getTreeSizing(rootNode: TreeNode): TreeSizing {
  const { depth, leafSlots } = getRenderedStats(rootNode);
  const breadthPressure = Math.max(0, Math.log2(Math.max(1, leafSlots)) - 2) * 0.65;
  const depthPressure = Math.max(0, depth - 3);
  const pressure = depthPressure + breadthPressure;

  return {
    depth,
    leafSlots,
    nodeWidth: Math.round(clampNumber(138 - pressure * 10, 82, 138)),
    nodeHeight: Math.round(clampNumber(134 - pressure * 8, 94, 134)),
    leafGap: Math.round(clampNumber(34 - pressure * 5, 10, 34)),
    levelGap: Math.round(clampNumber(54 - pressure * 6, 24, 54)),
    avatarSize: Math.round(clampNumber(34 - pressure * 2, 24, 34)),
    avatarFontSize: Math.round(clampNumber(11 - pressure * 0.35, 8, 11)),
    nameFontSize: Math.round(clampNumber(12 - pressure * 0.35, 9, 12)),
    metaFontSize: Math.round(clampNumber(10 - pressure * 0.3, 8, 10)),
    badgeFontSize: Math.round(clampNumber(10 - pressure * 0.3, 8, 10)),
    cardPaddingX: Math.round(clampNumber(10 - pressure * 0.8, 6, 10)),
    cardPaddingY: Math.round(clampNumber(10 - pressure * 0.8, 6, 10)),
    connectorStroke: clampNumber(2 - pressure * 0.12, 1.25, 2),
  };
}

function buildDiagramNode(
  node: TreeNode,
  path = 'root',
  depthIndex = 0,
  side?: BinaryTreeSide
): PositionedBinaryTreeNode<DiagramData> {
  const hasActualChildren = Boolean(node.leftChild || node.rightChild);
  const shouldRenderChildren = depthIndex < 2 || hasActualChildren;

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
            data: { type: 'empty', parentId: node.id, position: 'LEFT' },
          }
      : undefined,
    right: shouldRenderChildren
      ? node.rightChild
        ? buildDiagramNode(node.rightChild, `${path}-right`, depthIndex + 1, 'RIGHT')
        : {
            key: `${path}-right-empty`,
            side: 'RIGHT',
            data: { type: 'empty', parentId: node.id, position: 'RIGHT' },
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

  return initials || '??';
}

function PlacementLabel({ side }: { side?: BinaryTreeSide }) {
  if (!side) return <div className="h-0" />;

  const isLeft = side === 'LEFT';

  return (
    <div
      className={`mb-1 max-w-full truncate rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
        isLeft
          ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
          : 'border-sky-200 bg-sky-50 text-sky-600'
      }`}
    >
      {isLeft ? 'Left Leg' : 'Right Leg'}
    </div>
  );
}

function TreeMemberNode({
  item,
  sizing,
  onSelect,
}: {
  item: PositionedBinaryTreeItem<DiagramData>;
  sizing: TreeSizing;
  onSelect: (nodeId: string) => void;
}) {
  if (item.data.type !== 'member') return null;

  const { node } = item.data;
  const rankColor = rankColors[node.rank] || '#6B7280';
  const isRoot = item.depth === 0;

  return (
    <div className="flex h-full w-full flex-col items-center">
      <PlacementLabel side={item.side} />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node.id);
        }}
        className={`group flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-lg text-center shadow-sm transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          isRoot
            ? 'border-2 border-indigo-500/50 bg-indigo-50/95 shadow-indigo-100/50'
            : 'border border-gray-200 bg-white hover:border-indigo-400'
        }`}
        style={{ padding: `${sizing.cardPaddingY}px ${sizing.cardPaddingX}px` }}
      >
        <div
          className="mb-1 flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner"
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
          className="max-w-full truncate font-bold leading-tight text-gray-900"
          style={{ fontSize: sizing.nameFontSize }}
          title={node.name}
        >
          {node.name}
        </p>
        <p
          className="mt-0.5 max-w-full truncate font-mono text-gray-500"
          style={{ fontSize: sizing.metaFontSize }}
          title={node.id}
        >
          {node.id}
        </p>
        <div className="mt-1 flex max-w-full flex-col items-center gap-0.5">
          <span
            className="max-w-full truncate rounded-full px-1.5 py-0.5 font-semibold"
            style={{
              background: `${rankColor}15`,
              color: rankColor,
              fontSize: sizing.badgeFontSize,
            }}
          >
            {node.rank}
          </span>
          <span
            className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono font-medium text-indigo-600"
            style={{ fontSize: sizing.metaFontSize }}
          >
            {(node.volume || 0).toLocaleString()} PV
          </span>
        </div>
        <span
          className={`mt-1 rounded-full border px-1.5 py-0.5 font-medium ${
            node.status === 'ACTIVE' || node.status === 'Active'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : node.status === 'PENDING' || node.status === 'Pending'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
          style={{ fontSize: Math.max(8, sizing.metaFontSize - 1) }}
        >
          {node.status}
        </span>
      </button>
    </div>
  );
}

function EmptySlotNode({
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
      <Link
        href={`/user-dashboard/registration/new?position=${item.data.position}&placementId=${item.data.parentId}`}
        className="group flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/70 text-center transition-all duration-150 hover:border-indigo-400 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        style={{ padding: `${sizing.cardPaddingY}px ${sizing.cardPaddingX}px` }}
      >
        <div
          className="mb-1 flex shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-indigo-100"
          style={{ width: sizing.avatarSize, height: sizing.avatarSize }}
        >
          <UserPlus
            size={Math.max(14, sizing.avatarSize * 0.52)}
            className="text-gray-400 group-hover:text-indigo-600"
          />
        </div>
        <p
          className="max-w-full truncate font-semibold text-gray-600 group-hover:text-indigo-700"
          style={{ fontSize: sizing.nameFontSize }}
        >
          Open Slot
        </p>
        <p
          className="mt-0.5 max-w-full truncate text-gray-400"
          style={{ fontSize: sizing.metaFontSize }}
        >
          Position: {item.data.position}
        </p>
        <span
          className="mt-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-bold text-indigo-600 shadow-sm transition-all group-hover:border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white"
          style={{ fontSize: sizing.badgeFontSize }}
        >
          Invite Member
        </span>
      </Link>
    </div>
  );
}

export default function BinaryTreePage() {
  const { user } = useAuth();
  const loggedInUserId = user?.id;

  const [rootId, setRootId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/user/network/tree';
      if (rootId) {
        url += `?rootId=${rootId}`;
      }

      const res = await api(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch tree data');
      }

      const data = await res.json();
      setTreeData(data.tree);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading the network tree.');
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  useEffect(() => {
    if (user) {
      fetchTree();
    }
  }, [user, fetchTree]);

  const handleNodeClick = (nodeId: string) => {
    setRootId(nodeId);
  };

  const handleReset = () => {
    setRootId(null);
  };

  const sizing = useMemo(() => (treeData ? getTreeSizing(treeData) : null), [treeData]);
  const diagramRoot = useMemo(() => (treeData ? buildDiagramNode(treeData) : null), [treeData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Binary Network Tree
          </h1>
          <p className="text-gray-500 mt-1">Visualize and traverse your downline placement.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {rootId && rootId !== loggedInUserId && (
            <button
              onClick={handleReset}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
            >
              <ArrowLeft size={16} />
              Back to My Tree
            </button>
          )}

          <button
            onClick={fetchTree}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 flex items-start gap-4">
          <ShieldAlert className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-sm">Error Loading Tree</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            {rootId && (
              <button
                onClick={handleReset}
                className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
              >
                Reset to My Tree
              </button>
            )}
          </div>
        </div>
      )}

      {loading && !treeData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[450px]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium text-sm">Loading your network hierarchy...</p>
        </div>
      )}

      {!loading && !error && treeData && sizing && diagramRoot && (
        <div className="max-w-full overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Current Tree Focus
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                {treeData.name} ({treeData.id})
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 text-right sm:flex sm:items-center sm:gap-4">
              <div className="text-right">
                <span className="text-xs text-gray-500">Left Vol (PV)</span>
                <p className="text-base font-bold text-indigo-600">
                  {(treeData.leftVolume || 0).toLocaleString()}
                </p>
              </div>
              <div className="hidden h-8 w-px bg-gray-100 sm:block" />
              <div className="text-right">
                <span className="text-xs text-gray-500">Right Vol (PV)</span>
                <p className="text-base font-bold text-indigo-600">
                  {(treeData.rightVolume || 0).toLocaleString()}
                </p>
              </div>
              <div className="hidden h-8 w-px bg-gray-100 sm:block" />
              <div className="text-right">
                <span className="text-xs text-gray-500">Total Volume</span>
                <p className="text-base font-bold text-gray-900">
                  {(treeData.volume || 0).toLocaleString()} PV
                </p>
              </div>
            </div>
          </div>

          <ZoomableTreeViewport
            ariaLabel="Binary network tree"
            variant="light"
            resetKey={`${treeData.id}-${sizing.depth}-${sizing.leafSlots}`}
            minScale={0.03}
            maxScale={3}
            fitPadding={32}
          >
            <PositionedBinaryTree
              root={diagramRoot}
              nodeWidth={sizing.nodeWidth}
              nodeHeight={sizing.nodeHeight}
              leafGap={sizing.leafGap}
              levelGap={sizing.levelGap}
              connectorColor="#CBD5E1"
              connectorStrokeWidth={sizing.connectorStroke}
              renderNode={(item) =>
                item.data.type === 'member' ? (
                  <TreeMemberNode item={item} sizing={sizing} onSelect={handleNodeClick} />
                ) : (
                  <EmptySlotNode item={item} sizing={sizing} />
                )
              }
            />
          </ZoomableTreeViewport>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
            <span className="text-xs font-semibold text-gray-500">Ranks & Colors:</span>
            {Object.entries(rankColors).map(([rank, color]) => (
              <div
                key={rank}
                className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ background: color }}
                />
                <span className="text-xs font-medium text-gray-600">{rank}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
