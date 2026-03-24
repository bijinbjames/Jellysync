import { useState, useRef, useCallback, useEffect } from 'react';

interface CodeInputProps {
  value?: string;
  onChange?: (code: string) => void;
  error?: boolean;
  onSubmit?: (code: string) => void;
}

export function CodeInput({ value, onChange, error, onSubmit }: CodeInputProps) {
  const [internalCode, setInternalCode] = useState('');
  const code = value ?? internalCode;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const prevErrorRef = useRef(false);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (onChange) {
        onChange(newCode);
      } else {
        setInternalCode(newCode);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (error && !prevErrorRef.current) {
      setShakeKey((k) => k + 1);
    }
    prevErrorRef.current = !!error;
  }, [error]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const chars = code.split('');

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (raw.length > 1) {
      const pasted = raw.slice(0, 6);
      handleCodeChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const newChars = [...chars];
    while (newChars.length < 6) newChars.push('');

    if (raw.length === 1) {
      newChars[index] = raw;
      handleCodeChange(newChars.join(''));
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newChars[index] = '';
      handleCodeChange(newChars.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!chars[index] && index > 0) {
        e.preventDefault();
        const newChars = [...chars];
        while (newChars.length < 6) newChars.push('');
        newChars[index - 1] = '';
        handleCodeChange(newChars.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'Enter' && code.length === 6 && onSubmit) {
      e.preventDefault();
      onSubmit(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    if (pasted) {
      handleCodeChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div
      key={shakeKey}
      ref={containerRef}
      className={`flex items-center justify-center gap-2 ${error ? 'animate-shake' : ''}`}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(ref) => {
            inputRefs.current[i] = ref;
          }}
          type="text"
          className={`w-12 h-14 bg-surface-container-high rounded-md text-center text-primary font-mono text-2xl font-bold tracking-[0.2em] border-2 outline-none transition-colors ${
            error
              ? 'border-error bg-error/10'
              : chars[i]
                ? 'border-primary bg-primary/10'
                : 'border-transparent focus:border-primary focus:bg-primary/10'
          }`}
          value={chars[i] ?? ''}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          maxLength={1}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label={`Code digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
