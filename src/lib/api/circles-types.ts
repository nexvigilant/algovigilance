/**
 * Circles REST API Types
 *
 * TypeScript interfaces mirroring Rust API types for the Circles R&D platform.
 */

// ── Circles ────────────────────────────────

export interface Circle {
    id: string;
    name: string;
    slug: string;
    description: string;
    mission: string | null;
    formation: string;
    visibility: string;
    join_policy: string;
    circle_type: string;
    therapeutic_areas: string[];
    tags: string[];
    status: string;
    member_count: number;
    project_count: number;
    publication_count: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateCircleRequest {
    name: string;
    description: string;
    mission?: string;
    formation?: string;
    tenant_id?: string;
    created_by: string;
    visibility?: string;
    join_policy?: string;
    circle_type?: string;
    therapeutic_areas?: string[];
    tags?: string[];
}

export interface UpdateCircleRequest {
    name?: string;
    description?: string;
    mission?: string;
    visibility?: string;
    join_policy?: string;
    status?: string;
    therapeutic_areas?: string[];
    tags?: string[];
}

// ── Members ────────────────────────────────

export interface CircleMember {
    id: string;
    circle_id: string;
    user_id: string;
    role: string;
    status: string;
    joined_at: string;
    invited_by: string | null;
}

export interface JoinRequest {
    user_id: string;
}

export interface InviteRequest {
    user_ids: string[];
    invited_by: string;
}

export interface UpdateMemberRequest {
    role?: string;
    status?: string;
}

// ── Feed ───────────────────────────────────

export interface FeedEntry {
    id: string;
    circle_id: string;
    entry_type: string;
    actor_user_id: string;
    content: string;
    reference_id: string | null;
    reference_type: string | null;
    created_at: string;
}

export interface CreateFeedEntryRequest {
    actor_user_id: string;
    entry_type?: string;
    content: string;
    reference_id?: string;
    reference_type?: string;
}

// ── Projects ───────────────────────────────

export interface Project {
    id: string;
    circle_id: string;
    name: string;
    description: string;
    project_type: string;
    stage: string;
    status: string;
    therapeutic_area: string | null;
    drug_names: string[];
    indications: string[];
    data_sources: string[];
    started_at: string;
    target_completion: string | null;
    completed_at: string | null;
    lead_user_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectRequest {
    name: string;
    description: string;
    project_type?: string;
    therapeutic_area?: string;
    drug_names?: string[];
    indications?: string[];
    data_sources?: string[];
    target_completion?: string;
    lead_user_id: string;
    created_by: string;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    status?: string;
    therapeutic_area?: string;
    drug_names?: string[];
    indications?: string[];
    data_sources?: string[];
    target_completion?: string;
}

export interface AdvanceStageRequest {
    advanced_by: string;
}

// ── Deliverables ───────────────────────────

export interface Deliverable {
    id: string;
    project_id: string;
    circle_id: string;
    name: string;
    deliverable_type: string;
    status: string;
    version: number;
    file_url: string | null;
    content_hash: string | null;
    reviewed_by: string | null;
    review_status: string;
    review_notes: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateDeliverableRequest {
    name: string;
    deliverable_type?: string;
    created_by: string;
}

export interface UpdateDeliverableRequest {
    name?: string;
    status?: string;
}

export interface ReviewDeliverableRequest {
    reviewed_by: string;
    review_status: string;
    review_notes?: string;
}

// ── Publications ───────────────────────────

export interface Publication {
    id: string;
    source_circle_id: string;
    deliverable_id: string;
    title: string;
    abstract_text: string;
    visibility: string;
    published_at: string;
    published_by: string;
}

export interface PublishRequest {
    deliverable_id: string;
    title: string;
    abstract_text: string;
    visibility?: string;
    published_by: string;
}

// ── Collaborations ─────────────────────────

export interface Collaboration {
    id: string;
    requesting_circle_id: string;
    target_circle_id: string;
    request_type: string;
    message: string;
    status: string;
    created_by: string;
    created_at: string;
}

export interface CollaborateRequest {
    target_circle_id: string;
    request_type?: string;
    message: string;
    created_by: string;
}

export interface UpdateCollaborationRequest {
    status: string;
}

// ── Tool Requests ──────────────────────────

export interface SignalDetectRequest {
    drug_count: number;
    event_count: number;
    drug_event_count: number;
    total_count: number;
    user_id: string;
}

export interface FaersQueryRequest {
    query: string;
    limit?: number;
    user_id: string;
}

export interface LiteratureSearchRequest {
    query: string;
    category?: string;
    limit?: number;
    user_id: string;
}

export interface ToolResultResponse {
    deliverable_id: string;
    tool_name: string;
    success: boolean;
    result: unknown;
}

// ── Client ─────────────────────────────────

export interface ApiResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}
