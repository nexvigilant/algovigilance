'use client';

import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoTimestampsProps {
  timestamps: {
    id: string;
    title: string;
    description?: string;
    secondsFromStart: number;
  }[];
  onTimestampClick: (seconds: number) => void;
  currentTime?: number; // Current video time in seconds for visual indication
}

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Component for displaying video timestamps/chapters with jump-to functionality (F020)
 */
export function VideoTimestamps({
  timestamps,
  onTimestampClick,
  currentTime = 0,
}: VideoTimestampsProps) {
  if (!timestamps || timestamps.length === 0) {
    return null;
  }

  return (
    <Card className="border-cyan/20 bg-gradient-to-br from-background to-cyan/5 mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan" />
          Video Chapters
        </CardTitle>
        <CardDescription>
          {timestamps.length} {timestamps.length === 1 ? 'section' : 'sections'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {timestamps.map((timestamp, index) => {
            const isCurrentOrPassed = currentTime >= timestamp.secondsFromStart;
            const isNext =
              currentTime < timestamp.secondsFromStart &&
              (index === 0 || currentTime < timestamps[index - 1]?.secondsFromStart);

            return (
              <Button
                key={timestamp.id}
                variant="ghost"
                className={`w-full justify-start gap-3 h-auto py-3 px-3 transition-all ${
                  isCurrentOrPassed
                    ? 'bg-cyan/10 hover:bg-cyan/20 border-l-2 border-cyan'
                    : 'hover:bg-muted'
                }`}
                onClick={() => onTimestampClick(timestamp.secondsFromStart)}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                      isCurrentOrPassed
                        ? 'bg-cyan text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{timestamp.title}</span>
                    {isCurrentOrPassed && !isNext && (
                      <span className="text-xs bg-cyan/20 text-cyan-muted px-2 py-0.5 rounded">
                        Watched
                      </span>
                    )}
                    {isNext && (
                      <ChevronRight className="h-4 w-4 text-cyan flex-shrink-0" />
                    )}
                  </div>

                  {timestamp.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {timestamp.description}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(timestamp.secondsFromStart)}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
