'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { PodcastMeta } from '@/types/intelligence';

interface Props {
  /** Podcast episode metadata */
  episode: PodcastMeta;
  /** Compact display mode */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Extract Spotify episode ID from a Spotify URL
 */
function extractSpotifyEpisodeId(url: string): string | null {
  // Handle various Spotify URL formats:
  // https://open.spotify.com/episode/EPISODE_ID
  // https://open.spotify.com/episode/EPISODE_ID?si=xxx
  // spotify:episode:EPISODE_ID
  const patterns = [
    /spotify\.com\/episode\/([a-zA-Z0-9]+)/,
    /spotify:episode:([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Spotify Embed Player Component
 */
function SpotifyEmbed({
  episodeId,
  compact,
  className,
}: {
  episodeId: string;
  compact?: boolean;
  className?: string;
}) {
  const height = compact ? 152 : 352;

  return (
    <div className={cn('rounded-lg overflow-hidden', className)}>
      <iframe
        src={`https://open.spotify.com/embed/episode/${episodeId}?utm_source=generator&theme=0`}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Episode Player"
        className="rounded-lg"
      />
    </div>
  );
}

/**
 * Audio player for podcast episodes
 * Supports Spotify embed (preferred) or self-hosted audio fallback
 */
export function PodcastPlayer({ episode, compact = false, className }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Check if this is the Overture (Episode 0) - special intro content
  const isOverture = episode.episodeNumber === 0;

  // Determine Spotify episode ID
  const spotifyEpisodeId =
    episode.spotifyEpisodeId ||
    (episode.spotifyUrl ? extractSpotifyEpisodeId(episode.spotifyUrl) : null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Use Spotify embed if episode ID is available
  if (spotifyEpisodeId) {
    if (compact) {
      return (
        <div className={cn('', className)}>
          <div className="mb-2">
            <Link
              href={`/intelligence/${episode.slug}`}
              className="block font-medium text-white hover:text-cyan transition-colors line-clamp-1 text-sm"
            >
              TX {String(episode.episodeNumber).padStart(3, "0")}: {episode.title}
            </Link>
            <p className="text-xs text-slate-dim">{episode.duration} min</p>
          </div>
          <SpotifyEmbed episodeId={spotifyEpisodeId} compact />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'p-6 rounded-xl bg-gradient-to-br from-purple-900/20 to-nex-surface',
          'border border-purple-500/20',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {episode.image ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={episode.image}
                alt={episode.imageAlt || episode.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-purple-500/20 text-purple-400">
              <Headphones className="h-8 w-8" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-purple-400 font-medium mb-1">
              Signal In the Static · Transmission {String(episode.episodeNumber).padStart(3, "0")}
            </p>
            <h3 className="text-xl font-headline text-white line-clamp-2">{episode.title}</h3>
            <p className="text-sm text-slate-dim mt-1">{episode.duration} minutes</p>
          </div>
        </div>

        {/* Spotify Embed */}
        <SpotifyEmbed episodeId={spotifyEpisodeId} />

        {/* Subscribe links */}
        {(episode.applePodcastsUrl || episode.youtubeUrl) && (
          <div className="mt-6 pt-4 border-t border-nex-light">
            <p className="text-sm text-slate-dim mb-3">Also available on:</p>
            <div className="flex gap-3">
              {episode.applePodcastsUrl && (
                <a
                  href={episode.applePodcastsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Apple Podcasts
                </a>
              )}
              {episode.youtubeUrl && (
                <a
                  href={episode.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  YouTube
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Custom player for self-hosted audio
  // Only renders if audioUrl is provided and no Spotify embed

  if (!episode.audioUrl) {
    // No audio source available - show placeholder
    return (
      <div
        className={cn(
          'p-6 rounded-xl bg-gradient-to-br from-purple-900/20 to-nex-surface',
          'border border-purple-500/20',
          className
        )}
      >
        <div className="flex items-start gap-4">
          {episode.image ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={episode.image}
                alt={episode.imageAlt || episode.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-purple-500/20 text-purple-400">
              <Headphones className="h-8 w-8" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-purple-400 font-medium mb-1">
              Signal In the Static {isOverture ? '' : `· Transmission ${String(episode.episodeNumber).padStart(3, "0")}`}
            </p>
            <h3 className="text-xl font-headline text-white line-clamp-2">{episode.title}</h3>
            <p className="text-sm text-slate-dim mt-1">{episode.duration} minutes</p>
          </div>
        </div>

        {/* Coming soon notice for Overture */}
        {isOverture && (
          <div className="mt-4 p-3 rounded-lg bg-cyan/5 border border-cyan/20">
            <p className="text-sm text-cyan font-medium">Transmission 001 Coming Soon</p>
            <p className="text-xs text-slate-dim mt-1">Why We Built AlgoVigilance — January 2026</p>
          </div>
        )}

        {/* Subscribe links */}
        {(episode.spotifyUrl || episode.applePodcastsUrl) && (
          <div className="mt-6 pt-4 border-t border-nex-light">
            <p className="text-sm text-slate-dim mb-3">Subscribe to be notified:</p>
            <div className="flex gap-3">
              {episode.spotifyUrl && (
                <a
                  href={episode.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  Spotify
                </a>
              )}
              {episode.applePodcastsUrl && (
                <a
                  href={episode.applePodcastsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Apple Podcasts
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact mode for sidebar/list display
  if (compact) {
    return (
      <div className={cn('p-4 rounded-lg bg-nex-surface border border-nex-light', className)}>
        <audio ref={audioRef} src={episode.audioUrl} preload="metadata" />

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <div className="flex-1 min-w-0">
            <Link
              href={`/intelligence/podcast/${episode.slug}`}
              className="block font-medium text-white hover:text-cyan transition-colors line-clamp-1"
            >
              {isOverture ? episode.title : `TX ${String(episode.episodeNumber).padStart(3, "0")}: ${episode.title}`}
            </Link>
            <p className="text-sm text-slate-dim">{episode.duration} min</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <Slider
            value={[currentTime]}
            max={duration || episode.duration * 60 || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-dim mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || episode.duration * 60)}</span>
          </div>
        </div>

        {/* Coming soon notice for Overture */}
        {isOverture && (
          <div className="mt-3 p-2 rounded bg-cyan/5 border border-cyan/20">
            <p className="text-xs text-cyan font-medium">Transmission 001: Why We Built AlgoVigilance</p>
            <p className="text-xs text-slate-dim">Coming January 2026</p>
          </div>
        )}
      </div>
    );
  }

  // Full custom player
  return (
    <div
      className={cn(
        'p-6 rounded-xl bg-gradient-to-br from-purple-900/20 to-nex-surface',
        'border border-purple-500/20',
        className
      )}
    >
      <audio ref={audioRef} src={episode.audioUrl} preload="metadata" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {episode.image ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={episode.image}
              alt={episode.imageAlt || episode.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-purple-500/20 text-purple-400">
            <Headphones className="h-8 w-8" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-purple-400 font-medium mb-1">
            Signal In the Static · Transmission {String(episode.episodeNumber).padStart(3, "0")}
          </p>
          <h3 className="text-xl font-headline text-white line-clamp-2">{episode.title}</h3>
          <p className="text-sm text-slate-dim mt-1">{episode.duration} minutes</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          max={duration || episode.duration * 60 || 100}
          step={1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-sm text-slate-dim mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || episode.duration * 60)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-15)}
            className="h-9 w-9 text-slate-light hover:text-white"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-purple-500 text-white hover:bg-purple-400"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(30)}
            className="h-9 w-9 text-slate-light hover:text-white"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-9 w-9 text-slate-light hover:text-white"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-24 cursor-pointer"
          />
        </div>
      </div>

      {/* Subscribe links */}
      {(episode.spotifyUrl || episode.applePodcastsUrl) && (
        <div className="mt-6 pt-4 border-t border-nex-light">
          <p className="text-sm text-slate-dim mb-3">Subscribe on:</p>
          <div className="flex gap-3">
            {episode.spotifyUrl && (
              <a
                href={episode.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-400 hover:text-green-300"
              >
                Spotify
              </a>
            )}
            {episode.applePodcastsUrl && (
              <a
                href={episode.applePodcastsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Apple Podcasts
              </a>
            )}
            {episode.youtubeUrl && (
              <a
                href={episode.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-400 hover:text-red-300"
              >
                YouTube
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
