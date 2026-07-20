'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { User, UserPlus } from 'lucide-react';
import PositionedBinaryTree, {
  BinaryTreeSide,
  PositionedBinaryTreeItem,
  PositionedBinaryTreeNode,
} from '@/components/network/PositionedBinaryTree';
import ZoomableTreeViewport from '@/components/network/ZoomableTreeViewport';

interface TreeNode {
  userId: string | null;
  username: string | null;
  isPlaceholder: boolean;
  stage: string | null;
  left?: TreeNode;
  right?: TreeNode;
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
  cardPaddingX: number;
  cardPaddingY: number;
  connectorStroke: number;
}

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function getRenderedStats(node: TreeNode | undefined): { depth: number; leafSlots: number } {
  if (!node) return { depth: 0, leafSlots: 0 };

  if (!node.left && !node.right) {
    return { depth: 1, leafSlots: 1 };
  }

  const leftStats = getRenderedStats(node.left);
  const rightStats = getRenderedStats(node.right);

  return {
    depth: 1 + Math.max(leftStats.depth, rightStats.depth),
    leafSlots: Math.max(1, leftStats.leafSlots) + Math.max(1, rightStats.leafSlots),
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
    nodeWidth: Math.round(clampNumber(130 - pressure * 9, 80, 130)),
    nodeHeight: Math.round(clampNumber(118 - pressure * 7, 88, 118)),
    leafGap: Math.round(clampNumber(32 - pressure * 5, 10, 32)),
    levelGap: Math.round(clampNumber(50 - pressure * 6, 22, 50)),
    avatarSize: Math.round(clampNumber(34 - pressure * 2, 24, 34)),
    avatarFontSize: Math.round(clampNumber(11 - pressure * 0.35, 8, 11)),
    nameFontSize: Math.round(clampNumber(13 - pressure * 0.45, 9, 13)),
    metaFontSize: Math.round(clampNumber(11 - pressure * 0.35, 8, 11)),
    cardPaddingX: Math.round(clampNumber(10 - pressure * 0.8, 6, 10)),
    cardPaddingY: Math.round(clampNumber(10 - pressure * 0.8, 6, 10)),
    connectorStroke: clampNumber(2 - pressure * 0.12, 1.25, 2),
  };
}

function buildDiagramNode(
  node: TreeNode,
  path = 'root',
  side?: BinaryTreeSide
): PositionedBinaryTreeNode<TreeNode> {
  return {
    key: `${path}-${node.userId ?? 'empty'}`,
    side,
    data: node,
    left: node.left ? buildDiagramNode(node.left, `${path}-left`, 'LEFT') : undefined,
    right: node.right ? buildDiagramNode(node.right, `${path}-right`, 'RIGHT') : undefined,
  };
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

function QualificationNode({
  item,
  sizing,
}: {
  item: PositionedBinaryTreeItem<TreeNode>;
  sizing: TreeSizing;
}) {
  const node = item.data;

  return (
    <div className="flex h-full w-full flex-col items-center">
      <PlacementLabel side={item.side} />
      <div
        className={`flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border text-center shadow-sm ${
          node.isPlaceholder
            ? 'border-dashed border-gray-300 bg-gray-50/70 opacity-75'
            : item.depth === 0
              ? 'border-2 border-indigo-500/50 bg-indigo-50/95'
              : 'border-gray-200 bg-white'
        }`}
        style={{ padding: `${sizing.cardPaddingY}px ${sizing.cardPaddingX}px` }}
      >
        <div
          className={`mb-1 flex shrink-0 items-center justify-center rounded-full ${
            node.isPlaceholder ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white'
          }`}
          style={{
            width: sizing.avatarSize,
            height: sizing.avatarSize,
            fontSize: sizing.avatarFontSize,
          }}
        >
          {node.isPlaceholder ? (
            <UserPlus size={Math.max(14, sizing.avatarSize * 0.5)} />
          ) : (
            <User size={Math.max(14, sizing.avatarSize * 0.5)} />
          )}
        </div>
        <div
          className={`max-w-full truncate font-semibold ${
            node.isPlaceholder ? 'text-gray-400' : 'text-gray-900'
          }`}
          style={{ fontSize: sizing.nameFontSize }}
          title={node.username ?? 'Empty Slot'}
        >
          {node.username ?? 'Empty Slot'}
        </div>
        <div
          className={`mt-0.5 max-w-full truncate font-medium ${
            node.isPlaceholder ? 'text-gray-400' : 'text-indigo-600'
          }`}
          style={{ fontSize: sizing.metaFontSize }}
          title={node.stage ?? undefined}
        >
          {node.stage ?? 'Open placement'}
        </div>
      </div>
    </div>
  );
}

export default function BinaryTreePage() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/user/network/binary-tree')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tree');
        return res.json();
      })
      .then((data) => {
        setTree(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const sizing = useMemo(() => (tree ? getTreeSizing(tree) : null), [tree]);
  const diagramRoot = useMemo(() => (tree ? buildDiagramNode(tree) : null), [tree]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          My Qualification Tree
        </h1>
        <p className="mt-1 text-gray-500">Your binary placement structure for qualification.</p>
      </div>

      {loading ? (
        <div className="flex min-h-[24rem] items-center justify-center rounded-xl border border-gray-100 bg-white">
          <p className="text-sm font-medium text-gray-500">Loading tree...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : tree && sizing && diagramRoot ? (
        <div className="max-w-full overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
          <ZoomableTreeViewport
            ariaLabel="Qualification binary tree"
            variant="light"
            resetKey={`${tree.userId ?? 'root'}-${sizing.depth}-${sizing.leafSlots}`}
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
              renderNode={(item) => <QualificationNode item={item} sizing={sizing} />}
            />
          </ZoomableTreeViewport>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No tree data available.</p>
      )}
    </div>
  );
}
