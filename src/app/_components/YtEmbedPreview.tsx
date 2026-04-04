"use client";

import { extractYoutubeVideoId } from "@/lib/youtubeEmbed";

type Props = {
  url: string;
  className?: string;
};

/**
 * In-admin iframe preview for YouTube URLs. Embed availability matches YouTube’s rules
 * (same as the app — error 152 usually means embedding disabled for that video).
 */
export default function YtEmbedPreview({ url, className = "" }: Props) {
  const id = extractYoutubeVideoId(url);
  if (!id) {
    return (
      <p
        className={`text-[11px] text-white/45 leading-snug ${className}`}
      >
        Preview supports YouTube links. For Facebook or other URLs, test playback in the mobile
        app (WebView) or open the link in a browser.
      </p>
    );
  }

  return (
    <div
      className={`aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black ${className}`}
    >
      <iframe
        title="Stream preview"
        className="w-full h-full min-h-[140px]"
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
