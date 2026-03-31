/**
 * API Route Test Utilities
 *
 * Helper functions for testing Next.js App Router API routes.
 * Provides mock request creation and response parsing utilities.
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  options?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  }
): NextRequest {
  const { body, headers = {}, cookies = {} } = options || {};

  // Build URL
  const baseUrl = 'http://localhost:9002';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // Create request init
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  // Create the request
  const request = new NextRequest(fullUrl, init);

  // Add cookies - NextRequest doesn't support direct cookie setting in constructor
  // so we need to work around it by mocking the cookies property if needed
  if (Object.keys(cookies).length > 0) {
    // Create cookie header string
    const cookieHeader = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');

    // We need to create a new request with the cookie header
    return new NextRequest(fullUrl, {
      ...init,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });
  }

  return request;
}

/**
 * Parse response JSON safely
 */
export async function parseResponse<T = unknown>(
  response: Response
): Promise<{ status: number; data: T; cookies: Map<string, string> }> {
  const status = response.status;
  let data: T;

  try {
    data = await response.json();
  } catch {
    data = {} as T;
  }

  // Extract cookies from response
  const cookies = new Map<string, string>();
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Parse Set-Cookie header (simplified)
    const cookieParts = setCookieHeader.split(',').map((c) => c.trim());
    for (const part of cookieParts) {
      const [nameValue] = part.split(';');
      if (nameValue) {
        const [name, value] = nameValue.split('=');
        if (name && value !== undefined) {
          cookies.set(name.trim(), value.trim());
        }
      }
    }
  }

  return { status, data, cookies };
}

/**
 * Assert response matches expected structure
 */
export function assertResponse(
  response: { status: number; data: unknown },
  expected: { status?: number; data?: unknown }
) {
  if (expected.status !== undefined) {
    expect(response.status).toBe(expected.status);
  }
  if (expected.data !== undefined) {
    expect(response.data).toMatchObject(expected.data as Record<string, unknown>);
  }
}

/**
 * Create a mock request with authentication
 */
export function createAuthenticatedRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  options?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    token?: string;
  }
): NextRequest {
  const { token = 'mock-valid-token', ...rest } = options || {};

  return createMockRequest(method, url, {
    ...rest,
    cookies: {
      nucleus_id_token: token,
    },
  });
}

/**
 * Test error response structure
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Test success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

/**
 * Wait for rate limit reset (useful for integration tests)
 */
export function waitForRateLimit(ms: number = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
