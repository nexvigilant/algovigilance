'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STORAGE_KEY = 'pspv_founding_member_email';

export function FoundingSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email address is required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const existing = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? '[]'
      ) as string[];
      if (!existing.includes(trimmed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, trimmed]));
      }
    } catch {
      // localStorage unavailable — proceed silently
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-cyan/40 bg-cyan/5 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg font-semibold text-white mb-2">
          You are on the charter list.
        </p>
        <p className="text-slate-300 text-sm">
          We will reach out when PSPV formally incorporates. Watch{' '}
          <a
            href="https://algovigilance.net"
            className="text-cyan underline hover:text-cyan/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            nexvigilant.com
          </a>{' '}
          for updates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Founding member signup"
      className="flex flex-col sm:flex-row gap-3 items-start"
    >
      <div className="flex-1 w-full">
        <Label htmlFor="founding-email" className="sr-only">
          Email address
        </Label>
        <Input
          id="founding-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={error ? 'founding-email-error' : undefined}
          className="bg-white/[0.06] border-white/[0.18] text-white placeholder:text-slate-500 focus:border-cyan/60 h-11"
          autoComplete="email"
        />
        {error && (
          <p
            id="founding-email-error"
            role="alert"
            className="mt-1.5 text-xs text-red-400"
          >
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        className="bg-cyan text-nex-deep hover:bg-cyan/90 font-semibold whitespace-nowrap h-11 px-6"
      >
        Join as Founding Member
      </Button>
    </form>
  );
}
