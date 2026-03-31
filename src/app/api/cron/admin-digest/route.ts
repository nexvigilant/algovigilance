import { type NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { verifyCronSecret } from '@/lib/cron-auth';
import { daysToMs } from '@/lib/constants/timing';
import { Resend } from 'resend';

import { logger } from '@/lib/logger';
const log = logger.scope('admin-digest/route');

/**
 * GET /api/cron/admin-digest
 *
 * Vercel Cron Job that runs daily at 9 AM EST (14:00 UTC) to send an admin digest
 * with pending action items: consulting leads, contact submissions, affiliate applications.
 *
 * Schedule: Daily at 9 AM EST (configured in vercel.json)
 *
 * Security: Protected by CRON_SECRET from Secret Manager
 */

interface AdminDigestStats {
  pendingConsultingLeads: number;
  hotLeads: number; // Score >= 100
  unreadContactSubmissions: number;
  pendingAffiliateApplications: number;
  newMembersToday: number;
  totalPending: number;
  // Community Health Metrics
  community: {
    healthScore: number; // 0-100
    healthStatus: 'healthy' | 'warning' | 'critical';
    activeMembers7d: number;
    totalMembers: number;
    postsToday: number;
    engagementRate: number; // percentage
    avgResponseHours: number;
    newMembersWithoutPosts: number; // Users who joined but never posted
  };
}

async function getAdminDigestStats(): Promise<AdminDigestStats> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - daysToMs(7));
  const thirtyDaysAgo = new Date(now.getTime() - daysToMs(30));

  // OPTIMIZATION: Parallelize all independent Firestore queries
  // This reduces O(T₁ + T₂ + ... + Tₙ) → O(max(T₁, T₂, ..., Tₙ))
  const [
    consultingLeadsSnap,
    hotLeadsSnap,
    contactSubmissionsSnap,
    affiliateAppsSnap,
    newMembersSnap,
    // Community health queries
    totalMembersSnap,
    activeMembers7dSnap,
    postsTodaySnap,
    postsLast30dSnap,
    repliesLast7dSnap,
    newMembersLast30dSnap,
  ] = await Promise.all([
    // Pending consulting leads
    adminDb
      .collection('consulting_inquiries')
      .where('status', '==', 'new')
      .count()
      .get(),
    // Hot leads (score >= 100)
    adminDb
      .collection('consulting_inquiries')
      .where('status', '==', 'new')
      .where('leadScore', '>=', 100)
      .count()
      .get(),
    // Unread contact submissions
    adminDb
      .collection('contact_submissions')
      .where('status', '==', 'new')
      .count()
      .get(),
    // Pending affiliate applications
    adminDb
      .collection('affiliate_applications')
      .where('status', '==', 'new')
      .count()
      .get(),
    // New members today
    adminDb
      .collection('users')
      .where('createdAt', '>=', startOfDay)
      .count()
      .get(),
    // --- Community Health Queries ---
    // Total members
    adminDb
      .collection('users')
      .count()
      .get(),
    // Active members in last 7 days (users who posted or replied)
    adminDb
      .collection('community_posts')
      .where('createdAt', '>=', sevenDaysAgo)
      .get(),
    // Posts created today
    adminDb
      .collection('community_posts')
      .where('createdAt', '>=', startOfDay)
      .count()
      .get(),
    // Posts in last 30 days (for engagement rate)
    adminDb
      .collection('community_posts')
      .where('createdAt', '>=', thirtyDaysAgo)
      .count()
      .get(),
    // Replies in last 7 days (for response tracking)
    adminDb
      .collectionGroup('replies')
      .where('createdAt', '>=', sevenDaysAgo)
      .get(),
    // New members in last 30 days (for silent member detection)
    adminDb
      .collection('users')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get(),
  ]);

  const pendingConsultingLeads = consultingLeadsSnap.data().count;
  const hotLeads = hotLeadsSnap.data().count;
  const unreadContactSubmissions = contactSubmissionsSnap.data().count;
  const pendingAffiliateApplications = affiliateAppsSnap.data().count;
  const newMembersToday = newMembersSnap.data().count;

  // Calculate community health metrics
  const totalMembers = totalMembersSnap.data().count;
  const postsToday = postsTodaySnap.data().count;
  const _postsLast30d = postsLast30dSnap.data().count; // Reserved for future trend analysis

  // Get unique active members from posts in last 7 days
  const activeAuthorIds = new Set<string>();
  activeMembers7dSnap.docs.forEach(doc => {
    const authorId = doc.data().authorId;
    if (authorId) activeAuthorIds.add(authorId);
  });
  // Also add reply authors
  repliesLast7dSnap.docs.forEach(doc => {
    const authorId = doc.data().authorId;
    if (authorId) activeAuthorIds.add(authorId);
  });
  const activeMembers7d = activeAuthorIds.size;

  // Calculate engagement rate (active members / total members * 100)
  const engagementRate = totalMembers > 0
    ? Math.round((activeMembers7d / totalMembers) * 100 * 10) / 10
    : 0;

  // Calculate average response time (hours from post to first reply)
  let avgResponseHours = 0;
  if (repliesLast7dSnap.docs.length > 0) {
    // Approximate: average time from reply creation suggests response patterns
    // More accurate would require post-to-reply correlation
    avgResponseHours = 4; // Default estimate - could enhance with actual calculation
  }

  // Find new members who haven't posted
  const newMemberIds = new Set<string>();
  newMembersLast30dSnap.docs.forEach(doc => {
    newMemberIds.add(doc.id);
  });
  // Check which new members have posted
  const newMembersWhoPosted = new Set<string>();
  activeMembers7dSnap.docs.forEach(doc => {
    const authorId = doc.data().authorId;
    if (authorId && newMemberIds.has(authorId)) {
      newMembersWhoPosted.add(authorId);
    }
  });
  const newMembersWithoutPosts = newMemberIds.size - newMembersWhoPosted.size;

  // Calculate health score (0-100)
  // Factors: engagement rate (40%), response activity (30%), new member activation (30%)
  const engagementScore = Math.min(engagementRate * 4, 40); // Up to 40 points
  const responseScore = repliesLast7dSnap.docs.length > 0 ? 30 : 0; // 30 points if active replies
  const activationScore = newMemberIds.size > 0
    ? Math.round((newMembersWhoPosted.size / newMemberIds.size) * 30)
    : 30; // 30 points based on new member activation
  const healthScore = Math.round(engagementScore + responseScore + activationScore);

  // Determine health status
  let healthStatus: 'healthy' | 'warning' | 'critical';
  if (healthScore >= 70) {
    healthStatus = 'healthy';
  } else if (healthScore >= 40) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'critical';
  }

  return {
    pendingConsultingLeads,
    hotLeads,
    unreadContactSubmissions,
    pendingAffiliateApplications,
    newMembersToday,
    totalPending: pendingConsultingLeads + unreadContactSubmissions + pendingAffiliateApplications,
    community: {
      healthScore,
      healthStatus,
      activeMembers7d,
      totalMembers,
      postsToday,
      engagementRate,
      avgResponseHours,
      newMembersWithoutPosts,
    },
  };
}

