import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Mail, Calendar, MailOpen } from 'lucide-react';

export const metadata = {
  title: 'Welcome Messages | Announcements',
};

export default async function WelcomeMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const welcomeMessages = await prisma.welcomeMessage.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Messages</h1>
        <p className="text-gray-500 mt-1">
          Important orientation and welcome messages from the GMA team.
        </p>
      </div>

      <div className="grid gap-6">
        {welcomeMessages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[350px] text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Mail size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Your inbox is empty</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              There are currently no active orientation or welcome messages.
            </p>
          </div>
        ) : (
          welcomeMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100/50">
                  <MailOpen size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-lg md:text-xl text-gray-900">{msg.subject}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <Calendar size={13} />
                    <span>
                      Sent on{' '}
                      {new Date(msg.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap border-t border-gray-50 pt-4">
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
