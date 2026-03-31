/**
 * Boundary Constants - Central source of truth for AlgoVigilance UI messaging
 *
 * Brand Voice Guidelines:
 * - Confident but not arrogant
 * - Direct but not blunt
 * - Supportive but not patronizing
 * - Knowledgeable but not academic
 *
 * Terminology:
 * - Course → Capability Pathway
 * - Certificate → Capability Verification
 * - Practitioner / Member (formerly Student)
 * - Lesson → Practice Activity
 */

// ============================================================================
// LOADING MESSAGES
// ============================================================================

export const LOADING_MESSAGES = {
  academy: "Preparing your capability pathways...",
  community: "Connecting with fellow practitioners...",
  profile: "Assembling your professional portfolio...",
  analytics: "Analyzing your progress data...",
  search: "Searching safety database...",
  course: "Loading capability materials...",
  forum: "Retrieving professional discussions...",
  assessment: "Preparing competency assessment...",
  regulatory: "Fetching regulatory data...",
  admin: "Loading administrative dashboard...",
  notifications: "Checking your updates...",
  messages: "Retrieving conversations...",
  certificates: "Verifying your capabilities...",
  auth: "Verifying your credentials...",
  subscription: "Loading subscription details...",
  pipeline: "Monitoring generation pipeline...",
  intelligence: "Loading research feed...",
  vigilance: "Loading safety signal analytics...",
  tools: "Preparing pharmacovigilance tools...",
  organization: "Loading organization settings...",
  watchtower: "Loading system telemetry...",
  default: "Preparing your experience...",
} as const;

export type LoadingContext = keyof typeof LOADING_MESSAGES;

// ============================================================================
// EMPTY STATE CONTENT
// ============================================================================

export const EMPTY_STATE_CONTENT = {
  posts: {
    title: "No discussions yet",
    description:
      "Be the first to start a conversation and share your expertise.",
    actionLabel: "Start a Discussion",
    icon: "MessageSquare",
  },
  courses: {
    title: "Your capability journey awaits",
    description:
      "Begin building pharmaceutical expertise with our guided pathways.",
    actionLabel: "Explore Pathways",
    icon: "BookOpen",
  },
  "active-courses": {
    title: "No active pathways",
    description: "Browse available pathways and start building your expertise.",
    actionLabel: "Explore Pathways",
    icon: "Compass",
  },
  "available-courses": {
    title: "You're building all available capabilities!",
    description: "Check back soon for new pathways.",
    icon: "Trophy",
  },
  notifications: {
    title: "All caught up",
    description:
      "You'll see updates here as the community engages with your contributions.",
    icon: "Bell",
  },
  messages: {
    title: "Your inbox is clear",
    description: "Start a conversation with a fellow professional.",
    actionLabel: "Find Practitioners",
    icon: "MessageCircle",
  },
  bookmarks: {
    title: "Your saved resources library is empty",
    description: "Bookmark valuable content as you explore.",
    icon: "Bookmark",
  },
  certificates: {
    title: "No capability verifications earned yet",
    description: "Complete a pathway to demonstrate your professional growth.",
    actionLabel: "Explore Pathways",
    icon: "Award",
  },
  "search-results": {
    title: "No matches found",
    description:
      "Try adjusting your search terms or explore our curated content.",
    icon: "SearchX",
  },
  recommendations: {
    title: "Building your recommendations",
    description:
      "Complete your profile and engage with content to receive personalized suggestions.",
    actionLabel: "Complete Profile",
    icon: "Sparkles",
  },
  badges: {
    title: "Your achievement showcase awaits",
    description: "Participate in the community to earn recognition.",
    icon: "Medal",
  },
  progress: {
    title: "No progress data yet",
    description: "Complete a capability pathway to see your analytics.",
    actionLabel: "Start Building",
    icon: "BarChart3",
  },
  forums: {
    title: "No forums match your criteria",
    description:
      "Try adjusting your filters or explore all available communities.",
    icon: "Users",
  },
  members: {
    title: "No practitioners match your criteria",
    description: "Try adjusting your filters.",
    icon: "UserSearch",
  },
  circles: {
    title: "No matching circles found",
    description: "Try different interests or create your own circle.",
    actionLabel: "Create a Circle",
    icon: "CircleDot",
  },
  notes: {
    title: "No notes yet",
    description: "Capture your insights as you learn.",
    actionLabel: "Create Your First Note",
    icon: "StickyNote",
  },
  reviews: {
    title: "No practitioner feedback yet",
    description: "Be the first to share your experience with this pathway.",
    actionLabel: "Share Your Experience",
    icon: "Star",
  },
  portfolio: {
    title: "Your professional portfolio is ready for evidence",
    description:
      "Complete capability activities to build your professional record.",
    actionLabel: "Start Building",
    icon: "FolderOpen",
  },
  "admin-reports": {
    title: "No reports to review",
    description: "Great job keeping the community safe!",
    icon: "ShieldCheck",
  },
  "admin-submissions": {
    title: "No contact submissions",
    description: "Incoming inquiries will appear here.",
    icon: "Inbox",
  },
  "admin-leads": {
    title: "No consulting leads",
    description: "Enterprise consulting inquiries will appear here.",
    icon: "Handshake",
  },
  conversations: {
    title: "No conversations yet",
    description: "Start a conversation from a user's profile.",
    icon: "MessagesSquare",
  },
  "skill-gaps": {
    title: "No skill gaps found for this career path",
    description: "You're well-prepared for this role!",
    icon: "CheckCircle2",
  },
} as const;

export type EmptyStateContext = keyof typeof EMPTY_STATE_CONTENT;

