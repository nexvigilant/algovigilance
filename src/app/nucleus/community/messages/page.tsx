import { createMetadata } from '@/lib/metadata';
import { ConversationsList } from '../components/messaging/conversations-list';

export const metadata = createMetadata({
  title: 'Messages',
  description: 'Direct messages with community members',
  path: '/nucleus/community/messages',
});

export default function MessagesPage() {
  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-2 text-gold">
          Direct Messages
        </h1>
        <p className="text-slate-dim">
          Connect with community members privately
        </p>
      </div>

      <div className="h-[calc(100vh-300px)] min-h-[500px]">
        <ConversationsList />
      </div>
    </div>
  );
}
