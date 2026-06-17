import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';


import { redirect } from 'next/navigation';
import { GraduationCap, PlayCircle, FileText, Download, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Training Resources | Announcements',
};

export default async function TrainingResourcesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/sign-up-login-screen');
  }

  const resources = [
    {
      title: 'GMA Compensation Plan',
      description:
        'A comprehensive slide deck outlining binary pairing cycles, direct bonuses, and leadership qualifications.',
      type: 'PDF Guide',
      icon: FileText,
      url: '/docs/compensation-plan.pdf',
      downloadable: true,
    },
    {
      title: 'Binary Placement Strategy',
      description:
        'Learn how to strategically place new members on your left or right leg to optimize points and cycle payouts.',
      type: 'Video Tutorial',
      icon: PlayCircle,
      url: 'https://www.youtube.com/watch?v=mock-binary',
      downloadable: false,
    },
    {
      title: 'MLM Leadership & Growth',
      description:
        'Master the skills of prospecting, recruiting, and mentoring downlines to grow a stable, self-sustaining tree network.',
      type: 'Webinar Slide',
      icon: GraduationCap,
      url: '/docs/leadership-training.pdf',
      downloadable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Training Resources</h1>
        <p className="text-gray-500 mt-1">
          Access guides, video walkthroughs, and slides to learn how to scale your binary network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-all duration-150"
          >
            <div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 border border-indigo-100/50">
                <resource.icon size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{resource.title}</h3>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                {resource.type}
              </span>
              <p className="text-gray-500 text-xs mt-3 leading-relaxed">{resource.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition duration-150"
              >
                {resource.downloadable ? (
                  <>
                    <Download size={14} />
                    Download File
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    Watch Training Video
                  </>
                )}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
