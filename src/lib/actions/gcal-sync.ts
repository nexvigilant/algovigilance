'use server';

/**
 * Google Calendar Two-Way Sync
 *
 * OAuth2 user consent flow + event push/pull for Circle organizations.
 *
 * Env vars required:
 *   GCAL_CLIENT_ID — Google OAuth2 client ID
 *   GCAL_CLIENT_SECRET — Google OAuth2 client secret
 *   NEXT_PUBLIC_APP_URL — Base URL for redirect (e.g. https://algovigilance.com)
 *
 * Firestore collections:
 *   circles/{circleId}/gcal_tokens/{userId} — OAuth2 refresh tokens
 *   circles/{circleId}/gcal_sync_map/{localId} — local↔gcal event ID mapping
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import type {
  GCalConnection, GCalSyncResult,
  OrgEvent, CalendarEntry,
} from '@/lib/api/circles-org-types';

import { logger } from '@/lib/logger';
const log = logger.scope('gcal-sync');

// ── OAuth2 Setup ──────────────────────────────

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GCAL_CLIENT_ID;
  const clientSecret = process.env.GCAL_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';

  if (!clientId || !clientSecret) {
    throw new Error('GCAL_CLIENT_ID and GCAL_CLIENT_SECRET must be set');
  }

  return new OAuth2Client(clientId, clientSecret, `${baseUrl}/api/circles-org/gcal/callback`);
}

async function getAuthUser() {
  const session = (await cookies()).get('session')?.value;
  if (!session) throw new Error('Not authenticated');
  return adminAuth.verifySessionCookie(session, true);
}

function circleRef(circleId: string) {
  return adminDb.collection('circles').doc(circleId);
}

function now() {
  return new Date().toISOString();
}

// ── Token Storage ─────────────────────────────

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  google_email: string;
}

async function getStoredTokens(circleId: string, userId: string): Promise<StoredTokens | null> {
  const snap = await circleRef(circleId).collection('gcal_tokens').doc(userId).get();
  return snap.exists ? (snap.data() as StoredTokens) : null;
}

async function storeTokens(circleId: string, userId: string, tokens: StoredTokens) {
  await circleRef(circleId).collection('gcal_tokens').doc(userId).set(tokens);
}

async function deleteTokens(circleId: string, userId: string) {
  await circleRef(circleId).collection('gcal_tokens').doc(userId).delete();
}

async function getAuthedClient(circleId: string, userId: string): Promise<OAuth2Client | null> {
  const tokens = await getStoredTokens(circleId, userId);
  if (!tokens) return null;

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Auto-refresh if expired
  if (tokens.expiry_date < Date.now()) {
    try {
      const { credentials } = await client.refreshAccessToken();
      await storeTokens(circleId, userId, {
        access_token: credentials.access_token ?? tokens.access_token,
        refresh_token: credentials.refresh_token ?? tokens.refresh_token,
        expiry_date: credentials.expiry_date ?? Date.now() + 3600000,
        google_email: tokens.google_email,
      });
      client.setCredentials(credentials);
    } catch (err) {
      log.error('Token refresh failed:', err);
      return null;
    }
  }

  return client;
}

// ── Sync Map (local ID ↔ GCal event ID) ──────

async function getSyncMap(circleId: string, localId: string): Promise<string | null> {
  const snap = await circleRef(circleId).collection('gcal_sync_map').doc(localId).get();
  return snap.exists ? (snap.data() as { gcal_event_id: string }).gcal_event_id : null;
}

async function setSyncMap(circleId: string, localId: string, gcalEventId: string) {
  await circleRef(circleId).collection('gcal_sync_map').doc(localId).set({
    gcal_event_id: gcalEventId,
    synced_at: now(),
  });
}

// ── Public Actions ────────────────────────────

/**
 * Generate the OAuth2 consent URL for connecting Google Calendar
 */
export async function getGCalAuthUrl(circleId: string): Promise<string> {
  await getAuthUser();
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: circleId, // Pass circleId through OAuth state
  });
}

