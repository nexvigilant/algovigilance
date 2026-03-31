/**
 * Data access for notifications — Layer 3 extraction.
 *
 * Extracted from notification-bell.tsx to separate
 * Firestore queries (Layer 3) from UI components (Layer 6).
 */

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Notification } from "@/types/community";
import { logger } from "@/lib/logger";

const log = logger.scope("lib/data/notifications");

/**
 * Create a real-time listener for a user's notifications (latest 10, ordered by date).
 *
 * @param userId - The user ID to listen for
 * @param onUpdate - Callback receiving the latest notifications
 * @returns Unsubscribe function
 */
export function createNotificationsListener(
  userId: string,
  onUpdate: (notifications: Notification[]) => void,
): () => void {
  const notificationsRef = collection(db, `users/${userId}/notifications`);
  const notificationsQuery = query(
    notificationsRef,
    orderBy("createdAt", "desc"),
    limit(10),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifs: Notification[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      onUpdate(notifs);
    },
    (error) => {
      log.error("Notifications listener error", { userId, error });
    },
  );
}

/**
 * Create a real-time listener for a user's unread notification count.
 *
 * @param userId - The user ID to listen for
 * @param onUpdate - Callback receiving the unread count
 * @returns Unsubscribe function
 */
export function createUnreadNotificationsListener(
  userId: string,
  onUpdate: (count: number) => void,
): () => void {
  const notificationsRef = collection(db, `users/${userId}/notifications`);
  const unreadQuery = query(notificationsRef, where("read", "==", false));

  return onSnapshot(
    unreadQuery,
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (error) => {
      log.error("Unread notifications listener error", { userId, error });
    },
  );
}
