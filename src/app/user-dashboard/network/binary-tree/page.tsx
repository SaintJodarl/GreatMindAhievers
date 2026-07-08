'use client';

import React, { useEffect, useState } from 'react';

interface TreeNode {
  userId: string | null;
  username: string | null;
  isPlaceholder: boolean;
  stage: string | null;
  left?: TreeNode;
  right?: TreeNode;
}

const TreeCard: React.FC<{ node?: TreeNode }> = ({ node }) => {
  if (!node || node.isPlaceholder) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg w-32 h-32 bg-gray-50 opacity-60">
        <div className="text-3xl">👤</div>
        <div className="text-xs text-gray-400 mt-2">Empty Slot</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg shadow-sm w-32 h-32 bg-white relative">
      <div className="text-3xl mb-1">👤</div>
      <div className="text-sm font-semibold truncate w-full text-center">{node.username}</div>
      <div className="text-xs text-indigo-600 font-medium truncate w-full text-center">
        {node.stage}
      </div>
    </div>
  );
};

const TreeBranch: React.FC<{ node?: TreeNode }> = ({ node }) => {
  if (!node) return null;

  return (
    <div className="flex flex-col items-center">
      <TreeCard node={node} />
      {(node.left || node.right) && (
        <div className="flex flex-col items-center mt-4">
          <div className="w-px h-6 bg-gray-300"></div>
          <div className="flex items-start justify-center relative">
            <div className="absolute top-0 w-1/2 h-px bg-gray-300 left-1/4"></div>
            <div className="mx-4">
              <TreeBranch node={node.left} />
            </div>
            <div className="mx-4">
              <TreeBranch node={node.right} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Qualification Tree (First 14)</h1>

      {loading ? (
        <p>Loading tree...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : tree ? (
        <div className="overflow-x-auto py-8">
          <div className="min-w-max flex justify-center">
            <TreeBranch node={tree} />
          </div>
        </div>
      ) : (
        <p>No tree data available.</p>
      )}
    </div>
  );
}
