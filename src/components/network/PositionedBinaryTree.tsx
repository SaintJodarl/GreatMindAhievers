'use client';

import React from 'react';

export type BinaryTreeSide = 'LEFT' | 'RIGHT';

export interface PositionedBinaryTreeNode<T> {
  key: string;
  data: T;
  side?: BinaryTreeSide;
  left?: PositionedBinaryTreeNode<T>;
  right?: PositionedBinaryTreeNode<T>;
}

export interface PositionedBinaryTreeItem<T> {
  key: string;
  data: T;
  side?: BinaryTreeSide;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PositionedBinaryTreeProps<T> {
  root: PositionedBinaryTreeNode<T>;
  nodeWidth: number;
  nodeHeight: number;
  leafGap: number;
  levelGap: number;
  connectorColor: string;
  connectorStrokeWidth?: number;
  className?: string;
  renderNode: (item: PositionedBinaryTreeItem<T>) => React.ReactNode;
}

interface Edge<T> {
  from: PositionedBinaryTreeItem<T>;
  to: PositionedBinaryTreeItem<T>;
}

interface Layout<T> {
  width: number;
  height: number;
  items: PositionedBinaryTreeItem<T>[];
  edges: Edge<T>[];
}

function buildLayout<T>(
  root: PositionedBinaryTreeNode<T>,
  nodeWidth: number,
  nodeHeight: number,
  leafGap: number,
  levelGap: number
): Layout<T> {
  const leafStep = nodeWidth + leafGap;
  const items: PositionedBinaryTreeItem<T>[] = [];
  const edges: Edge<T>[] = [];
  let leafIndex = 0;

  const walk = (node: PositionedBinaryTreeNode<T>, depth: number): PositionedBinaryTreeItem<T> => {
    const children = [node.left, node.right].filter((child): child is PositionedBinaryTreeNode<T> =>
      Boolean(child)
    );
    const childItems = children.map((child) => walk(child, depth + 1));
    const x =
      childItems.length > 0
        ? (childItems[0].x + childItems[childItems.length - 1].x) / 2
        : leafIndex++ * leafStep;
    const item: PositionedBinaryTreeItem<T> = {
      key: node.key,
      data: node.data,
      side: node.side,
      depth,
      x,
      y: depth * (nodeHeight + levelGap),
      width: nodeWidth,
      height: nodeHeight,
    };

    items.push(item);
    childItems.forEach((childItem) => {
      edges.push({ from: item, to: childItem });
    });

    return item;
  };

  walk(root, 0);

  const minX = Math.min(...items.map((item) => item.x - nodeWidth / 2));
  const maxX = Math.max(...items.map((item) => item.x + nodeWidth / 2));
  const maxY = Math.max(...items.map((item) => item.y + nodeHeight));
  const shiftX = minX < 0 ? -minX : 0;

  items.forEach((item) => {
    item.x += shiftX;
  });

  return {
    width: Math.ceil(maxX - minX),
    height: Math.ceil(maxY),
    items,
    edges,
  };
}

export default function PositionedBinaryTree<T>({
  root,
  nodeWidth,
  nodeHeight,
  leafGap,
  levelGap,
  connectorColor,
  connectorStrokeWidth = 2,
  className = '',
  renderNode,
}: PositionedBinaryTreeProps<T>) {
  const layout = React.useMemo(
    () => buildLayout(root, nodeWidth, nodeHeight, leafGap, levelGap),
    [root, nodeWidth, nodeHeight, leafGap, levelGap]
  );
  const connectorRadius = Math.max(8, Math.round(levelGap * 0.28));

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: layout.width,
        height: layout.height,
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden="true"
      >
        {layout.edges.map((edge) => {
          const startX = edge.from.x;
          const startY = edge.from.y + edge.from.height;
          const endX = edge.to.x;
          const endY = edge.to.y;
          const midY = startY + Math.max(10, (endY - startY) / 2);

          return (
            <path
              key={`${edge.from.key}-${edge.to.key}`}
              d={`M ${startX} ${startY} V ${midY - connectorRadius} Q ${startX} ${midY} ${
                startX + Math.sign(endX - startX) * connectorRadius
              } ${midY} H ${endX - Math.sign(endX - startX) * connectorRadius} Q ${endX} ${midY} ${endX} ${
                midY + connectorRadius
              } V ${endY}`}
              fill="none"
              stroke={connectorColor}
              strokeLinecap="round"
              strokeWidth={connectorStrokeWidth}
            />
          );
        })}
      </svg>

      {layout.items.map((item) => (
        <div
          key={item.key}
          className="absolute"
          style={{
            left: item.x - item.width / 2,
            top: item.y,
            width: item.width,
            height: item.height,
          }}
        >
          {renderNode(item)}
        </div>
      ))}
    </div>
  );
}
