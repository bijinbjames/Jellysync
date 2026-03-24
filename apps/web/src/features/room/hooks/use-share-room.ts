import { useState, useCallback, useRef } from 'react';

export function useShareRoom(code: string) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webLink = `${window.location.origin}/room/${code}`;

  const shareRoom = useCallback(async () => {
    const shareData = {
      title: 'Join my JellySync room!',
      text: `Room Code: ${code}`,
      url: webLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — fall back to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${webLink}`);
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${webLink}`);
    }
  }, [code, webLink]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return { shareRoom, copyCode, copied };
}
