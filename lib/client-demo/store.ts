import path from 'path';
import fs from 'fs';
import type { ClientDemo } from './types';

let cache: ClientDemo[] | null = null;

function loadDemos(): ClientDemo[] {
  // In development, bust the cache on each request so edits to the JSON are picked up immediately
  if (process.env.NODE_ENV === 'production' && cache !== null) return cache;

  const filePath = path.join(process.cwd(), 'data', 'client-demos.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cache = JSON.parse(raw) as ClientDemo[];
  return cache;
}

export function getDemoBySlug(slug: string): ClientDemo | null {
  return loadDemos().find((d) => d.slug === slug && d.active) ?? null;
}

export function getAllActiveDemos(): ClientDemo[] {
  return loadDemos().filter((d) => d.active);
}
