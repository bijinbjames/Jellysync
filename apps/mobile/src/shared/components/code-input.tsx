import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';

interface CodeInputProps {
  onSubmit: (code: string) => void;
}

export function CodeInput({ onSubmit }: CodeInputProps) {
  const [code, setCode] = useState('');

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setCode(cleaned);
  };

  const handleSubmit = () => {
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <View
      className="flex-row items-center gap-2"
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <TextInput
        className="flex-1 bg-surface-container-lowest rounded-md min-h-[48px] px-3 text-on-surface font-display text-lg font-bold tracking-widest"
        value={code}
        onChangeText={handleChange}
        placeholder="Enter code"
        placeholderTextColor="#bcc9c7"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={code.length !== 6}
        accessibilityRole="button"
        accessibilityLabel="Join room"
        className={`min-h-[48px] px-4 rounded-md items-center justify-center ${
          code.length === 6 ? 'bg-primary' : 'bg-surface-container-lowest'
        }`}
      >
        <Text
          className={`font-display text-sm font-bold ${
            code.length === 6 ? 'text-surface-container-lowest' : 'text-on-surface-variant'
          }`}
        >
          Join
        </Text>
      </Pressable>
    </View>
  );
}
