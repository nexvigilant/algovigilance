'use client';

import { Component, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface TabErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
}

export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): TabErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Card className="border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-red-400 text-sm">
              Something went wrong loading this tab. Try refreshing the page.
            </p>
          </Card>
        )
      );
    }
    return this.props.children;
  }
}