// ============================================================================
// ERROR CONTENT
// ============================================================================

export const ERROR_CONTENT = {
  "not-found": {
    title: "Resource Not Located",
    description:
      "The requested content could not be found. It may have been moved or removed.",
    actionLabel: "Return to Dashboard",
    actionHref: "/nucleus",
    icon: "SearchX",
  },
  unauthorized: {
    title: "Access Restricted",
    description:
      "Your current credentials do not permit access to this resource.",
    actionLabel: "Sign In",
    actionHref: "/auth/signin",
    icon: "ShieldX",
  },
  network: {
    title: "Connection Interrupted",
    description:
      "Unable to establish a secure connection. Please check your network.",
    actionLabel: "Retry",
    icon: "WifiOff",
  },
  server: {
    title: "System Temporarily Unavailable",
    description:
      "Our systems are experiencing an issue. Our team has been notified.",
    actionLabel: "Try Again",
    icon: "Server",
  },
  validation: {
    title: "Please Review Your Input",
    description: "Some fields require your attention before proceeding.",
    icon: "AlertCircle",
  },
  "course-not-found": {
    title: "Pathway Not Found",
    description: "This capability pathway may have been archived or moved.",
    actionLabel: "Browse Pathways",
    actionHref: "/nucleus/academy/pathways",
    icon: "BookX",
  },
  "certificate-not-found": {
    title: "Capability Not Found",
    description:
      "If you believe this is an error, please contact our support team.",
    actionLabel: "Return Home",
    actionHref: "/",
    icon: "FileX",
  },
  permission: {
    title: "Access Verification Required",
    description:
      "This content requires specific access privileges. Verify your enrollment or contact support.",
    icon: "Lock",
  },
  generic: {
    title: "Something Went Wrong",
    description:
      "An unexpected issue occurred. Please try again or contact support.",
    actionLabel: "Try Again",
    icon: "AlertTriangle",
  },
  recommendations: {
    title: "Unable to Load Recommendations",
    description:
      "We encountered an issue generating your personalized suggestions.",
    actionLabel: "Try Again",
    icon: "Sparkles",
  },
  "skill-gaps": {
    title: "Unable to Load Skill Gaps",
    description: "We encountered an issue analyzing your skill gaps.",
    actionLabel: "Try Again",
    icon: "BarChart3",
  },
  data: {
    title: "Unable to Load Data",
    description: "There was an issue retrieving the requested information.",
    actionLabel: "Try Again",
    icon: "Database",
  },
} as const;

export type ErrorType = keyof typeof ERROR_CONTENT;

// ============================================================================
// TOAST MESSAGES
// ============================================================================

export const TOAST_MESSAGES = {
  // CRUD Operations
  save: {
    success: "Changes preserved",
    error: "Unable to save changes—please try again",
  },
  delete: {
    success: "Item removed",
    error: "Unable to remove item—please try again",
  },
  create: {
    success: "Successfully created",
    error: "Unable to create—please try again",
  },
  update: {
    success: "Successfully updated",
    error: "Unable to update—please try again",
  },

  // Academy Actions
  enroll: {
    success: "Pathway started—begin building your capability",
    error: "Unable to start pathway—please try again",
  },
  complete: {
    success: "Capability verified—congratulations!",
    error: "Unable to record completion—please try again",
  },
  bookmark: {
    success: "Added to your saved resources",
    error: "Unable to bookmark—please try again",
  },
  unbookmark: {
    success: "Removed from saved resources",
    error: "Unable to remove bookmark—please try again",
  },

  // Community Actions
  post: {
    success: "Discussion published",
    error: "Unable to publish discussion—please try again",
  },
  reply: {
    success: "Reply posted",
    error: "Unable to post reply—please try again",
  },
  react: {
    success: "Reaction added",
    error: "Unable to add reaction—please try again",
  },
  message: {
    success: "Message sent",
    error: "Unable to send message—please try again",
  },

  // Profile Actions
  profile: {
    success: "Profile updated",
    error: "Unable to update profile—please try again",
  },
  password: {
    success: "Password updated successfully",
    error: "Unable to update password—please verify your current password",
  },
  email: {
    success: "Verification email sent—please check your inbox",
    error: "Unable to update email—please try again",
  },

  // Admin Actions
  ban: {
    success: "User access restricted",
    error: "Unable to restrict user—please try again",
  },
  unban: {
    success: "User access restored",
    error: "Unable to restore user access—please try again",
  },
  role: {
    success: "User role updated",
    error: "Unable to update role—please try again",
  },
  approve: {
    success: "Request approved",
    error: "Unable to approve—please try again",
  },
  reject: {
    success: "Request rejected",
    error: "Unable to reject—please try again",
  },
  broadcast: {
    success: "Notification sent to members",
    error: "Unable to send notification—please try again",
  },

  // Form Actions
  submit: {
    success: "Submission received",
    error: "Unable to submit—please try again",
  },
  subscribe: {
    success: "Subscribed to updates",
    error: "Unable to subscribe—please try again",
  },
  feedback: {
    success: "Thank you for your feedback",
    error: "Unable to submit feedback—please try again",
  },

  // System
  network: {
    error: "Connection interrupted—please check your network",
  },
  copy: {
    success: "Copied to clipboard",
    error: "Unable to copy—please try manually",
  },
  export: {
    success: "Export complete",
    error: "Unable to export—please try again",
  },
  upload: {
    success: "Upload complete",
    error: "Unable to upload—please try again",
  },
} as const;

export type ToastContext = keyof typeof TOAST_MESSAGES;
