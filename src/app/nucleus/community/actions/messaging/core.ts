"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { moderateMessageContent } from "@/app/nucleus/admin/academy/learners/moderation-actions";
import { withRateLimit } from "@/lib/rate-limit";
import { sendCommunityMessageNotification } from "@/lib/email";
import { serializeForClient } from "@/lib/serialization-utils";

import { getAuthenticatedUser } from "../utils/auth";
import {
  handleActionError,
  createSuccessResult,
  type ActionResult,
} from "../utils/errors";
import type { FlexibleTimestamp } from "@/types/community/timestamps";

import { logger } from "@/lib/logger";
const log = logger.scope("messaging/core");

/**
 * Message and Conversation Types
 * Uses FlexibleTimestamp for server-to-client boundary safety.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  contentHtml: string;
  createdAt: FlexibleTimestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: FlexibleTimestamp;
  };
  unreadCount: number;
  createdAt: FlexibleTimestamp;
  updatedAt: FlexibleTimestamp;
}

/**
 * Validation Schemas
 */
const SendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long"),
});

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(
  recipientId: string,
): Promise<ActionResult<string>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "You must be logged in" };
    }

    if (user.uid === recipientId) {
      return { success: false, error: "Cannot message yourself" };
    }

    // Check if conversation already exists
    const querySnapshot = await adminDb
      .collection("conversations")
      .where("participantIds", "array-contains", user.uid)
      .get();

    let existingConversation: string | null = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participantIds.includes(recipientId)) {
        existingConversation = doc.id;
      }
    });

    if (existingConversation) {
      return createSuccessResult(existingConversation);
    }

    // OPTIMIZATION: Parallelize user document fetches
    // Reduces O(T₁ + T₂) → O(max(T₁, T₂))
    const [recipientDoc, currentUserDoc] = await Promise.all([
      adminDb.collection("users").doc(recipientId).get(),
      adminDb.collection("users").doc(user.uid).get(),
    ]);

    if (!recipientDoc.exists) {
      return { success: false, error: "Recipient not found" };
    }

    const recipientData = recipientDoc.data();
    if (!recipientData)
      return { success: false, error: "Recipient data is empty" };
    const currentUserData = currentUserDoc.data();

    // Create new conversation
    const newConversationRef = await adminDb.collection("conversations").add({
      participantIds: [user.uid, recipientId],
      participants: [
        {
          id: user.uid,
          name:
            currentUserData?.name ||
            currentUserData?.displayName ||
            "Anonymous",
          avatar: currentUserData?.avatar || currentUserData?.photoURL || "",
        },
        {
          id: recipientId,
          name: recipientData.name || recipientData.displayName || "Anonymous",
          avatar: recipientData.avatar || recipientData.photoURL || "",
        },
      ],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return createSuccessResult(newConversationRef.id);
  } catch (error) {
    return handleActionError(error, "getOrCreateConversation");
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<ActionResult<string> & { moderationBlocked?: boolean }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "You must be logged in" };
    }

    // Check rate limit
    const rateLimitResult = await withRateLimit(user.uid, "messages");
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error:
          rateLimitResult.error ||
          "You are sending messages too frequently. Please wait before sending another.",
        rateLimited: true,
      };
    }

    // Validate input
    const validation = SendMessageSchema.safeParse({
      recipientId: "dummy", // Not used here, but required by schema
      content,
    });

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    // Verify conversation exists and user is a participant
    const conversationDoc = await adminDb
      .collection("conversations")
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return { success: false, error: "Conversation not found" };
    }

    const conversationData = conversationDoc.data();
    if (!conversationData)
      return { success: false, error: "Conversation data is empty" };
    if (!conversationData.participantIds.includes(user.uid)) {
      return {
        success: false,
        error: "You are not a participant in this conversation",
      };
    }

    // Get sender info
    const userDoc = await adminDb.collection("users").doc(user.uid).get();
    const userData = userDoc.data();

    // Sanitize content
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    // AI Content Moderation
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const moderationResult = await moderateMessageContent(
      messageId,
      sanitizedContent,
      user.uid,
    );

    // Block if auto-actioned (critical violation)
    if (
      moderationResult.autoActioned &&
      moderationResult.recommendedAction === "auto_remove"
    ) {
      return {
        success: false,
        error:
          "Your message could not be sent as it appears to violate our community guidelines.",
        moderationBlocked: true,
      };
    }

    // Create message
    const newMessageRef = await adminDb
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .add({
        conversationId,
        senderId: user.uid,
        senderName: userData?.name || userData?.displayName || "Anonymous",
        senderAvatar: userData?.avatar || userData?.photoURL || "",
        content: sanitizedContent,
        contentHtml: sanitizedContent.replace(/\n/g, "<br>"),
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      });

    // Get recipient ID
    const recipientId = conversationData.participantIds.find(
      (id: string) => id !== user.uid,
    );

    // Update conversation with last message and increment recipient's unread count
    await adminDb
      .collection("conversations")
      .doc(conversationId)
      .update({
        lastMessage: {
          content: sanitizedContent.substring(0, 100),
          senderId: user.uid,
          senderName: userData?.name || userData?.displayName || "Anonymous",
          createdAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        // Increment unread count for recipient (denormalized for N+1 optimization)
        [`unreadCounts.${recipientId}`]: FieldValue.increment(1),
      });

    // Create notification for recipient (in-app + email)
    if (recipientId) {
      // In-app notification
      await adminDb
        .collection("users")
        .doc(recipientId)
        .collection("notifications")
        .add({
          type: "message",
          title: "New Message",
          message: `${userData?.name || "Someone"} sent you a message`,
          actionUrl: `/nucleus/community/messages/${conversationId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });

      // Email notification
      const recipientDoc = await adminDb
        .collection("users")
        .doc(recipientId)
        .get();
      const recipientData = recipientDoc.data();
      const recipientEmail = recipientData?.email;
      const emailEnabled =
        recipientData?.preferences?.emailNotifications?.messages !== false; // Default to true

      if (recipientEmail && emailEnabled) {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "https://algovigilance.net";
        // Fire and forget - don't block on email sending
        sendCommunityMessageNotification({
          recipientEmail,
          recipientName:
            recipientData?.name || recipientData?.displayName || "there",
          senderName: userData?.name || userData?.displayName || "Someone",
          messagePreview: sanitizedContent,
          conversationUrl: `${baseUrl}/nucleus/community/messages/${conversationId}`,
        }).catch((emailError) => {
          log.error(`Error sending DM email to ${recipientId}:`, emailError);
        });
      }
    }

    return createSuccessResult(newMessageRef.id);
  } catch (error) {
    return handleActionError(error, "sendMessage");
  }
}

/**
 * Get all conversations for the current user
 * Optimized to avoid N+1 queries by using denormalized unread counts
 */
export async function getConversations(): Promise<
  ActionResult<Conversation[]>
> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const querySnapshot = await adminDb
      .collection("conversations")
      .where("participantIds", "array-contains", user.uid)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    // Map conversations - use denormalized unreadCounts from conversation doc
    // Serialize timestamps for server-to-client boundary safety
    const conversations: Conversation[] = querySnapshot.docs.map((convDoc) => {
      const data = convDoc.data();

      // Use per-user unread counts stored on conversation document
      // This avoids N+1 queries for unread counts
      const unreadCounts = data.unreadCounts || {};
      const unreadCount = unreadCounts[user.uid] || 0;

      return serializeForClient({
        id: convDoc.id,
        participantIds: data.participantIds,
        participants: data.participants,
        lastMessage: data.lastMessage,
        unreadCount,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }) as Conversation;
    });

    return createSuccessResult(conversations);
  } catch (error) {
    return handleActionError(error, "getConversations");
  }
}

/**
 * Get messages in a conversation
 */
export async function getMessages(
  conversationId: string,
): Promise<ActionResult<Message[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify user is a participant
    const conversationDoc = await adminDb
      .collection("conversations")
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return { success: false, error: "Conversation not found" };
    }

    const conversationData = conversationDoc.data();
    if (!conversationData)
      return { success: false, error: "Conversation data is empty" };
    if (!conversationData.participantIds.includes(user.uid)) {
      return { success: false, error: "Unauthorized access to conversation" };
    }

    // Get messages
    const querySnapshot = await adminDb
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(100)
      .get();

    // Serialize timestamps for server-to-client boundary safety
    const messages: Message[] = querySnapshot.docs.map(
      (doc) =>
        serializeForClient({
          id: doc.id,
          ...doc.data(),
        }) as Message,
    );

    return createSuccessResult(messages);
  } catch (error) {
    return handleActionError(error, "getMessages");
  }
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get all unread messages not sent by current user
    const unreadSnapshot = await adminDb
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .where("senderId", "!=", user.uid)
      .where("read", "==", false)
      .get();

    // Mark all as read
    const updatePromises = unreadSnapshot.docs.map((doc) =>
      doc.ref.update({ read: true }),
    );
    await Promise.all(updatePromises);

    // Reset denormalized unread count for current user
    await adminDb
      .collection("conversations")
      .doc(conversationId)
      .update({
        [`unreadCounts.${user.uid}`]: 0,
      });

    return createSuccessResult();
  } catch (error) {
    return handleActionError(error, "markConversationAsRead");
  }
}

/**
 * Get total unread message count across all conversations
 * Optimized to use denormalized unread counts (avoids N+1 queries)
 */
export async function getUnreadMessageCount(): Promise<ActionResult<number>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const querySnapshot = await adminDb
      .collection("conversations")
      .where("participantIds", "array-contains", user.uid)
      .get();

    // Sum up denormalized unread counts from all conversations
    let totalUnread = 0;
    querySnapshot.docs.forEach((convDoc) => {
      const data = convDoc.data();
      const unreadCounts = data.unreadCounts || {};
      totalUnread += unreadCounts[user.uid] || 0;
    });

    return createSuccessResult(totalUnread);
  } catch (error) {
    return handleActionError(error, "getUnreadMessageCount");
  }
}

/**
 * Delete a message — sender can delete their own messages.
 * Replaces content with "[deleted]" rather than removing the document,
 * to preserve conversation thread integrity.
 */
const DeleteMessageSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
});

export async function deleteMessage(
  input: z.infer<typeof DeleteMessageSchema>,
): Promise<ActionResult<void>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const parsed = DeleteMessageSchema.parse(input);

    const msgRef = adminDb
      .collection("conversations")
      .doc(parsed.conversationId)
      .collection("messages")
      .doc(parsed.messageId);

    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) {
      return { success: false, error: "Message not found" };
    }

    const msgData = msgSnap.data();
    if (msgData?.senderId !== user.uid) {
      return { success: false, error: "You can only delete your own messages" };
    }

    await msgRef.update({
      content: "[deleted]",
      contentHtml: "<p>[deleted]</p>",
      deletedAt: FieldValue.serverTimestamp(),
    });

    log.info("Message deleted", {
      conversationId: parsed.conversationId,
      messageId: parsed.messageId,
      userId: user.uid,
    });

    return createSuccessResult(undefined);
  } catch (error) {
    return handleActionError(error, "deleteMessage");
  }
}

/**
 * Edit a message — sender can edit within 15 minutes of creation.
 * Stores original content for audit trail.
 */
const EditMessageSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
  newContent: z.string().min(1).max(5000),
});

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function editMessage(
  input: z.infer<typeof EditMessageSchema>,
): Promise<ActionResult<void>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const parsed = EditMessageSchema.parse(input);

    const msgRef = adminDb
      .collection("conversations")
      .doc(parsed.conversationId)
      .collection("messages")
      .doc(parsed.messageId);

    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) {
      return { success: false, error: "Message not found" };
    }

    const msgData = msgSnap.data();
    if (msgData?.senderId !== user.uid) {
      return { success: false, error: "You can only edit your own messages" };
    }

    // Check edit window
    const createdAt =
      msgData.createdAt?.toDate?.() ?? new Date(msgData.createdAt);
    if (Date.now() - createdAt.getTime() > EDIT_WINDOW_MS) {
      return { success: false, error: "Edit window expired (15 minutes)" };
    }

    // Check if already deleted
    if (msgData.content === "[deleted]") {
      return { success: false, error: "Cannot edit a deleted message" };
    }

    const sanitized = DOMPurify.sanitize(parsed.newContent);

    // Moderate new content
    const editMsgId = `edit_${parsed.messageId}_${Date.now()}`;
    const moderation = await moderateMessageContent(
      editMsgId,
      sanitized,
      user.uid,
    );
    if (!moderation.approved) {
      return {
        success: false,
        error: "Edited content does not meet community guidelines",
      };
    }

    await msgRef.update({
      content: sanitized,
      contentHtml: DOMPurify.sanitize(sanitized),
      editedAt: FieldValue.serverTimestamp(),
      originalContent: msgData.content,
    });

    log.info("Message edited", {
      conversationId: parsed.conversationId,
      messageId: parsed.messageId,
      userId: user.uid,
    });

    return createSuccessResult(undefined);
  } catch (error) {
    return handleActionError(error, "editMessage");
  }
}
