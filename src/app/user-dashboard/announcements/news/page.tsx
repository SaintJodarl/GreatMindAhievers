import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';


import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Megaphone, Calendar, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Company News | Announcements',
};

export default async function CompanyNewsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/sign-up-login-screen');
  }

  const newsItems = await prisma.content.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Company News</h1>
        <p className="text-gray-500 mt-1">Stay updated with the latest news from GMA Network.</p>
      </div>

      <div className="grid gap-6">
        {newsItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Megaphone size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No news updates</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              There are currently no published company announcements or news updates. Please check
              back later.
            </p>
          </div>
        ) : (
          newsItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-100/50">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-lg md:text-xl text-gray-900">{item.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <Calendar size={13} />
                    <span>
                      Posted on{' '}
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'long',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap border-t border-gray-50 pt-4">
                {item.body}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
