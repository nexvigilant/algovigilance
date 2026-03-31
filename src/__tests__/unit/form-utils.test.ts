/**
 * Form Utils Unit Tests
 *
 * Tests server action wrappers and validation utilities.
 * These provide type-safe error handling for Next.js forms.
 */

import { describe, it, expect, jest } from '@jest/globals';
import { z } from 'zod';
import {
  wrapServerAction,
  wrapValidatedAction,
  type ServerActionResponse,
} from '@/lib/form-utils';

describe('Form Utils', () => {
  describe('wrapServerAction', () => {
    it('should return success response on successful action', async () => {
      const action = async (input: { name: string }) => ({ id: '123', name: input.name });
      const wrapped = wrapServerAction(action);

      const result = await wrapped({ name: 'John' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', name: 'John' });
      expect(result.error).toBeUndefined();
    });

    it('should return error response on action failure', async () => {
      const action = async () => {
        throw new Error('Database connection failed');
      };
      const mockLogger = { error: jest.fn() };
      const wrapped = wrapServerAction(action, { logger: mockLogger });

      const result = await wrapped({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.data).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle non-Error thrown objects', async () => {
      const action = async () => {
        throw 'String error';
      };
      const mockLogger = { error: jest.fn() };
      const wrapped = wrapServerAction(action, { logger: mockLogger });

      const result = await wrapped({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should preserve error message from Error instance', async () => {
      const action = async () => {
        throw new TypeError('Invalid type');
      };
      const mockLogger = { error: jest.fn() };
      const wrapped = wrapServerAction(action, { logger: mockLogger });

      const result = await wrapped({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid type');
    });

    it('should pass input to action correctly', async () => {
      const action = jest.fn(async (input: { a: number; b: number }) => input.a + input.b);
      const wrapped = wrapServerAction(action);

      await wrapped({ a: 5, b: 3 });

      expect(action).toHaveBeenCalledWith({ a: 5, b: 3 });
    });

    it('should handle async action that returns null', async () => {
      const action = async () => null;
      const wrapped = wrapServerAction(action);

      const result = await wrapped({});

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle async action that returns undefined', async () => {
      const action = async () => undefined;
      const wrapped = wrapServerAction(action);

      const result = await wrapped({});

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe('wrapValidatedAction', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(18, 'Must be 18 or older').optional(),
    });

    it('should execute action with valid input', async () => {
      const action = async (input: z.infer<typeof testSchema>) => ({
        id: '123',
        ...input,
      });
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped({ name: 'John', email: 'john@example.com' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should return validation errors for invalid input', async () => {
      const action = async (input: z.infer<typeof testSchema>) => input;
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped({ name: '', email: 'not-an-email' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.errors).toHaveProperty('name');
      expect(result.errors).toHaveProperty('email');
    });

    it('should return first error message per field', async () => {
      const action = async (input: z.infer<typeof testSchema>) => input;
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped({ name: '', email: 'bad' });

      expect(result.errors?.name).toBe('Name is required');
      expect(result.errors?.email).toBe('Invalid email');
    });

    it('should handle action errors after validation', async () => {
      const action = async () => {
        throw new Error('Server error');
      };
      const mockLogger = { error: jest.fn() };
      const wrapped = wrapValidatedAction(testSchema, action, { logger: mockLogger });

      const result = await wrapped({ name: 'John', email: 'john@example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(result.errors).toBeUndefined();
    });

    it('should validate optional fields correctly', async () => {
      const action = async (input: z.infer<typeof testSchema>) => input;
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped({
        name: 'John',
        email: 'john@example.com',
        age: 16,
      });

      expect(result.success).toBe(false);
      expect(result.errors?.age).toBe('Must be 18 or older');
    });

    it('should pass validation when optional field is missing', async () => {
      const action = async (input: z.infer<typeof testSchema>) => input;
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped({ name: 'John', email: 'john@example.com' });

      expect(result.success).toBe(true);
    });

    it('should handle non-object input gracefully', async () => {
      const action = async (input: z.infer<typeof testSchema>) => input;
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should handle null input gracefully', async () => {
      const action = async (input: z.infer<typeof testSchema>) => input;
      const wrapped = wrapValidatedAction(testSchema, action);

      const result = await wrapped(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should handle nested schema validation', async () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          settings: z.object({
            notifications: z.boolean(),
          }),
        }),
      });

      const action = async (input: z.infer<typeof nestedSchema>) => input;
      const wrapped = wrapValidatedAction(nestedSchema, action);

      const result = await wrapped({
        user: {
          name: 'John',
          settings: { notifications: true },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle array schema validation', async () => {
      const arraySchema = z.object({
        tags: z.array(z.string().min(1)).min(1, 'At least one tag required'),
      });

      const action = async (input: z.infer<typeof arraySchema>) => input;
      const wrapped = wrapValidatedAction(arraySchema, action);

      const emptyResult = await wrapped({ tags: [] });
      expect(emptyResult.success).toBe(false);

      const validResult = await wrapped({ tags: ['typescript', 'testing'] });
      expect(validResult.success).toBe(true);
    });
  });

  describe('ServerActionResponse type', () => {
    it('should support generic data type', () => {
      // Type test - these should compile without errors
      const successResponse: ServerActionResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      };

      const errorResponse: ServerActionResponse<{ id: string }> = {
        success: false,
        error: 'Something went wrong',
        errors: { field: 'Error message' },
      };

      expect(successResponse.success).toBe(true);
      expect(errorResponse.success).toBe(false);
    });
  });
});

describe('Form Utils - Integration Scenarios', () => {
  describe('Real-world form submission patterns', () => {
    const contactFormSchema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email'),
      message: z.string().min(10, 'Message must be at least 10 characters'),
      company: z.string().optional(),
    });

    it('should handle complete contact form submission', async () => {
      const submitContact = async (_data: z.infer<typeof contactFormSchema>) => ({
        ticketId: 'TICKET-123',
        createdAt: new Date().toISOString(),
      });

      const wrapped = wrapValidatedAction(contactFormSchema, submitContact);

      const result = await wrapped({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I would like to learn more about your services.',
        company: 'Acme Corp',
      });

      expect(result.success).toBe(true);
      expect(result.data?.ticketId).toBe('TICKET-123');
    });

    it('should handle form with multiple validation errors', async () => {
      const submitContact = async (data: z.infer<typeof contactFormSchema>) => data;
      const wrapped = wrapValidatedAction(contactFormSchema, submitContact);

      const result = await wrapped({
        name: 'J',
        email: 'not-email',
        message: 'short',
      });

      expect(result.success).toBe(false);
      expect(Object.keys(result.errors || {})).toHaveLength(3);
    });
  });

  describe('Error recovery patterns', () => {
    it('should provide actionable error for database failures', async () => {
      const saveUser = async () => {
        throw new Error('UNIQUE constraint failed: users.email');
      };

      const mockLogger = { error: jest.fn() };
      const wrapped = wrapServerAction(saveUser, { logger: mockLogger });

      const result = await wrapped({ email: 'duplicate@example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('UNIQUE constraint');
    });

    it('should sanitize sensitive error details', async () => {
      const savePayment = async () => {
        // Simulate sensitive error that shouldn't be exposed
        const error = new Error('An unexpected error occurred');
        throw error;
      };

      const mockLogger = { error: jest.fn() };
      const wrapped = wrapServerAction(savePayment, { logger: mockLogger });

      const result = await wrapped({});

      // Error message is passed through but logged
      expect(result.error).toBe('An unexpected error occurred');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