function generateDigestHtml(stats: AdminDigestStats): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.com';
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sections: string[] = [];

  // Hot leads get special treatment
  if (stats.hotLeads > 0) {
    sections.push(`
      <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #1a1a2e; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
        <div style="font-size: 14px; font-weight: 600; text-transform: uppercase; opacity: 0.8;">🔥 HOT LEADS</div>
        <div style="font-size: 48px; font-weight: bold;">${stats.hotLeads}</div>
        <div style="font-size: 14px; opacity: 0.8;">High-value leads requiring immediate attention</div>
        <a href="${baseUrl}/nucleus/admin/consulting-leads" style="display: inline-block; background: #1a1a2e; color: #fbbf24 !important; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 600; margin-top: 12px;">View Now →</a>
      </div>
    `);
  }

  // Pending consulting leads
  if (stats.pendingConsultingLeads > 0) {
    sections.push(`
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f1f5f9; border-radius: 8px; margin-bottom: 12px;">
        <div>
          <div style="font-weight: 600; color: #1e293b;">Consulting Leads</div>
          <div style="font-size: 14px; color: #64748b;">${stats.pendingConsultingLeads} pending review</div>
        </div>
        <a href="${baseUrl}/nucleus/admin/consulting-leads" style="color: #22d3ee; text-decoration: none; font-weight: 600;">Review →</a>
      </div>
    `);
  }

  // Unread contact submissions
  if (stats.unreadContactSubmissions > 0) {
    sections.push(`
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f1f5f9; border-radius: 8px; margin-bottom: 12px;">
        <div>
          <div style="font-weight: 600; color: #1e293b;">Contact Messages</div>
          <div style="font-size: 14px; color: #64748b;">${stats.unreadContactSubmissions} unread</div>
        </div>
        <a href="${baseUrl}/nucleus/admin/contact-submissions" style="color: #22d3ee; text-decoration: none; font-weight: 600;">Review →</a>
      </div>
    `);
  }

  // Pending affiliate applications
  if (stats.pendingAffiliateApplications > 0) {
    sections.push(`
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f1f5f9; border-radius: 8px; margin-bottom: 12px;">
        <div>
          <div style="font-weight: 600; color: #1e293b;">Affiliate Applications</div>
          <div style="font-size: 14px; color: #64748b;">${stats.pendingAffiliateApplications} pending</div>
        </div>
        <a href="${baseUrl}/nucleus/admin/affiliate-applications" style="color: #22d3ee; text-decoration: none; font-weight: 600;">Review →</a>
      </div>
    `);
  }

  // New members today
  if (stats.newMembersToday > 0) {
    sections.push(`
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #ecfdf5; border-radius: 8px; margin-bottom: 12px;">
        <div>
          <div style="font-weight: 600; color: #059669;">New Members Today</div>
          <div style="font-size: 14px; color: #6b7280;">${stats.newMembersToday} new signups</div>
        </div>
        <span style="font-size: 24px;">🎉</span>
      </div>
    `);
  }

  // Community Health Dashboard
  const healthEmoji = stats.community.healthStatus === 'healthy' ? '💚' :
    stats.community.healthStatus === 'warning' ? '⚠️' : '🔴';
  const healthBgColor = stats.community.healthStatus === 'healthy' ? '#ecfdf5' :
    stats.community.healthStatus === 'warning' ? '#fef3c7' : '#fee2e2';
  const healthTextColor = stats.community.healthStatus === 'healthy' ? '#059669' :
    stats.community.healthStatus === 'warning' ? '#d97706' : '#dc2626';
  const healthLabel = stats.community.healthStatus === 'healthy' ? 'Healthy' :
    stats.community.healthStatus === 'warning' ? 'Needs Attention' : 'Critical';

  sections.push(`
    <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e2e8f0;">
      <div style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 16px;">📊 Community Health</div>

      <!-- Health Score Card -->
      <div style="background: ${healthBgColor}; padding: 20px; border-radius: 8px; margin-bottom: 16px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">${healthEmoji}</div>
        <div style="font-size: 36px; font-weight: bold; color: ${healthTextColor};">${stats.community.healthScore}</div>
        <div style="font-size: 14px; color: ${healthTextColor}; font-weight: 600;">${healthLabel}</div>
      </div>

      <!-- Metrics Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.community.activeMembers7d}</div>
          <div style="font-size: 12px; color: #64748b;">Active (7d)</div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.community.engagementRate}%</div>
          <div style="font-size: 12px; color: #64748b;">Engagement</div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.community.postsToday}</div>
          <div style="font-size: 12px; color: #64748b;">Posts Today</div>
        </div>
        <div style="background: ${stats.community.newMembersWithoutPosts > 5 ? '#fef3c7' : '#f1f5f9'}; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: ${stats.community.newMembersWithoutPosts > 5 ? '#d97706' : '#1e293b'};">${stats.community.newMembersWithoutPosts}</div>
          <div style="font-size: 12px; color: #64748b;">Silent Members</div>
        </div>
      </div>

      ${stats.community.healthStatus !== 'healthy' ? `
        <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #d97706;">
          <div style="font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase;">Action Needed</div>
          <div style="font-size: 14px; color: #78350f; margin-top: 4px;">
            ${stats.community.newMembersWithoutPosts > 5 ? `${stats.community.newMembersWithoutPosts} new members haven't posted yet. Consider sending a welcome prompt.` :
              stats.community.engagementRate < 10 ? 'Low engagement rate. Consider creating discussion prompts or featuring member content.' :
              'Review community activity and consider engagement initiatives.'}
          </div>
        </div>
      ` : ''}

      <a href="${baseUrl}/nucleus/admin" style="display: block; text-align: center; margin-top: 16px; color: #22d3ee; text-decoration: none; font-weight: 600;">View Full Dashboard →</a>
    </div>
  `);

  // All clear message
  if (stats.totalPending === 0) {
    sections.push(`
      <div style="text-align: center; padding: 40px; background: #f0fdf4; border-radius: 8px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <div style="font-size: 18px; font-weight: 600; color: #16a34a;">All Clear!</div>
        <div style="color: #6b7280; margin-top: 8px;">No pending items requiring attention.</div>
      </div>
    `);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #22d3ee; margin-bottom: 8px;">AlgoVigilance Admin Digest</div>
      <div style="color: #94a3b8; font-size: 14px;">${date}</div>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      ${stats.totalPending > 0 ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Action Items</div>
          <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">${stats.totalPending}</div>
        </div>
      ` : ''}

      ${sections.join('')}

      <!-- Quick Links -->
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
        <a href="${baseUrl}/nucleus/admin" style="display: inline-block; background: #22d3ee; color: #0a0f1c !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open Admin Hub</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
      <p>This is an automated daily digest from AlgoVigilance.</p>
      <p>© ${new Date().getFullYear()} AlgoVigilance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security (fail-closed)
  const authError = await verifyCronSecret(request, 'admin-digest');
  if (authError) return authError;

  log.debug('[Cron] Starting admin digest job...');
  const startTime = Date.now();

  try {
    // Get stats
    const stats = await getAdminDigestStats();

    log.debug('[Cron] Admin digest stats:', stats);

    // Only send email if there's something pending, new members, or community health issues
    const hasCommunityAlert = stats.community.healthStatus !== 'healthy';
    if (stats.totalPending === 0 && stats.newMembersToday === 0 && !hasCommunityAlert) {
      log.debug('[Cron] No pending items, new members, or community alerts - skipping digest email');
      return NextResponse.json({
        success: true,
        message: 'No pending items - digest email skipped',
        stats,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      log.warn('[Cron] RESEND_API_KEY not configured - skipping email');
      return NextResponse.json({
        success: true,
        message: 'Email service not configured',
        stats,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    const resend = new Resend(resendApiKey);

    // Generate and send email
    const html = generateDigestHtml(stats);

    // Build subject line with priority: Hot Leads > Critical Community > Action Items > All Clear
    let subject: string;
    if (stats.hotLeads > 0) {
      subject = `🔥 ${stats.hotLeads} Hot Lead${stats.hotLeads > 1 ? 's' : ''} + ${stats.totalPending} Action Items - AlgoVigilance Daily Digest`;
    } else if (stats.community.healthStatus === 'critical') {
      subject = `🔴 Community Health Critical (${stats.community.healthScore}/100) - AlgoVigilance Daily Digest`;
    } else if (stats.community.healthStatus === 'warning') {
      subject = `⚠️ Community Needs Attention (${stats.community.healthScore}/100) - AlgoVigilance Daily Digest`;
    } else if (stats.totalPending > 0) {
      subject = `📬 ${stats.totalPending} Action Item${stats.totalPending > 1 ? 's' : ''} - AlgoVigilance Daily Digest`;
    } else {
      subject = `💚 All Clear - AlgoVigilance Daily Digest`;
    }

    const { data, error } = await resend.emails.send({
      from: 'AlgoVigilance <notifications@nexvigilant.com>',
      to: ['matthew@nexvigilant.com'],
      subject,
      html,
    });

    if (error) {
      log.error('[Cron] Failed to send admin digest:', error);
      return NextResponse.json(
        {
          error: 'Failed to send digest email',
          message: error.message,
          stats,
        },
        { status: 500 }
      );
    }

    // Log the digest send
    await adminDb.collection('admin_digest_logs').add({
      sentAt: adminFieldValue.serverTimestamp(),
      stats,
      emailId: data?.id,
      duration: Date.now() - startTime,
    });

    const duration = Date.now() - startTime;
    log.debug(`[Cron] Admin digest sent successfully in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Admin digest sent successfully',
      emailId: data?.id,
      stats,
      duration: `${duration}ms`,
    });
  } catch (error) {
    log.error('[Cron] Error in admin digest job:', error);
    return NextResponse.json(
      {
        error: 'Admin digest job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for manual triggering
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
