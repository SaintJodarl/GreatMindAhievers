import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { UserCheck, Mail, Calendar, Award, Shield, User as UserIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sponsor Info | My Network',
};

function determineRank(leftVolume: number, rightVolume: number): string {
  const totalVolume = leftVolume + rightVolume;
  if (totalVolume >= 100000) return 'Diamond';
  if (totalVolume >= 40000) return 'Gold';
  if (totalVolume >= 15000) return 'Silver';
  if (totalVolume >= 5000) return 'Bronze';
  return 'Entry';
}

export default async function SponsorInfoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/sign-up-login-screen');
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sponsor: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          binaryTree: {
            select: {
              leftVolume: true,
              rightVolume: true,
            },
          },
        },
      },
    },
  });

  const sponsor = user?.sponsor;

  // Compute rank if sponsor exists
  let rank = 'Entry';
  if (sponsor?.binaryTree) {
    rank = determineRank(sponsor.binaryTree.leftVolume || 0, sponsor.binaryTree.rightVolume || 0);
  }

  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-250">
          Active
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-250">
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-250">
        {statusStr}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sponsor Information</h1>
        <p className="text-gray-500 mt-1">
          Details about the member who referred you to Great Mind Achievers.
        </p>
      </div>

      {!sponsor ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[300px] max-w-2xl">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <UserIcon size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Sponsor Found</h2>
          <p className="text-gray-500 text-center text-sm max-w-md">
            You do not have a sponsor assigned. This usually happens if you are a system
            administrator or registered directly at the root level of the network.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl relative overflow-hidden">
          {/* Decorative Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-16 -mt-16" />

          <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
            <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <UserCheck size={36} />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {sponsor.name || 'System Sponsor'}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Sponsor ID: {sponsor.id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Email Address
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {sponsor.email || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Award size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Network Rank
                    </span>
                    <span className="text-sm font-semibold text-indigo-600">{rank}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Account Status
                    </span>
                    <span className="text-sm mt-0.5">{getStatusBadge(sponsor.status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Registration Date
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {new Date(sponsor.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
