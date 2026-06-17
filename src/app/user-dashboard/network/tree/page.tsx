'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, UserPlus, ShieldAlert } from 'lucide-react';

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

const rankColors: Record<string, string> = {
  Diamond: '#38BDF8',
  Gold: '#F59E0B',
  Silver: '#C0C0C0',
  Bronze: '#CD7F32',
  Entry: '#6B7280',
};

export default function BinaryTreePage() {
  const { data: session } = useSession();
  const loggedInUserId = (session?.user as any)?.id;

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

      const res = await fetch(url);
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
    if (session?.user) {
      fetchTree();
    }
  }, [session, fetchTree]);

  const handleNodeClick = (nodeId: string) => {
    setRootId(nodeId);
  };

  const handleReset = () => {
    setRootId(null);
  };

  // Helper component to render a node card
  const TreeNodeCard = ({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) => {
    const rankColor = rankColors[node.rank] || '#6B7280';
    const initials = node.name
      ? node.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '??';

    return (
      <div className="flex flex-col items-center">
        <div
          onClick={() => handleNodeClick(node.id)}
          className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 px-4 py-3 rounded-xl text-center min-w-[150px] shadow-sm ${
            isRoot
              ? 'bg-indigo-50/95 border-2 border-indigo-500/50 shadow-indigo-100/50'
              : 'bg-white border border-gray-200 hover:border-indigo-400'
          }`}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold text-white shadow-inner"
            style={{ background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}88 100%)` }}
          >
            {initials}
          </div>
          <p
            className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[140px]"
            title={node.name}
          >
            {node.name}
          </p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{node.id}</p>

          <div className="flex flex-col items-center gap-1 mt-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${rankColor}15`, color: rankColor }}
            >
              {node.rank}
            </span>
            <span className="text-[10px] font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {(node.volume || 0).toLocaleString()} PV
            </span>
          </div>

          <div className="mt-2 flex items-center justify-center gap-1">
            <span
              className={`text-[9px] px-1.5 py-0.5 font-medium rounded-full ${
                node.status === 'ACTIVE' || node.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : node.status === 'PENDING' || node.status === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {node.status}
            </span>
          </div>

          <p className="text-[9px] text-gray-400 mt-1.5">Joined: {node.joinDate}</p>

          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow">
            Set Root
          </div>
        </div>
      </div>
    );
  };

  const EmptySlotCard = ({
    parentId,
    position,
  }: {
    parentId: string;
    position: 'LEFT' | 'RIGHT';
  }) => {
    return (
      <div className="flex flex-col items-center">
        <Link
          href={`/user-dashboard/registration/new?position=${position}&placementId=${parentId}`}
          className="flex flex-col items-center justify-center px-4 py-6 rounded-xl text-center min-w-[150px] border border-dashed border-gray-300 bg-gray-50/50 hover:bg-indigo-50/30 hover:border-indigo-400 transition-all duration-150 group"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-2.5 transition-colors">
            <UserPlus size={16} className="text-gray-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-xs font-semibold text-gray-600 group-hover:text-indigo-700">
            Open Slot
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Position: {position}</p>
          <span className="mt-3 px-2.5 py-1 bg-white border border-gray-200 group-hover:border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white rounded-lg text-[10px] font-bold shadow-sm transition-all">
            Invite Member
          </span>
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Binary Network Tree</h1>
          <p className="text-gray-500 mt-1">
            Visualize and traverse your downline network placement up to 3 levels deep.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {rootId && rootId !== loggedInUserId && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-medium text-sm hover:bg-indigo-100 transition-colors shadow-sm"
            >
              <ArrowLeft size={16} />
              Back to My Tree
            </button>
          )}

          <button
            onClick={fetchTree}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm"
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

      {!loading && !error && treeData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-x-auto">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Current Tree Focus
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                {treeData.name} ({treeData.id})
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-gray-500">Left Vol (PV)</span>
                <p className="text-base font-bold text-indigo-600">
                  {(treeData.leftVolume || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <div className="text-right">
                <span className="text-xs text-gray-500">Right Vol (PV)</span>
                <p className="text-base font-bold text-indigo-600">
                  {(treeData.rightVolume || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <div className="text-right">
                <span className="text-xs text-gray-500">Total Volume</span>
                <p className="text-base font-bold text-gray-900">
                  {(treeData.volume || 0).toLocaleString()} PV
                </p>
              </div>
            </div>
          </div>

          {/* Tree Diagram Area */}
          <div className="min-w-[760px] py-4 flex flex-col items-center">
            {/* Level 1: Root */}
            <div className="relative z-10">
              <TreeNodeCard node={treeData} isRoot />
            </div>

            {/* Level 1 to 2 Connectors */}
            {(treeData.leftChild !== undefined || treeData.rightChild !== undefined) && (
              <div className="w-full max-w-[480px] h-8 relative mt-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-200" />
                <div className="absolute top-4 left-1/4 w-0.5 h-4 bg-gray-200" />
                <div className="absolute top-4 right-1/4 w-0.5 h-4 bg-gray-200" />
              </div>
            )}

            {/* Level 2: Children */}
            <div className="flex w-full max-w-[960px] justify-between relative mt-1 px-4">
              {/* Left Wing */}
              <div className="w-1/2 flex flex-col items-center">
                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 mb-2">
                  LEFT LEG
                </div>
                {treeData.leftChild ? (
                  <>
                    <TreeNodeCard node={treeData.leftChild} />

                    {/* Level 2 to 3 Connectors (Left Child to Grandchildren) */}
                    <div className="w-full max-w-[240px] h-8 relative mt-1">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                      <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-200" />
                      <div className="absolute top-4 left-1/4 w-0.5 h-4 bg-gray-200" />
                      <div className="absolute top-4 right-1/4 w-0.5 h-4 bg-gray-200" />
                    </div>

                    {/* Level 3: Left Grandchildren */}
                    <div className="flex w-full justify-around mt-1">
                      {treeData.leftChild.leftChild ? (
                        <TreeNodeCard node={treeData.leftChild.leftChild} />
                      ) : (
                        <EmptySlotCard parentId={treeData.leftChild.id} position="LEFT" />
                      )}
                      {treeData.leftChild.rightChild ? (
                        <TreeNodeCard node={treeData.leftChild.rightChild} />
                      ) : (
                        <EmptySlotCard parentId={treeData.leftChild.id} position="RIGHT" />
                      )}
                    </div>
                  </>
                ) : (
                  <EmptySlotCard parentId={treeData.id} position="LEFT" />
                )}
              </div>

              {/* Right Wing */}
              <div className="w-1/2 flex flex-col items-center">
                <div className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded px-1.5 mb-2">
                  RIGHT LEG
                </div>
                {treeData.rightChild ? (
                  <>
                    <TreeNodeCard node={treeData.rightChild} />

                    {/* Level 2 to 3 Connectors (Right Child to Grandchildren) */}
                    <div className="w-full max-w-[240px] h-8 relative mt-1">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                      <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-200" />
                      <div className="absolute top-4 left-1/4 w-0.5 h-4 bg-gray-200" />
                      <div className="absolute top-4 right-1/4 w-0.5 h-4 bg-gray-200" />
                    </div>

                    {/* Level 3: Right Grandchildren */}
                    <div className="flex w-full justify-around mt-1">
                      {treeData.rightChild.leftChild ? (
                        <TreeNodeCard node={treeData.rightChild.leftChild} />
                      ) : (
                        <EmptySlotCard parentId={treeData.rightChild.id} position="LEFT" />
                      )}
                      {treeData.rightChild.rightChild ? (
                        <TreeNodeCard node={treeData.rightChild.rightChild} />
                      ) : (
                        <EmptySlotCard parentId={treeData.rightChild.id} position="RIGHT" />
                      )}
                    </div>
                  </>
                ) : (
                  <EmptySlotCard parentId={treeData.id} position="RIGHT" />
                )}
              </div>
            </div>
          </div>

          {/* Ranks and Information Legend */}
          <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
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

            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
              💡 <span className="font-medium text-gray-600">Tip:</span> Click on any member node to
              load that member as the root of the tree view.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
