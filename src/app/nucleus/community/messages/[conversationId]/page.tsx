import { createMetadata } from '@/lib/metadata';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ConversationsList } from '../../components/messaging/conversations-list';
import { MessageThread } from '../../components/messaging/message-thread';
import type { Conversation } from '../../actions/messaging';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

import { logger } from '@/lib/logger';
const log = logger.scope('[conversationId]/page');

interface Props {
  params: Promise<{ conversationId: string }>;
}

export const metadata = createMetadata({
  title: 'Conversation',
  description: 'Direct message conversation',
  path: '/nucleus/community/messages',
});

async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch {
    return null;
  }
}

async function getConversationWithValidation(
  conversationId: string,
  userId: string
): Promise<Conversation | null> {
  try {
    const conversationDoc = await adminDb
      .collection('conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return null;
    }

    const data = conversationDoc.data();
    if (!data) return null;

    // Validate user is a participant
    if (!data.participantIds?.includes(userId)) {
      log.warn('User attempted to access conversation they are not a participant in', {
        userId,
        conversationId,
      });
      return null;
    }

    return {
      id: conversationDoc.id,
      ...data,
      unreadCount: 0, // Will be calculated in component
    } as Conversation;
  } catch (error) {
    log.error('Error fetching conversation:', error);
    return null;
  }
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;

  // Validate user authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/auth/signin?redirect=/nucleus/community/messages');
  }

  // Fetch conversation with participant validation
  const conversation = await getConversationWithValidation(conversationId, user.uid);

  if (!conversation) {
    notFound();
  }

  return (
    <div className="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)] min-h-[600px]">
        {/* Conversations List (hidden on mobile) */}
        <div className="hidden lg:block">
          <ConversationsList />
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <MessageThread
            conversationId={conversationId}
            conversation={conversation}
          />
        </div>
      </div>
    </div>
  );
}
