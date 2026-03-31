import { createMetadata } from '@/lib/metadata';
import { CreateForumForm } from './create-forum-form';

export const metadata = createMetadata({
  title: 'Create Forum',
  description: 'Create a new community forum with AI-powered suggestions',
  path: '/nucleus/community/circles/create',
});

export default function CreateForumPage() {
  return <CreateForumForm />;
}
