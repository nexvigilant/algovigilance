/**
 * Circles REST API Client
 *
 * Typed fetch client for all 33 Circles R&D platform endpoints.
 * Communicates with nexcore-api via the Studio proxy.
 * Types in: ./circles-types.ts
 */

import type {
    Circle, CreateCircleRequest, UpdateCircleRequest,
    CircleMember, InviteRequest, UpdateMemberRequest,
    FeedEntry, CreateFeedEntryRequest,
    Project, CreateProjectRequest, UpdateProjectRequest, AdvanceStageRequest,
    Deliverable, CreateDeliverableRequest, UpdateDeliverableRequest, ReviewDeliverableRequest,
    Publication, PublishRequest,
    Collaboration, CollaborateRequest, UpdateCollaborationRequest,
    SignalDetectRequest, FaersQueryRequest, LiteratureSearchRequest,
    ToolResultResponse, ApiResult,
} from './circles-types';

// Re-export all types for consumers
export type {
    Circle, CreateCircleRequest, UpdateCircleRequest,
    CircleMember, InviteRequest, UpdateMemberRequest,
    FeedEntry, CreateFeedEntryRequest,
    Project, CreateProjectRequest, UpdateProjectRequest, AdvanceStageRequest,
    Deliverable, CreateDeliverableRequest, UpdateDeliverableRequest, ReviewDeliverableRequest,
    Publication, PublishRequest,
    Collaboration, CollaborateRequest, UpdateCollaborationRequest,
    SignalDetectRequest, FaersQueryRequest, LiteratureSearchRequest,
    ToolResultResponse, ApiResult,
};

const API_BASE = '/api/nexcore/api/v1';

function fetchApi<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
    return fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    })
        .then((res) =>
            res.json().catch(() => ({ message: 'Request failed' })).then((body: unknown) => {
                if (!res.ok) {
                    const err = body as { message?: string };
                    return { success: false as const, error: err.message ?? `HTTP ${res.status}` };
                }
                return { success: true as const, data: body as T };
            }),
        )
        .catch((e: unknown) => ({
            success: false as const,
            error: e instanceof Error ? e.message : 'Network error',
        }));
}

// ── Circles ─────────────────────────────────

export function createCircle(req: CreateCircleRequest) {
    return fetchApi<Circle>('/circles', { method: 'POST', body: JSON.stringify(req) });
}

export function listCircles() {
    return fetchApi<Circle[]>('/circles');
}

export function getCircle(id: string) {
    return fetchApi<Circle>(`/circles/${id}`);
}

export function updateCircle(id: string, req: UpdateCircleRequest) {
    return fetchApi<Circle>(`/circles/${id}`, { method: 'PATCH', body: JSON.stringify(req) });
}

export function archiveCircle(id: string) {
    return fetchApi<{ status: string }>(`/circles/${id}`, { method: 'DELETE' });
}

export function myCircles(userId: string) {
    return fetchApi<Circle[]>(`/circles/my/${userId}`);
}

export function orgCircles(tenantId: string) {
    return fetchApi<Circle[]>(`/circles/org/${tenantId}`);
}

export function discoverCircles() {
    return fetchApi<Circle[]>('/circles/discover');
}

// ── Membership ──────────────────────────────

export function joinCircle(circleId: string, userId: string) {
    return fetchApi<{ status: string }>(`/circles/${circleId}/join`, {
        method: 'POST', body: JSON.stringify({ user_id: userId }),
    });
}

export function inviteMembers(circleId: string, req: InviteRequest) {
    return fetchApi<{ status: string; count: number }>(
        `/circles/${circleId}/invite`, { method: 'POST', body: JSON.stringify(req) },
    );
}

export function listMembers(circleId: string) {
    return fetchApi<CircleMember[]>(`/circles/${circleId}/members`);
}