/**
 * Exchange auth code for tokens after OAuth callback
 */
export async function exchangeGCalCode(circleId: string, code: string): Promise<GCalConnection> {
  const user = await getAuthUser();
  const client = getOAuth2Client();

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user's Google email
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email ?? 'unknown';

  // Store tokens
  await storeTokens(circleId, user.uid, {
    access_token: tokens.access_token ?? '',
    refresh_token: tokens.refresh_token ?? '',
    expiry_date: tokens.expiry_date ?? Date.now() + 3600000,
    google_email: email,
  });

  // Update connection status
  const connection: GCalConnection = {
    user_id: user.uid,
    circle_id: circleId,
    status: 'connected',
    google_email: email,
    calendar_id: 'primary',
    last_sync_at: null,
    sync_errors: [],
    connected_at: now(),
  };
  await circleRef(circleId).collection('gcal_connections').doc(user.uid).set(connection);

  return connection;
}

/**
 * Get current GCal connection status
 */
export async function getGCalConnection(circleId: string, userId: string): Promise<GCalConnection> {
  const snap = await circleRef(circleId).collection('gcal_connections').doc(userId).get();
  if (snap.exists) return snap.data() as GCalConnection;
  return {
    user_id: userId,
    circle_id: circleId,
    status: 'disconnected',
    google_email: null,
    calendar_id: null,
    last_sync_at: null,
    sync_errors: [],
    connected_at: null,
  };
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGCal(circleId: string): Promise<GCalConnection> {
  const user = await getAuthUser();

  // Revoke token if possible
  const client = await getAuthedClient(circleId, user.uid);
  if (client) {
    try {
      const creds = client.credentials;
      if (creds.access_token) {
        await client.revokeToken(creds.access_token);
      }
    } catch {
      // Revocation failure is non-critical
    }
  }

  await deleteTokens(circleId, user.uid);

  const connection: GCalConnection = {
    user_id: user.uid,
    circle_id: circleId,
    status: 'disconnected',
    google_email: null,
    calendar_id: null,
    last_sync_at: null,
    sync_errors: [],
    connected_at: null,
  };
  await circleRef(circleId).collection('gcal_connections').doc(user.uid).set(connection);
  return connection;
}

/**
 * Two-way sync: push local events to GCal, pull GCal events to local
 */
export async function syncGCal(circleId: string): Promise<GCalSyncResult> {
  const user = await getAuthUser();
  const client = await getAuthedClient(circleId, user.uid);
  if (!client) throw new Error('Not connected to Google Calendar');

  const calendar = google.calendar({ version: 'v3', auth: client });
  const result: GCalSyncResult = { pushed: 0, pulled: 0, errors: [], last_sync_at: now() };

  // Update status to syncing
  await circleRef(circleId).collection('gcal_connections').doc(user.uid).update({
    status: 'syncing',
  });

  try {
    // ── PUSH: Local events → GCal ──────────────

    const eventsSnap = await circleRef(circleId).collection('org_events')
      .where('status', 'in', ['scheduled', 'in_progress']).get();
    const calSnap = await circleRef(circleId).collection('org_calendar').get();

    const localEvents = eventsSnap.docs.map((d) => d.data() as OrgEvent);
    const calEntries = calSnap.docs.map((d) => d.data() as CalendarEntry);

    // Push org events
    for (const event of localEvents) {
      try {
        const existingGCalId = await getSyncMap(circleId, event.id);
        const gcalEvent = {
          summary: event.name,
          description: `${event.value_proposition ? `Why attend: ${event.value_proposition}\n\n` : ''}${event.description}`,
          location: event.location ?? undefined,
          start: {
            dateTime: event.start_time,
            timeZone: 'America/Chicago',
          },
          end: {
            dateTime: event.end_time ?? new Date(new Date(event.start_time).getTime() + 3600000).toISOString(),
            timeZone: 'America/Chicago',
          },
        };

        if (existingGCalId) {
          // Update existing
          await calendar.events.update({
            calendarId: 'primary',
            eventId: existingGCalId,
            requestBody: gcalEvent,
          });
        } else {
          // Create new
          const created = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: gcalEvent,
          });
          if (created.data.id) {
            await setSyncMap(circleId, event.id, created.data.id);
          }
        }
        result.pushed++;
      } catch (err) {
        result.errors.push(`Push event ${event.name}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    // Push calendar entries (tasks, meetings)
    for (const entry of calEntries) {
      try {
        const existingGCalId = await getSyncMap(circleId, entry.id);
        if (existingGCalId) continue; // Already synced, skip (events take priority)

        const gcalEvent = {
          summary: `[${entry.entry_type}] ${entry.title}`,
          description: entry.description,
          location: entry.location ?? undefined,
          start: entry.all_day
            ? { date: entry.start_time.slice(0, 10) }
            : { dateTime: entry.start_time, timeZone: 'America/Chicago' },
          end: entry.all_day
            ? { date: (entry.end_time ?? entry.start_time).slice(0, 10) }
            : { dateTime: entry.end_time ?? new Date(new Date(entry.start_time).getTime() + 3600000).toISOString(), timeZone: 'America/Chicago' },
        };

        const created = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: gcalEvent,
        });
        if (created.data.id) {
          await setSyncMap(circleId, entry.id, created.data.id);
        }
        result.pushed++;
      } catch (err) {
        result.errors.push(`Push calendar ${entry.title}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    // ── PULL: GCal events → Local calendar ─────

    const lastSync = (await circleRef(circleId).collection('gcal_connections').doc(user.uid).get())
      .data()?.last_sync_at as string | undefined;

    const listParams: { calendarId: string; maxResults: number; singleEvents: boolean; orderBy: string; timeMin?: string } = {
      calendarId: 'primary',
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    };
    // Only pull future events, or events modified since last sync
    if (lastSync) {
      listParams.timeMin = lastSync;
    } else {
      listParams.timeMin = new Date().toISOString();
    }

    const gcalEvents = await calendar.events.list(listParams);

    // Build reverse sync map: gcal_event_id → local_id
    const syncMapSnap = await circleRef(circleId).collection('gcal_sync_map').get();
    const reverseMap = new Map<string, string>();
    syncMapSnap.docs.forEach((d) => {
      const data = d.data() as { gcal_event_id: string };
      reverseMap.set(data.gcal_event_id, d.id);
    });

    for (const gcalEvent of gcalEvents.data.items ?? []) {
      if (!gcalEvent.id || !gcalEvent.summary) continue;
      // Skip events we pushed (already in sync map)
      if (reverseMap.has(gcalEvent.id)) continue;

      try {
        const startTime = gcalEvent.start?.dateTime ?? gcalEvent.start?.date ?? '';
        const endTime = gcalEvent.end?.dateTime ?? gcalEvent.end?.date ?? null;

        const ref = circleRef(circleId).collection('org_calendar').doc();
        const entry: CalendarEntry = {
          id: ref.id,
          circle_id: circleId,
          entry_type: 'event',
          title: gcalEvent.summary,
          description: gcalEvent.description ?? '',
          start_time: startTime,
          end_time: endTime,
          all_day: Boolean(gcalEvent.start?.date),
          location: gcalEvent.location ?? null,
          visible_to_roles: [],
          source_task_id: null,
          source_event_id: null,
          recurrence: null,
          created_by: user.uid,
          created_at: now(),
        };
        await ref.set(entry);
        await setSyncMap(circleId, ref.id, gcalEvent.id);
        result.pulled++;
      } catch (err) {
        result.errors.push(`Pull ${gcalEvent.summary}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    // Update connection status
    await circleRef(circleId).collection('gcal_connections').doc(user.uid).update({
      status: 'connected',
      last_sync_at: result.last_sync_at,
      sync_errors: result.errors.slice(0, 10),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    result.errors.push(msg);
    await circleRef(circleId).collection('gcal_connections').doc(user.uid).update({
      status: 'error',
      sync_errors: [msg],
    });
  }

  return result;
}
