import { useState, useCallback, useRef } from 'react';
import { Share, Clipboard } from 'react-native';

export function useShareRoom(code: string) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deepLink = `jellysync://room/${code}`;

  const shareRoom = useCallback(async () => {
    try {
      await Share.share({
        message: `Join my JellySync room!\n\nRoom Code: ${code}\n${deepLink}`,
      });
    } catch {
      // User cancelled or share failed silently
    }
  }, [code, deepLink]);

  const copyCode = useCallback(async () => {
    Clipboard.setString(code);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return { shareRoom, copyCode, copied };
}
