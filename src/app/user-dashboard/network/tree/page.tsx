'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
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
          className={`group relative w-[clamp(6.75rem,24vw,8.5rem)] cursor-pointer rounded-lg px-2.5 py-2 text-center shadow-sm transition-all duration-200 hover:scale-[1.02] ${
            isRoot
              ? 'bg-indigo-50/95 border-2 border-indigo-500/50 shadow-indigo-100/50'
              : 'bg-white border border-gray-200 hover:border-indigo-400'
          }`}
        >
          <div
            className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-inner"
            style={{ background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}88 100%)` }}
          >
            {initials}
          </div>
          <p
            className="max-w-[7rem] truncate text-xs font-bold leading-tight text-gray-900"
            title={node.name}
          >
            {node.name}
          </p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{node.id}</p>

          <div className="mt-1.5 flex flex-col items-center gap-1">
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

          <div className="mt-1.5 flex items-center justify-center gap-1">
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

          <p className="mt-1 truncate text-[9px] text-gray-400">Joined: {node.joinDate}</p>

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
          className="group flex w-[clamp(6.75rem,24vw,8.5rem)] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-2.5 py-3 text-center transition-all duration-150 hover:border-indigo-400 hover:bg-indigo-50/30"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-indigo-100">
            <UserPlus size={16} className="text-gray-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-xs font-semibold text-gray-600 group-hover:text-indigo-700">
            Open Slot
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Position: {position}</p>
          <span className="mt-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-600 shadow-sm transition-all group-hover:border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white">
            Invite Member
          </span>
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Binary Network Tree
          </h1>
          <p className="text-gray-500 mt-1">
            Visualize and traverse your downline network placement up to 3 levels deep.
          </p>
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

      {!loading && !error && treeData && (
        <div className="max-w-full overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
          {/* Header Info */}
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

          {/* Tree Diagram Area */}
          <div className="overflow-x-auto overscroll-x-contain pb-2">
            <div className="flex min-w-[560px] flex-col items-center py-3 sm:min-w-[640px] lg:min-w-[700px]">
              {/* Level 1: Root */}
              <div className="relative z-10">
                <TreeNodeCard node={treeData} isRoot />
              </div>

              {/* Level 1 to 2 Connectors */}
              {(treeData.leftChild !== undefined || treeData.rightChild !== undefined) && (
                <div className="relative mt-1 h-8 w-full max-w-[440px]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                  <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-200" />
                  <div className="absolute top-4 left-1/4 w-0.5 h-4 bg-gray-200" />
                  <div className="absolute top-4 right-1/4 w-0.5 h-4 bg-gray-200" />
                </div>
              )}

              {/* Level 2: Children */}
              <div className="relative mt-1 flex w-full max-w-[880px] justify-between px-2">
                {/* Left Wing */}
                <div className="w-1/2 flex flex-col items-center">
                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 mb-2">
                    LEFT LEG
                  </div>
                  {treeData.leftChild ? (
                    <>
                      <TreeNodeCard node={treeData.leftChild} />

                      {/* Level 2 to 3 Connectors (Left Child to Grandchildren) */}
                      <div className="relative mt-1 h-8 w-full max-w-[220px]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                        <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-200" />
                        <div className="absolute top-4 left-1/4 w-0.5 h-4 bg-gray-200" />
                        <div className="absolute top-4 right-1/4 w-0.5 h-4 bg-gray-200" />
                      </div>

                      {/* Level 3: Left Grandchildren */}
                      <div className="mt-1 flex w-full justify-around gap-2">
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
                      <div className="relative mt-1 h-8 w-full max-w-[220px]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                        <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-200" />
                        <div className="absolute top-4 left-1/4 w-0.5 h-4 bg-gray-200" />
                        <div className="absolute top-4 right-1/4 w-0.5 h-4 bg-gray-200" />
                      </div>

                      {/* Level 3: Right Grandchildren */}
                      <div className="mt-1 flex w-full justify-around gap-2">
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
          </div>

          {/* Ranks and Information Legend */}
          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
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

            <div className="hidden">
              💡 <span className="font-medium text-gray-600">Tip:</span> Click on any member node to
              load that member as the root of the tree view.
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="font-medium text-gray-600">Tip:</span> Click on any member node to
              load that member as the root of the tree view.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
