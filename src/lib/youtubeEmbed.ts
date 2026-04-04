/** Extract 11-char YouTube video id from common URL shapes. */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const m = url
    .trim()
    .match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|live\/|watch\?v=|shorts\/))([\w-]{11})/i
    );
  return m?.[1] ?? null;
}
