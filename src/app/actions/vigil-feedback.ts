'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  VIGIL_ACTION_COSTS,
  VIGIL_ACTIVITY_DAILY_CAPS,
  VIGIL_ACTIVITY_REWARDS,
  VIGIL_DAILY_ALLOWANCE,
  VIGIL_DAILY_EARNING_CAP,
  type VigilActivityType,
  type VigilFeatureAction,
} from '@/lib/vigil-coins';

const log = logger.scope('actions/vigil-feedback');

interface WalletDoc {
  userId: string;
  userEmail: string;
  balance: number;
  dailyAllowance: number;
  lastDailyGrantDate: string;
  todayEarned: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  activityCounters: Partial<Record<VigilActivityType, number>>;
}

export interface VigilWalletSummary {
  balance: number;
  dailyAllowance: number;
  todayEarned: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastDailyGrantDate: string;
}

interface ContextualFeedbackInput {
  userId: string;
  userEmail?: string;
  featureId: string;
  featureLabel: string;
  currentPath: string;
  action: VigilFeatureAction;
  comment: string;
}

interface AwardCoinsInput {
  userId: string;
  userEmail?: string;
  activityType: VigilActivityType;
  source?: string;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function coerceWallet(userId: string, userEmail: string, data?: Partial<WalletDoc>): WalletDoc {
  return {
    userId,
    userEmail,
    balance: data?.balance ?? 0,
    dailyAllowance: data?.dailyAllowance ?? VIGIL_DAILY_ALLOWANCE,
    lastDailyGrantDate: data?.lastDailyGrantDate ?? '',
    todayEarned: data?.todayEarned ?? 0,
    lifetimeEarned: data?.lifetimeEarned ?? 0,
    lifetimeSpent: data?.lifetimeSpent ?? 0,
    activityCounters: data?.activityCounters ?? {},
  };
}

function applyDailyAllowance(wallet: WalletDoc, today: string): WalletDoc {
  if (wallet.lastDailyGrantDate === today) {
    return wallet;
  }

  const dailyAllowance = wallet.dailyAllowance || VIGIL_DAILY_ALLOWANCE;
  return {
    ...wallet,
    balance: wallet.balance + dailyAllowance,
    lastDailyGrantDate: today,
    todayEarned: 0,
    activityCounters: {},
    lifetimeEarned: wallet.lifetimeEarned + dailyAllowance,
  };
}

export async function getVigilWalletSummary(params: {
  userId: string;
  userEmail?: string;
}): Promise<{ success: boolean; wallet?: VigilWalletSummary; error?: string }> {
  try {
    const { userId, userEmail = 'unknown' } = params;
    const today = getTodayKey();
    const walletRef = adminDb.collection('vigil_coin_wallets').doc(userId);

    const snapshot = await walletRef.get();
    const raw = snapshot.exists ? (snapshot.data() as Partial<WalletDoc>) : undefined;
    const wallet = applyDailyAllowance(coerceWallet(userId, userEmail, raw), today);

    if (!snapshot.exists || wallet.lastDailyGrantDate !== raw?.lastDailyGrantDate) {
      await walletRef.set(
        {
          ...wallet,
          updatedAt: adminTimestamp.now(),
          createdAt: snapshot.exists ? (snapshot.data() as { createdAt?: unknown }).createdAt ?? adminTimestamp.now() : adminTimestamp.now(),
        },
        { merge: true }
      );
    }

    return {
      success: true,
      wallet: {
        balance: wallet.balance,
        dailyAllowance: wallet.dailyAllowance,
        todayEarned: wallet.todayEarned,
        lifetimeEarned: wallet.lifetimeEarned,
        lifetimeSpent: wallet.lifetimeSpent,
        lastDailyGrantDate: wallet.lastDailyGrantDate,
      },
    };
  } catch (error) {
    log.error('[VigilWallet] Failed to fetch wallet summary', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function awardVigilCoins(
  input: AwardCoinsInput
): Promise<{ success: boolean; awarded?: number; wallet?: VigilWalletSummary; error?: string }> {
  try {
    const { userId, userEmail = 'unknown', activityType, source = 'unknown' } = input;
    const reward = VIGIL_ACTIVITY_REWARDS[activityType] ?? 0;
    if (reward <= 0) {
      return { success: true, awarded: 0 };
    }

    const today = getTodayKey();
    const walletRef = adminDb.collection('vigil_coin_wallets').doc(userId);
    const ledgerRef = adminDb.collection('vigil_coin_ledger').doc();

    let awarded = 0;
    let walletSummary: VigilWalletSummary | undefined;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(walletRef);
      const base = coerceWallet(userId, userEmail, snap.exists ? (snap.data() as Partial<WalletDoc>) : undefined);
      const wallet = applyDailyAllowance(base, today);

      const earnedForType = wallet.activityCounters[activityType] ?? 0;
      const remainingGlobal = Math.max(0, VIGIL_DAILY_EARNING_CAP - wallet.todayEarned);
      const remainingType = Math.max(0, VIGIL_ACTIVITY_DAILY_CAPS[activityType] - earnedForType);
      awarded = Math.min(reward, remainingGlobal, remainingType);

      const nextWallet: WalletDoc =
        awarded > 0
          ? {
              ...wallet,
              balance: wallet.balance + awarded,
              todayEarned: wallet.todayEarned + awarded,
              lifetimeEarned: wallet.lifetimeEarned + awarded,
              activityCounters: {
                ...wallet.activityCounters,
                [activityType]: earnedForType + awarded,
              },
            }
          : wallet;

      tx.set(
        walletRef,
        {
          ...nextWallet,
          updatedAt: adminTimestamp.now(),
          createdAt: snap.exists ? (snap.data() as { createdAt?: unknown }).createdAt ?? adminTimestamp.now() : adminTimestamp.now(),
        },
        { merge: true }
      );

      if (awarded > 0) {
        tx.set(ledgerRef, {
          userId,
          userEmail,
          delta: awarded,
          category: 'earn',
          activityType,
          source,
          createdAt: adminTimestamp.now(),
          dateKey: today,
        });
      }

      walletSummary = {
        balance: nextWallet.balance,
        dailyAllowance: nextWallet.dailyAllowance,
        todayEarned: nextWallet.todayEarned,
        lifetimeEarned: nextWallet.lifetimeEarned,
        lifetimeSpent: nextWallet.lifetimeSpent,
        lastDailyGrantDate: nextWallet.lastDailyGrantDate,
      };
    });

    return { success: true, awarded, wallet: walletSummary };
  } catch (error) {
    log.error('[VigilWallet] Failed to award coins', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function submitContextualFeedbackVote(
  input: ContextualFeedbackInput
): Promise<{ success: boolean; wallet?: VigilWalletSummary; error?: string }> {
  try {
    const trimmedComment = input.comment.trim();
    if (!trimmedComment || trimmedComment.length > 100) {
      return { success: false, error: 'Comment must be 1-100 characters.' };
    }

    const cost = VIGIL_ACTION_COSTS[input.action];
    const today = getTodayKey();
    const walletRef = adminDb.collection('vigil_coin_wallets').doc(input.userId);
    const feedbackRef = adminDb.collection('feedback').doc();
    const ledgerRef = adminDb.collection('vigil_coin_ledger').doc();

    let walletSummary: VigilWalletSummary | undefined;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(walletRef);
      const base = coerceWallet(
        input.userId,
        input.userEmail || 'unknown',
        snap.exists ? (snap.data() as Partial<WalletDoc>) : undefined
      );
      const wallet = applyDailyAllowance(base, today);

      if (wallet.balance < cost) {
        throw new Error(`Not enough Vigil Coins. Need ${cost}, have ${wallet.balance}.`);
      }

      const nextWallet: WalletDoc = {
        ...wallet,
        balance: wallet.balance - cost,
        lifetimeSpent: wallet.lifetimeSpent + cost,
      };

      tx.set(
        walletRef,
        {
          ...nextWallet,
          updatedAt: adminTimestamp.now(),
          createdAt: snap.exists ? (snap.data() as { createdAt?: unknown }).createdAt ?? adminTimestamp.now() : adminTimestamp.now(),
        },
        { merge: true }
      );

      tx.set(feedbackRef, {
        type: 'contextual_feature_feedback',
        status: 'new',
        userId: input.userId,
        userEmail: input.userEmail || 'unknown',
        createdAt: adminTimestamp.now(),
        metadata: {
          currentPath: input.currentPath,
          submittedAt: new Date().toISOString(),
        },
        contextualFeedback: {
          featureId: input.featureId,
          featureLabel: input.featureLabel,
          action: input.action,
          comment: trimmedComment,
          cost,
        },
      });

      tx.set(ledgerRef, {
        userId: input.userId,
        userEmail: input.userEmail || 'unknown',
        delta: -cost,
        category: 'spend',
        spendType: input.action,
        featureId: input.featureId,
        featureLabel: input.featureLabel,
        createdAt: adminTimestamp.now(),
        dateKey: today,
      });

      walletSummary = {
        balance: nextWallet.balance,
        dailyAllowance: nextWallet.dailyAllowance,
        todayEarned: nextWallet.todayEarned,
        lifetimeEarned: nextWallet.lifetimeEarned,
        lifetimeSpent: nextWallet.lifetimeSpent,
        lastDailyGrantDate: nextWallet.lastDailyGrantDate,
      };
    });

    return { success: true, wallet: walletSummary };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('[VigilFeedback] Failed to submit contextual feedback', error);
    return { success: false, error: message };
  }
}
