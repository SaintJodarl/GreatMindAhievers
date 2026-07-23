import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

const appDirectory = join(process.cwd(), 'src', 'app');

const excludedRoutePrefixes = [
  '/activate',
  '/admin-dashboard',
  '/api',
  '/register',
  '/sign-up-login-screen',
  '/user-dashboard',
];

const routeConfig: Record<
  string,
  {
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }
> = {
  '/': {
    changeFrequency: 'weekly',
    priority: 1,
  },
};

function isPageFile(path: string) {
  return path.endsWith(`${sep}page.tsx`) || path.endsWith(`${sep}page.ts`);
}

function pageFileToRoute(filePath: string) {
  const relativePath = filePath.replace(appDirectory, '').replace(/\\/g, '/');
  const route = relativePath.replace(/\/page\.tsx?$/, '') || '/';

  return route === '' ? '/' : route;
}

function hasDynamicSegment(route: string) {
  return route.split('/').some((segment) => segment.startsWith('[') && segment.endsWith(']'));
}

function isPublicIndexableRoute(route: string) {
  if (hasDynamicSegment(route)) {
    return false;
  }

  return !excludedRoutePrefixes.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`)
  );
}

function collectPageFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectPageFiles(fullPath);
    }

    return isPageFile(fullPath) ? [fullPath] : [];
  });
}

function discoverPublicIndexableRoutes() {
  return collectPageFiles(appDirectory)
    .map(pageFileToRoute)
    .filter(isPublicIndexableRoute)
    .sort((a, b) => a.localeCompare(b));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return discoverPublicIndexableRoutes().map((route) => {
    const config = routeConfig[route] || {
      changeFrequency: 'monthly',
      priority: 0.7,
    };

    return {
      url: absoluteUrl(route),
      lastModified,
      changeFrequency: config.changeFrequency,
      priority: config.priority,
    };
  });
}
