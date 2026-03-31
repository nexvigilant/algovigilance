/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    scope: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

import { useLocalStorage, useAssessmentProgress } from '../use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('returns initial value when localStorage is empty', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      await waitFor(() => {
        expect(result.current[3]).toBe(true); // isLoaded
      });

      expect(result.current[0]).toBe('initial');
    });

    it('returns stored value when localStorage has data', async () => {
      localStorage.setItem('test-key', JSON.stringify('stored value'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      await waitFor(() => {
        expect(result.current[3]).toBe(true); // isLoaded
      });

      expect(result.current[0]).toBe('stored value');
    });

    it('persists value to localStorage when set', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      await waitFor(() => {
        expect(result.current[3]).toBe(true);
      });

      act(() => {
        result.current[1]('new value'); // setValue
      });

      expect(result.current[0]).toBe('new value');
      expect(JSON.parse(localStorage.getItem('test-key') ?? 'null')).toBe('new value');
    });

    it('supports functional updates', async () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      await waitFor(() => {
        expect(result.current[3]).toBe(true);
      });

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(6);
    });

    it('clears value from localStorage', async () => {
      localStorage.setItem('test-key', JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      await waitFor(() => {
        expect(result.current[0]).toBe('stored');
      });

      act(() => {
        result.current[2](); // clearValue
      });

      expect(result.current[0]).toBe('initial');
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('complex types', () => {
    it('handles objects', async () => {
      const initialValue = { name: 'Test', count: 0 };

      const { result } = renderHook(() => useLocalStorage('object-key', initialValue));

      await waitFor(() => {
        expect(result.current[3]).toBe(true);
      });

      act(() => {
        result.current[1]({ name: 'Updated', count: 5 });
      });

      expect(result.current[0]).toEqual({ name: 'Updated', count: 5 });
    });

    it('handles arrays', async () => {
      const { result } = renderHook(() => useLocalStorage<string[]>('array-key', []));

      await waitFor(() => {
        expect(result.current[3]).toBe(true);
      });

      act(() => {
        result.current[1](['item1', 'item2']);
      });

      expect(result.current[0]).toEqual(['item1', 'item2']);
    });
  });

  describe('error handling', () => {
    it('handles invalid JSON in localStorage gracefully', async () => {
      localStorage.setItem('bad-key', 'not valid json');

      const { result } = renderHook(() => useLocalStorage('bad-key', 'default'));

      await waitFor(() => {
        expect(result.current[3]).toBe(true);
      });

      // Should fall back to initial value
      expect(result.current[0]).toBe('default');
    });
  });

  describe('key changes', () => {
    it('loads new value when key changes', async () => {
      localStorage.setItem('key-1', JSON.stringify('value-1'));
      localStorage.setItem('key-2', JSON.stringify('value-2'));

      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'default'),
        { initialProps: { key: 'key-1' } }
      );

      await waitFor(() => {
        expect(result.current[0]).toBe('value-1');
      });

      rerender({ key: 'key-2' });

      await waitFor(() => {
        expect(result.current[0]).toBe('value-2');
      });
    });
  });
});

describe('useAssessmentProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty progress', async () => {
    const { result } = renderHook(() =>
      useAssessmentProgress('test-assessment', { answer: '' })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.responses).toEqual({ answer: '' });
    expect(result.current.currentStep).toBe('');
    expect(result.current.hasExistingProgress).toBe(false);
  });

  it('saves and restores progress', async () => {
    const { result, unmount } = renderHook(() =>
      useAssessmentProgress('test-assessment', { answer: '' })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setResponses({ answer: 'test answer' });
    });

    act(() => {
      result.current.setStep('step-2');
    });

    // Verify state was updated and localStorage was written
    expect(result.current.responses).toEqual({ answer: 'test answer' });
    expect(result.current.currentStep).toBe('step-2');

    // Verify localStorage has the data before unmount
    const storedData = localStorage.getItem('nexvigilant-assessment-test-assessment');
    expect(storedData).not.toBeNull();
    if (!storedData) throw new Error('No stored data found in localStorage');
    const parsed = JSON.parse(storedData);
    expect(parsed.responses).toEqual({ answer: 'test answer' });

    unmount();

    // Remount - should restore progress from localStorage
    const { result: result2 } = renderHook(() =>
      useAssessmentProgress('test-assessment', { answer: '' })
    );

    await waitFor(() => {
      expect(result2.current.isLoaded).toBe(true);
    });

    expect(result2.current.responses).toEqual({ answer: 'test answer' });
    expect(result2.current.currentStep).toBe('step-2');
    expect(result2.current.hasExistingProgress).toBe(true);
  });

  it('clears progress', async () => {
    localStorage.setItem(
      'nexvigilant-assessment-test',
      JSON.stringify({
        step: 'step-3',
        responses: { answer: 'saved' },
        lastUpdated: new Date().toISOString(),
        version: 1,
      })
    );

    const { result } = renderHook(() =>
      useAssessmentProgress('test', { answer: '' })
    );

    await waitFor(() => {
      expect(result.current.hasExistingProgress).toBe(true);
    });

    act(() => {
      result.current.clearProgress();
    });

    expect(result.current.responses).toEqual({ answer: '' });
    expect(result.current.currentStep).toBe('');
  });

  it('handles version mismatch', async () => {
    // Save with version 1
    localStorage.setItem(
      'nexvigilant-assessment-versioned',
      JSON.stringify({
        step: 'step-3',
        responses: { answer: 'old version' },
        lastUpdated: new Date().toISOString(),
        version: 1,
      })
    );

    // Load with version 2
    const { result } = renderHook(() =>
      useAssessmentProgress('versioned', { answer: '' }, 2)
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Should not consider old version as existing progress
    expect(result.current.hasExistingProgress).toBe(false);
  });
});
