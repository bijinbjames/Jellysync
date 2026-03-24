import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { authStore } from '../lib/auth';
import { roomStore } from '../lib/room';
import { GlassHeader } from '../shared/components/glass-header';
import { CodeInput } from '../shared/components/code-input';
import { useWs } from '../shared/providers/websocket-provider';
import {
  createWsMessage,
  ROOM_MESSAGE_TYPE,
  type RoomStatePayload,
} from '@jellysync/shared';

const JOIN_TIMEOUT_MS = 10_000;

export default function JoinScreen() {
  const navigate = useNavigate();
  const username = useStore(authStore, (s) => s.username);
  const { send, subscribe } = useWs();

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const joiningCodeRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      const payload = msg.payload as RoomStatePayload;
      if (!joiningCodeRef.current || payload.roomCode !== joiningCodeRef.current) return;
      joiningCodeRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setJoining(false);
      navigate(`/room/${payload.roomCode}`);
    });

    const unsubErr = subscribe('error', (msg) => {
      const errPayload = msg.payload as { code: string; message: string; context?: string };
      if (errPayload.context === 'room:join') {
        joiningCodeRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setError(true);
        setErrorMessage(errPayload.message || "This code doesn't match an active room \u2014 check with your host");
        setJoining(false);
      }
    });

    return () => {
      unsub();
      unsubErr();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [subscribe, navigate]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (error) {
      setError(false);
      setErrorMessage('');
    }
  };

  const handleJoin = () => {
    if (code.length !== 6 || joining) return;
    setJoining(true);
    setError(false);
    setErrorMessage('');
    joiningCodeRef.current = code;
    send(createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username ?? 'User' }));
    timeoutRef.current = setTimeout(() => {
      joiningCodeRef.current = null;
      setJoining(false);
      setError(true);
      setErrorMessage('Connection timed out \u2014 please try again');
    }, JOIN_TIMEOUT_MS);
  };

  const canJoin = code.length === 6 && !joining;

  return (
    <div className="min-h-screen bg-surface">
      <GlassHeader variant="navigation" title="Join Room" onBack={() => navigate('/')} />

      <main className="px-6 pb-12 pt-4 max-w-screen-xl mx-auto flex flex-col gap-8 items-center">
        <div className="flex flex-col items-center gap-2 pt-8">
          <span className="text-5xl">👥</span>
          <h2 className="text-on-surface font-display text-xl font-bold text-center mt-2">
            Join a Watch Party
          </h2>
          <p className="text-on-surface-variant font-body text-sm text-center">
            Enter the 6-character code from your host
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <CodeInput value={code} onChange={handleCodeChange} error={error} onSubmit={handleJoin} />
          {error && errorMessage ? (
            <p className="text-error text-sm text-center font-body">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleJoin}
          disabled={!canJoin}
          aria-label="Join Room"
          className={`w-full max-w-sm min-h-[48px] rounded-md font-display text-base font-bold transition-colors cursor-pointer ${
            canJoin
              ? 'gradient-primary text-on-primary'
              : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}
        >
          {joining ? 'Joining...' : 'Join Room'}
        </button>

        <div className="w-full max-w-sm flex items-center gap-3">
          <div className="flex-1 h-px bg-outline/20" />
          <span className="text-on-surface-variant text-sm font-body">or</span>
          <div className="flex-1 h-px bg-outline/20" />
        </div>

        <p className="text-primary font-body text-sm text-center">
          Ask your host for a direct link
        </p>
      </main>
    </div>
  );
}
