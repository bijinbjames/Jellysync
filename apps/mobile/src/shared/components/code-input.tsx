import { useState, useRef, useEffect, useCallback } from 'react';
import { TextInput, Animated } from 'react-native';

interface CodeInputProps {
  value?: string;
  onChange?: (code: string) => void;
  error?: boolean;
}

export function CodeInput({ value, onChange, error }: CodeInputProps) {
  const [internalCode, setInternalCode] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const code = value ?? internalCode;
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
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
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    prevErrorRef.current = !!error;
  }, [error, shakeAnim]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const chars = code.split('');

  const handleCharChange = (index: number, text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6);
      handleCodeChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const newChars = [...chars];
    while (newChars.length < 6) newChars.push('');

    if (cleaned.length === 1) {
      newChars[index] = cleaned;
      handleCodeChange(newChars.join(''));
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newChars[index] = '';
      handleCodeChange(newChars.join('').replace(/\0+$/, ''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (!chars[index] && index > 0) {
        const newChars = [...chars];
        while (newChars.length < 6) newChars.push('');
        newChars[index - 1] = '';
        handleCodeChange(newChars.join('').replace(/\0+$/, ''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <Animated.View
      className="flex-row items-center justify-center gap-2"
      style={{ transform: [{ translateX: shakeAnim }] }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            inputRefs.current[i] = ref;
          }}
          className={`w-12 h-14 bg-surface-container-high rounded-md text-center text-primary font-mono text-2xl font-bold tracking-[0.2em] border-2 ${
            error ? 'border-error' : chars[i] ? 'border-primary' : 'border-transparent'
          }`}
          style={error ? { backgroundColor: 'rgba(208, 188, 255, 0.1)' } : focusedIndex === i ? { backgroundColor: 'rgba(208, 188, 255, 0.1)' } : undefined}
          value={chars[i] ?? ''}
          onChangeText={(text) => handleCharChange(i, text)}
          onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex((prev) => (prev === i ? null : prev))}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          inputMode="text"
          accessibilityLabel={`Code digit ${i + 1}`}
        />
      ))}
    </Animated.View>
  );
}
