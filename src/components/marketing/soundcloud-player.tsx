/**
 * SoundCloud embedded player for the About page.
 * Uses SoundCloud's oEmbed widget — zero JS deps, server-renderable.
 */

interface SoundCloudPlayerProps {
  /** SoundCloud URL (track, playlist, or profile). URL-encoded in the embed src. */
  url: string;
  /** Player height in px. 166 for single track, 450 for playlist. */
  height?: number;
  /** Accent color (hex without #). Default: ff5500 (SoundCloud orange). */
  color?: string;
}

export function SoundCloudPlayer({
  url,
  height = 450,
  color = "00c2cb",
}: SoundCloudPlayerProps) {
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <iframe
        width="100%"
        height={height}
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23${color}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
        title="SoundCloud Player"
      />
    </div>
  );
}
