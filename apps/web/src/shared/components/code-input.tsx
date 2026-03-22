import { useState } from 'react';

interface CodeInputProps {
  onSubmit: (code: string) => void;
}

export function CodeInput({ onSubmit }: CodeInputProps) {
  const [code, setCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setCode(cleaned);
  };

  const handleSubmit = () => {
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      e.preventDefault();
      onSubmit(code);
    }
  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        className="flex-1 bg-surface-container-lowest rounded-md min-h-[48px] px-3 text-on-surface font-display text-lg font-bold tracking-widest outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary"
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter code"
        maxLength={6}
        style={{ textTransform: 'uppercase' }}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={code.length !== 6}
        aria-label="Join room"
        className={`min-h-[48px] px-4 rounded-md font-display text-sm font-bold cursor-pointer transition-colors ${
          code.length === 6
            ? 'bg-primary text-surface-container-lowest'
            : 'bg-surface-container-lowest text-on-surface-variant cursor-not-allowed'
        }`}
      >
        Join
      </button>
    </div>
  );
}
