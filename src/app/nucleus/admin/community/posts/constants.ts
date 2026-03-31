import type { PostFilters } from '@/lib/actions/community-posts';

export const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'academy', label: 'Academy' },
  { value: 'careers', label: 'Careers' },
  { value: 'sentinel', label: 'Sentinel' },
  { value: 'projects', label: 'Projects' },
];

export const POST_STATUS_VALUES = ['all', 'visible', 'hidden', 'pinned', 'locked'] as const;
export const POST_SORT_VALUES = ['recent', 'popular', 'replies'] as const;

export type PostStatusFilter = NonNullable<PostFilters['status']>;
export type PostSortFilter = Extract<NonNullable<PostFilters['sortBy']>, 'recent' | 'popular' | 'replies'>;

export function isPostStatusFilter(value: string): value is PostStatusFilter {
  return (POST_STATUS_VALUES as readonly string[]).includes(value);
}

export function isPostSortFilter(value: string): value is PostSortFilter {
  return (POST_SORT_VALUES as readonly string[]).includes(value);
}