export function updateMember(circleId: string, userId: string, req: UpdateMemberRequest) {
    return fetchApi<CircleMember>(
        `/circles/${circleId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify(req) },
    );
}

export function removeMember(circleId: string, userId: string) {
    return fetchApi<{ status: string }>(
        `/circles/${circleId}/members/${userId}`, { method: 'DELETE' },
    );
}

// ── Feed ────────────────────────────────────

export function getFeed(circleId: string) {
    return fetchApi<FeedEntry[]>(`/circles/${circleId}/feed`);
}

export function postToFeed(circleId: string, req: CreateFeedEntryRequest) {
    return fetchApi<FeedEntry>(`/circles/${circleId}/feed`, {
        method: 'POST', body: JSON.stringify(req),
    });
}

// ── Projects ────────────────────────────────

export function createProject(circleId: string, req: CreateProjectRequest) {
    return fetchApi<Project>(`/circles/${circleId}/projects`, {
        method: 'POST', body: JSON.stringify(req),
    });
}

export function listProjects(circleId: string) {
    return fetchApi<Project[]>(`/circles/${circleId}/projects`);
}

export function getProject(circleId: string, projectId: string) {
    return fetchApi<Project>(`/circles/${circleId}/projects/${projectId}`);
}

export function updateProject(circleId: string, projectId: string, req: UpdateProjectRequest) {
    return fetchApi<Project>(
        `/circles/${circleId}/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(req) },
    );
}

export function advanceStage(circleId: string, projectId: string, req: AdvanceStageRequest) {
    return fetchApi<Project>(
        `/circles/${circleId}/projects/${projectId}/advance`, { method: 'POST', body: JSON.stringify(req) },
    );
}

// ── Deliverables ────────────────────────────

export function createDeliverable(circleId: string, projectId: string, req: CreateDeliverableRequest) {
    return fetchApi<Deliverable>(
        `/circles/${circleId}/projects/${projectId}/deliverables`, { method: 'POST', body: JSON.stringify(req) },
    );
}

export function listDeliverables(circleId: string, projectId: string) {
    return fetchApi<Deliverable[]>(`/circles/${circleId}/projects/${projectId}/deliverables`);
}

export function updateDeliverable(
    circleId: string, projectId: string, deliverableId: string, req: UpdateDeliverableRequest,
) {
    return fetchApi<Deliverable>(
        `/circles/${circleId}/projects/${projectId}/deliverables/${deliverableId}`,
        { method: 'PATCH', body: JSON.stringify(req) },
    );
}

export function reviewDeliverable(
    circleId: string, projectId: string, deliverableId: string, req: ReviewDeliverableRequest,
) {
    return fetchApi<Deliverable>(
        `/circles/${circleId}/projects/${projectId}/deliverables/${deliverableId}/review`,
        { method: 'POST', body: JSON.stringify(req) },
    );
}

// ── Project Tools ───────────────────────────

export function runSignalDetection(circleId: string, projectId: string, req: SignalDetectRequest) {
    return fetchApi<ToolResultResponse>(
        `/circles/${circleId}/projects/${projectId}/tools/signal-detect`,
        { method: 'POST', body: JSON.stringify(req) },
    );
}

export function runFaersQuery(circleId: string, projectId: string, req: FaersQueryRequest) {
    return fetchApi<ToolResultResponse>(
        `/circles/${circleId}/projects/${projectId}/tools/faers-query`,
        { method: 'POST', body: JSON.stringify(req) },
    );
}

export function runLiteratureSearch(circleId: string, projectId: string, req: LiteratureSearchRequest) {
    return fetchApi<ToolResultResponse>(
        `/circles/${circleId}/projects/${projectId}/tools/literature-search`,
        { method: 'POST', body: JSON.stringify(req) },
    );
}

// ── Publications ────────────────────────────

export function publishDeliverable(circleId: string, req: PublishRequest) {
    return fetchApi<Publication>(`/circles/${circleId}/publish`, {
        method: 'POST', body: JSON.stringify(req),
    });
}

export function listPublications() {
    return fetchApi<Publication[]>('/publications');
}

export function listCirclePublications(circleId: string) {
    return fetchApi<Publication[]>(`/circles/${circleId}/publications`);
}

// ── Collaborations ──────────────────────────

export function requestCollaboration(circleId: string, req: CollaborateRequest) {
    return fetchApi<Collaboration>(`/circles/${circleId}/collaborate`, {
        method: 'POST', body: JSON.stringify(req),
    });
}

export function listCollaborations(circleId: string) {
    return fetchApi<Collaboration[]>(`/circles/${circleId}/collaborations`);
}

export function updateCollaboration(collabId: string, req: UpdateCollaborationRequest) {
    return fetchApi<Collaboration>(`/collaborations/${collabId}`, {
        method: 'PATCH', body: JSON.stringify(req),
    });
}
